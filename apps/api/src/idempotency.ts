import { createHash } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Tx } from './db.js';
import type { AuthenticatedUser } from './context.js';
import { HttpError } from './errors.js';

export interface HandlerResult {
  status: number;
  body: unknown;
  replayed?: boolean;
}

/** Sends a handler result. Call only after the transaction has committed. */
export function sendResult(reply: FastifyReply, result: HandlerResult) {
  if (result.replayed) reply.header('Idempotent-Replay', 'true');
  return reply.code(result.status).send(result.body);
}

const KEY_RE = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Makes a mutating request safe to retry. With an `Idempotency-Key` header, the first response
 * is stored in the caller's tenant transaction; a retry with the same key and body replays it,
 * and a different body under the same key is rejected. Concurrent duplicates collide on the
 * unique key, which rolls the loser's whole transaction back (no double write).
 */
export async function idempotent(
  tx: Tx,
  user: AuthenticatedUser,
  request: FastifyRequest,
  handler: () => Promise<HandlerResult>
): Promise<HandlerResult> {
  const key = request.headers['idempotency-key'];
  if (key === undefined) {
    return handler();
  }
  if (typeof key !== 'string' || !KEY_RE.test(key)) {
    throw new HttpError(400, 'INVALID_IDEMPOTENCY_KEY', 'Idempotency-Key must be 8–128 letters, digits, "-" or "_".');
  }

  const hash = createHash('sha256')
    .update(`${request.method} ${request.url}\n${JSON.stringify(request.body ?? null)}`)
    .digest('hex');
  const existing = await tx.query<{ request_hash: string; response_status: number; response_body: unknown }>(
    'SELECT request_hash, response_status, response_body FROM api_idempotency_keys WHERE user_id = $1 AND idempotency_key = $2',
    [user.userId, key]
  );
  if (existing.rows[0]) {
    if (existing.rows[0].request_hash !== hash) {
      throw new HttpError(422, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used for a different request.');
    }
    return { status: existing.rows[0].response_status, body: existing.rows[0].response_body, replayed: true };
  }

  const result = await handler();
  // Only successful outcomes are replayable; a rejected request may be corrected and retried.
  if (result.status >= 400) return result;
  try {
    await tx.query(
      `INSERT INTO api_idempotency_keys (tenant_id, user_id, idempotency_key, request_method, request_path, request_hash, response_status, response_body)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.tenantId, user.userId, key, request.method, request.url.slice(0, 512), hash, result.status, JSON.stringify(result.body ?? null)]
    );
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      throw new HttpError(409, 'IDEMPOTENCY_IN_PROGRESS', 'An identical request is being processed. Retry shortly.');
    }
    throw err;
  }
  return result;
}
