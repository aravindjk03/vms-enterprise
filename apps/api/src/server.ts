import { buildApp } from './app.js';
import { loadApiConfig } from './config.js';
import { assertRuntimeRoleIsRestricted, createPool } from './db.js';

async function main(): Promise<void> {
  const config = loadApiConfig();
  const db = createPool(config);

  const privilegedProblem = await assertRuntimeRoleIsRestricted(db, config.allowPrivilegedDbRole);
  const app = await buildApp({ config, db });
  if (privilegedProblem) {
    app.log.warn(`DEVELOPMENT ONLY: ${privilegedProblem}; tenant row-level security is NOT enforced for this connection.`);
  }

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);
    await app.close();
    await db.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen({ host: config.host, port: config.port });
}

main().catch(err => {
  console.error(`✗ API failed to start: ${(err as Error).message}`);
  process.exit(1);
});
