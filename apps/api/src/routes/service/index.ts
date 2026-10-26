import type { FastifyInstance } from 'fastify';
import type { RouteContext } from '../../app.js';
import { registerProviderRoutes } from './providers.js';
import { registerRequestRoutes } from './requests.js';
import { registerWorkOrderRoutes } from './work-orders.js';
import { registerJourneyRoutes } from './journeys.js';
import { registerScheduleRoutes } from './schedules.js';

/** Service / Work Management module (Part 9): /api/v1/service/* */
export async function registerServiceRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  await registerProviderRoutes(app, ctx);
  await registerRequestRoutes(app, ctx);
  await registerWorkOrderRoutes(app, ctx);
  await registerJourneyRoutes(app, ctx);
  await registerScheduleRoutes(app, ctx);
}
