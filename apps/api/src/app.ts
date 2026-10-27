import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { RateLimiter, SecurityHeadersService } from '@vms/access';
import { loadMigrationFiles } from '../../../packages/database/scripts/migrate.js';
import type { ApiConfig } from './config.js';
import { pendingMigrations, withTenant, type Db, type Tx } from './db.js';
import { loadUserContext, type AuthenticatedUser } from './context.js';
import { HttpError } from './errors.js';
import { verifyAccessToken, type AccessTokenClaims } from './security/tokens.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerDomainRoutes } from './routes/domain.js';
import { registerServiceRoutes } from './routes/service/index.js';
import { DomainRuleError } from '@vms/service';

declare module 'fastify' {
  interface FastifyRequest {
    claims?: AccessTokenClaims;
  }
}

export interface AppDeps {
  config: ApiConfig;
  db: Db;
}

export interface RouteContext extends AppDeps {
  /** Runs `fn` in the authenticated user's tenant transaction with a freshly loaded user context. */
  asUser<T>(request: FastifyRequest, fn: (tx: Tx, user: AuthenticatedUser) => Promise<T>): Promise<T>;
  rateLimiter: RateLimiter;
}

const API_CSP =
  "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
const WEB_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const { config, db } = deps;
  const app = Fastify({
    trustProxy: config.trustProxy,
    bodyLimit: 256 * 1024,
    genReqId: () => randomUUID(),
    logger: {
      level: process.env['LOG_LEVEL'] || (config.env === 'test' ? 'silent' : 'info'),
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    },
  });

  const rateLimiter = new RateLimiter({
    DEFAULT: { limit: 600, windowMs: 60_000 },
    LOGIN: { limit: config.loginRateLimitPerMinute, windowMs: 60_000 },
    LOGIN_IP: { limit: config.loginRateLimitPerIpPerMinute ?? 100, windowMs: 60_000 },
  });
  // Behind a reverse proxy without TRUST_PROXY every client appears as the proxy's address.
  let proxyWarningLogged = false;
  const pruneTimer = setInterval(() => rateLimiter.prune(), 60_000);
  pruneTimer.unref();
  app.addHook('onClose', async () => clearInterval(pruneTimer));

  // --- Security headers & CORS -------------------------------------------------
  const baseHeaders = SecurityHeadersService.getHeaders({ isProduction: config.env === 'production' });
  app.addHook('onRequest', async (request, reply) => {
    const isApi = request.url.startsWith('/api/');
    for (const [name, value] of Object.entries(baseHeaders)) {
      if (name !== 'Content-Security-Policy') reply.header(name, value);
    }
    reply.header('Content-Security-Policy', isApi ? API_CSP : WEB_CSP);
    reply.header('X-Request-Id', request.id);
    if (isApi) reply.header('Cache-Control', 'no-store');

    const origin = request.headers.origin;
    if (origin && config.corsAllowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Vary', 'Origin');
      if (request.method === 'OPTIONS') {
        reply.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,Idempotency-Key');
        reply.header('Access-Control-Max-Age', '600');
        return reply.code(204).send();
      }
    }

    if (!config.trustProxy && !proxyWarningLogged && request.headers['x-forwarded-for']) {
      proxyWarningLogged = true;
      request.log.warn('Requests carry X-Forwarded-For but TRUST_PROXY is off: client addresses (rate limits, audit) will be the proxy. Set TRUST_PROXY=true behind a trusted proxy.');
    }
    // Signed-in traffic is limited per user, so users behind one proxy or NAT address do not share a budget.
    const bearer = request.headers.authorization?.startsWith('Bearer ') ? request.headers.authorization.slice(7) : undefined;
    const caller = bearer ? verifyAccessToken(bearer, config.jwtSecret) : null;
    const limitKey = caller ? `user:${caller.sub}` : `ip:${request.ip}`;
    if (isApi && !rateLimiter.checkRateLimit(limitKey, 'DEFAULT').allowed) {
      return reply.code(429).send({ error: { code: 'RATE_LIMITED', message: 'Too many requests.', requestId: request.id } });
    }
  });

  // --- Uniform, non-leaky error responses ----------------------------------------
  app.setErrorHandler((err: unknown, request, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: { code: err.code, message: err.message, requestId: request.id } });
    }
    if (err instanceof DomainRuleError) {
      const badInput = ['INVALID_DATES', 'INVALID_RULE', 'RANGE_TOO_LARGE'].includes(err.code);
      return reply.code(badInput ? 400 : 409).send({ error: { code: err.code, message: err.message, requestId: request.id } });
    }
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          requestId: request.id,
          details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
        },
      });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.code(status).send({ error: { code: 'BAD_REQUEST', message: 'Malformed request.', requestId: request.id } });
    }
    request.log.error({ err }, 'unhandled error');
    return reply.code(500).send({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', requestId: request.id } });
  });

  // --- Authentication -------------------------------------------------------------
  const asUser: RouteContext['asUser'] = async (request, fn) => {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const claims = token ? verifyAccessToken(token, config.jwtSecret) : null;
    if (!claims) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
    }
    request.claims = claims;
    return withTenant(db, claims.tid, async tx => {
      const session = await tx.query(
        'SELECT 1 FROM user_sessions WHERE session_id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > now()',
        [claims.sid, claims.sub]
      );
      if (session.rowCount === 0) {
        throw new HttpError(401, 'SESSION_REVOKED', 'Session is no longer valid.');
      }
      const user = await loadUserContext(tx, claims.sub, claims.sid);
      if (!user) {
        throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
      }
      // A temporary password grants nothing except setting a new one (and signing out).
      if (user.mustChangePassword && !request.url.startsWith('/api/v1/auth/')) {
        throw new HttpError(403, 'PASSWORD_CHANGE_REQUIRED', 'Set a new password to continue.');
      }
      // The organization requires two-step verification for administrators: set it up first.
      if (user.mfaEnrollmentRequired && !request.url.startsWith('/api/v1/auth/')) {
        throw new HttpError(403, 'MFA_ENROLLMENT_REQUIRED', 'Your organization requires two-step verification. Set it up to continue.');
      }
      return fn(tx, user);
    });
  };

  const ctx: RouteContext = { ...deps, asUser, rateLimiter };

  // --- Health ---------------------------------------------------------------------
  const expectedVersions = loadMigrationFiles().map(m => m.version);
  app.get('/api/health', async () => ({ status: 'ok' }));
  app.get('/api/ready', async (_request, reply: FastifyReply) => {
    try {
      await db.query('SELECT 1');
      const pending = await pendingMigrations(db, expectedVersions);
      if (pending.length > 0) {
        return reply.code(503).send({ status: 'degraded', reason: 'pending migrations', pending });
      }
      return { status: 'ready' };
    } catch {
      return reply.code(503).send({ status: 'unavailable', reason: 'database unreachable' });
    }
  });

  await registerAuthRoutes(app, ctx);
  await registerAdminRoutes(app, ctx);
  await registerDomainRoutes(app, ctx);
  await registerServiceRoutes(app, ctx);

  app.all('/api/*', async (_request: FastifyRequest) => {
    throw new HttpError(404, 'NOT_FOUND', 'Endpoint not found.');
  });

  // --- Web console (single-page app) ---------------------------------------------------
  const webDir = config.webDistDir ? resolve(config.webDistDir) : undefined;
  if (webDir && existsSync(join(webDir, 'index.html'))) {
    await app.register(fastifyStatic, { root: webDir, index: false, wildcard: false });
    app.get('/', (_request, reply) => reply.sendFile('index.html'));
    app.get('/assets/*', (request, reply) => {
      const asset = (request.params as { '*': string })['*'];
      if (!/^[A-Za-z0-9._-]+$/.test(asset)) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found.', requestId: request.id } });
      }
      reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      return reply.sendFile(join('assets', asset));
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found.', requestId: request.id } });
    });
  }

  return app;
}
