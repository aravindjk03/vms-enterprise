import type { FastifyBaseLogger } from 'fastify';
import { withTenant, type Db, type Tx } from '../db.js';

export interface OutboxEvent {
  outboxId: string;
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
  retryCount: number;
}

export type OutboxHandler = (tx: Tx, event: OutboxEvent) => Promise<void>;

export interface OutboxWorkerOptions {
  batchSize?: number;
  maxAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  logger?: Pick<FastifyBaseLogger, 'warn' | 'error' | 'info'>;
}

/**
 * Durable, at-least-once processor for workflow_outbox_events.
 * - Claims only event types it can handle (others, e.g. notification delivery, stay queued and visible).
 * - Each event is handled in its own tenant-scoped transaction; handlers must be idempotent.
 * - Failures back off exponentially with jitter; after maxAttempts the event is parked as FAILED
 *   (dead letter) for operator review. Source records are never touched by a failure.
 */
export class OutboxWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly opts: Required<Omit<OutboxWorkerOptions, 'logger'>> & Pick<OutboxWorkerOptions, 'logger'>;

  constructor(
    private readonly db: Db,
    private readonly handlers: Record<string, OutboxHandler>,
    options: OutboxWorkerOptions = {}
  ) {
    this.opts = {
      batchSize: options.batchSize ?? 25,
      maxAttempts: options.maxAttempts ?? 8,
      baseBackoffMs: options.baseBackoffMs ?? 5_000,
      maxBackoffMs: options.maxBackoffMs ?? 15 * 60_000,
      logger: options.logger,
    };
  }

  async runOnce(): Promise<{ processed: number; failed: number }> {
    const types = Object.keys(this.handlers);
    if (types.length === 0) return { processed: 0, failed: 0 };
    const claimed = await this.db.query<{ outbox_id: string; tenant_id: string; event_type: string; retry_count: number }>(
      'SELECT * FROM outbox_claim($1, $2)',
      [types, this.opts.batchSize]
    );

    let processed = 0;
    let failed = 0;
    for (const row of claimed.rows) {
      try {
        await withTenant(this.db, row.tenant_id, async tx => {
          const { rows } = await tx.query<{ payload: Record<string, unknown> }>(
            'SELECT payload FROM workflow_outbox_events WHERE outbox_id = $1 FOR UPDATE',
            [row.outbox_id]
          );
          if (!rows[0]) return;
          await this.handlers[row.event_type](tx, {
            outboxId: row.outbox_id,
            tenantId: row.tenant_id,
            eventType: row.event_type,
            payload: rows[0].payload,
            retryCount: row.retry_count,
          });
          await tx.query(
            "UPDATE workflow_outbox_events SET status = 'DISPATCHED', dispatched_at = now(), locked_at = NULL, error_details = NULL WHERE outbox_id = $1",
            [row.outbox_id]
          );
        });
        processed++;
      } catch (err) {
        failed++;
        await this.recordFailure(row, err as Error);
      }
    }
    return { processed, failed };
  }

  private async recordFailure(row: { outbox_id: string; tenant_id: string; retry_count: number; event_type: string }, err: Error): Promise<void> {
    const attempt = row.retry_count + 1;
    const exhausted = attempt >= this.opts.maxAttempts;
    const backoff = Math.min(this.opts.maxBackoffMs, this.opts.baseBackoffMs * 2 ** (attempt - 1));
    const delayMs = Math.round(backoff * (0.8 + Math.random() * 0.4));
    try {
      await withTenant(this.db, row.tenant_id, tx =>
        tx.query(
          `UPDATE workflow_outbox_events
              SET retry_count = $2, status = $3, error_details = $4, locked_at = NULL,
                  next_attempt_at = now() + make_interval(secs => $5::double precision)
            WHERE outbox_id = $1`,
          [row.outbox_id, attempt, exhausted ? 'FAILED' : 'PENDING', String(err.message).slice(0, 1000), delayMs / 1000]
        )
      );
    } catch (bookkeepingError) {
      // The claim times out (stale lock) and the event is retried later; nothing is lost.
      this.opts.logger?.error({ err: bookkeepingError, outboxId: row.outbox_id }, 'outbox failure bookkeeping failed');
    }
    this.opts.logger?.warn({ outboxId: row.outbox_id, eventType: row.event_type, attempt, exhausted, error: err.message }, 'outbox event failed');
  }

  start(intervalMs = 5_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.running) return;
      this.running = true;
      this.runOnce()
        .catch(err => this.opts.logger?.error({ err }, 'outbox worker cycle failed'))
        .finally(() => {
          this.running = false;
        });
    }, intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
