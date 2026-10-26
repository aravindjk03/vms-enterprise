import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RouteContext } from '../../app.js';
import { authorize } from '../../context.js';
import { isUuid } from '../../db.js';
import { HttpError, notFound } from '../../errors.js';
import { idempotent, sendResult } from '../../idempotency.js';
import { audit, CategoryCode, DateOnly, likePattern, Paging, requireSite, siteScope, Uuid } from './common.js';

const ProviderCreate = z
  .object({
    externalOrgId: Uuid.optional(),
    newOrganization: z
      .object({
        code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/, 'letters, digits, "-" or "_"'),
        legalName: z.string().trim().min(2).max(255),
        tradeName: z.string().trim().max(255).optional(),
      })
      .optional(),
    providerCode: z.string().trim().min(2).max(64).regex(/^[A-Za-z0-9_-]+$/, 'letters, digits, "-" or "_"'),
    categories: z.array(CategoryCode).min(1).max(30),
    siteIds: z.array(Uuid).max(200).default([]),
    internalOwnerUserId: Uuid.optional(),
    agreementReference: z.string().trim().max(128).optional(),
    effectiveFrom: DateOnly.optional(),
    effectiveTo: DateOnly.optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine(v => !!v.externalOrgId !== !!v.newOrganization, { message: 'Provide either externalOrgId or newOrganization', path: ['externalOrgId'] })
  .refine(v => !v.effectiveFrom || !v.effectiveTo || v.effectiveTo >= v.effectiveFrom, { message: 'effectiveTo precedes effectiveFrom', path: ['effectiveTo'] });

const ProviderUpdate = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED']).optional(),
  categories: z.array(CategoryCode).min(1).max(30).optional(),
  siteIds: z.array(Uuid).max(200).optional(),
  internalOwnerUserId: Uuid.nullable().optional(),
  agreementReference: z.string().trim().max(128).nullable().optional(),
  effectiveTo: DateOnly.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  reason: z.string().trim().min(3).max(500),
});

const TechnicianCreate = z
  .object({
    providerId: Uuid,
    personId: Uuid.optional(),
    newPerson: z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100) }).optional(),
    certificationLevel: z.string().trim().max(64).optional(),
    badgeId: z.string().trim().max(64).optional(),
    effectiveFrom: DateOnly.optional(),
    effectiveTo: DateOnly.optional(),
  })
  .refine(v => !!v.personId !== !!v.newPerson, { message: 'Provide either personId or newPerson', path: ['personId'] });

const TechnicianUpdate = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  certificationLevel: z.string().trim().max(64).nullable().optional(),
  effectiveTo: DateOnly.nullable().optional(),
  reason: z.string().trim().min(3).max(500),
});

export async function registerProviderRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  // Canonical external organizations available to become (or already being) service providers.
  app.get('/api/v1/service/organizations', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_MANAGE');
      const q = z.object({ search: z.string().trim().max(100).optional() }).parse(request.query);
      const { rows } = await tx.query(
        `SELECT o.org_id AS "id", o.code, o.legal_name AS "legalName", o.trade_name AS "tradeName",
                (SELECT service_provider_id FROM service_providers sp WHERE sp.external_org_id = o.org_id) AS "serviceProviderId",
                EXISTS (SELECT 1 FROM contractor_companies cc WHERE cc.external_org_id = o.org_id) AS "isContractor"
           FROM external_organizations o
          WHERE ($1::text IS NULL OR o.legal_name ILIKE '%' || $1 || '%' OR o.code ILIKE '%' || $1 || '%')
          ORDER BY o.legal_name LIMIT 100`,
        [likePattern(q.search)]
      );
      return { items: rows };
    })
  );

  // Internal staff who can own service work (maintenance leads, provider owners).
  app.get('/api/v1/service/staff', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_MANAGE');
      const { rows } = await tx.query(
        `SELECT user_id AS "userId", full_name AS "fullName" FROM users WHERE is_active AND status = 'ACTIVE' ORDER BY full_name LIMIT 500`
      );
      return { items: rows };
    })
  );

  app.get('/api/v1/service/providers', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = Paging.extend({
        status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED']).optional(),
        category: CategoryCode.optional(),
        search: z.string().trim().max(100).optional(),
      }).parse(request.query);
      const { rows } = await tx.query(
        `SELECT sp.service_provider_id AS "id", sp.provider_code AS "providerCode",
                coalesce(o.trade_name, o.legal_name) AS "name", o.legal_name AS "legalName", sp.status,
                sp.effective_from AS "effectiveFrom", sp.effective_to AS "effectiveTo",
                coalesce((SELECT array_agg(category_code ORDER BY category_code) FROM service_provider_categories c WHERE c.service_provider_id = sp.service_provider_id), '{}') AS "categories",
                (SELECT count(*) FROM service_provider_sites s WHERE s.service_provider_id = sp.service_provider_id)::int AS "siteCount",
                (SELECT count(*) FROM service_technicians t WHERE t.service_provider_id = sp.service_provider_id AND t.status = 'ACTIVE')::int AS "activeTechnicians",
                (SELECT count(*) FROM service_work_orders w WHERE w.service_provider_id = sp.service_provider_id
                   AND w.status IN ('PENDING_APPROVAL','APPROVED','SCHEDULED','IN_PROGRESS','ON_HOLD','COMPLETION_SUBMITTED'))::int AS "openWorkOrders",
                EXISTS (SELECT 1 FROM contractor_companies cc WHERE cc.external_org_id = sp.external_org_id) AS "isContractor",
                count(*) OVER()::int AS "total"
           FROM service_providers sp JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE ($1::text IS NULL OR sp.status = $1)
            AND ($2::text IS NULL OR EXISTS (SELECT 1 FROM service_provider_categories c WHERE c.service_provider_id = sp.service_provider_id AND c.category_code = $2))
            AND ($3::text IS NULL OR o.legal_name ILIKE '%' || $3 || '%' OR coalesce(o.trade_name,'') ILIKE '%' || $3 || '%' OR sp.provider_code ILIKE '%' || $3 || '%')
          ORDER BY 3 LIMIT $4 OFFSET $5`,
        [q.status ?? null, q.category ?? null, likePattern(q.search), q.limit, q.offset]
      );
      return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0, limit: q.limit, offset: q.offset };
    })
  );

  app.get('/api/v1/service/providers/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const { id } = request.params as { id: string };
      if (!isUuid(id)) throw notFound('Provider');
      const { rows } = await tx.query(
        `SELECT sp.service_provider_id AS "id", sp.provider_code AS "providerCode", sp.status,
                o.org_id AS "externalOrgId", o.legal_name AS "legalName", o.trade_name AS "tradeName", o.tax_identifier AS "taxIdentifier",
                sp.agreement_reference AS "agreementReference", sp.effective_from AS "effectiveFrom", sp.effective_to AS "effectiveTo",
                sp.notes, sp.internal_owner_user_id AS "internalOwnerUserId", u.full_name AS "internalOwnerName",
                EXISTS (SELECT 1 FROM contractor_companies cc WHERE cc.external_org_id = sp.external_org_id) AS "isContractor"
           FROM service_providers sp JOIN external_organizations o ON o.org_id = sp.external_org_id
           LEFT JOIN users u ON u.user_id = sp.internal_owner_user_id
          WHERE sp.service_provider_id = $1`,
        [id]
      );
      if (!rows[0]) throw notFound('Provider');
      const categories = await tx.query('SELECT category_code AS "code" FROM service_provider_categories WHERE service_provider_id = $1 ORDER BY 1', [id]);
      const sites = await tx.query(
        `SELECT s.site_id AS "siteId", s.name FROM service_provider_sites ps JOIN sites s ON s.site_id = ps.site_id
          WHERE ps.service_provider_id = $1 ORDER BY s.name`,
        [id]
      );
      const technicians = await tx.query(
        `SELECT t.technician_id AS "id", p.display_name AS "name", t.certification_level AS "certificationLevel", t.status
           FROM service_technicians t JOIN persons p ON p.person_id = t.person_id
          WHERE t.service_provider_id = $1 ORDER BY p.display_name`,
        [id]
      );
      const workOrders = await tx.query(
        `SELECT work_order_id AS "id", reference_number AS "referenceNumber", coalesce(title, equipment_tag) AS "title", status,
                scheduled_start AS "scheduledStart"
           FROM service_work_orders WHERE service_provider_id = $1 AND ($2::uuid[] IS NULL OR site_id = ANY($2))
          ORDER BY scheduled_start DESC LIMIT 25`,
        [id, siteScope(user)]
      );
      return {
        ...rows[0],
        categories: categories.rows.map(r => r.code),
        sites: sites.rows,
        technicians: technicians.rows,
        recentWorkOrders: workOrders.rows,
      };
    })
  );

  app.post('/api/v1/service/providers', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        authorize(user, 'SERVICE_MANAGE');
        const body = ProviderCreate.parse(request.body);

        let orgId = body.externalOrgId;
        if (body.newOrganization) {
          const dup = await tx.query('SELECT org_id FROM external_organizations WHERE code = $1', [body.newOrganization.code]);
          if (dup.rowCount) {
            throw new HttpError(409, 'DUPLICATE_ORGANIZATION', 'An organization with this code already exists; select it instead of creating a duplicate.');
          }
          const created = await tx.query<{ org_id: string }>(
            `INSERT INTO external_organizations (tenant_id, code, legal_name, trade_name) VALUES ($1, $2, $3, $4) RETURNING org_id`,
            [user.tenantId, body.newOrganization.code, body.newOrganization.legalName, body.newOrganization.tradeName ?? null]
          );
          orgId = created.rows[0].org_id;
        } else {
          const org = await tx.query('SELECT 1 FROM external_organizations WHERE org_id = $1', [orgId]);
          if (!org.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Organization not found.');
        }
        const existing = await tx.query('SELECT service_provider_id FROM service_providers WHERE external_org_id = $1', [orgId]);
        if (existing.rowCount) throw new HttpError(409, 'ALREADY_PROVIDER', 'This organization is already a service provider.');

        for (const siteId of body.siteIds) {
          requireSite(user, siteId);
          const site = await tx.query('SELECT 1 FROM sites WHERE site_id = $1', [siteId]);
          if (!site.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown site in siteIds.');
        }
        if (body.internalOwnerUserId) {
          const owner = await tx.query('SELECT 1 FROM users WHERE user_id = $1 AND is_active', [body.internalOwnerUserId]);
          if (!owner.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Internal owner not found.');
        }

        let providerId: string;
        try {
          const { rows } = await tx.query<{ service_provider_id: string }>(
            `INSERT INTO service_providers (tenant_id, external_org_id, provider_code, service_category, status, internal_owner_user_id,
                                            agreement_reference, effective_from, effective_to, notes, created_by, updated_by)
             VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, $8, $9, $10, $10) RETURNING service_provider_id`,
            [
              user.tenantId,
              orgId,
              body.providerCode,
              body.categories[0],
              body.internalOwnerUserId ?? null,
              body.agreementReference ?? null,
              body.effectiveFrom ?? null,
              body.effectiveTo ?? null,
              body.notes ?? null,
              user.userId,
            ]
          );
          providerId = rows[0].service_provider_id;
        } catch (err) {
          if ((err as { code?: string }).code === '23505') throw new HttpError(409, 'DUPLICATE_PROVIDER_CODE', 'Provider code already in use.');
          throw err;
        }
        for (const code of new Set(body.categories)) {
          await tx.query('INSERT INTO service_provider_categories (tenant_id, service_provider_id, category_code) VALUES ($1, $2, $3)', [
            user.tenantId,
            providerId,
            code,
          ]);
        }
        for (const siteId of new Set(body.siteIds)) {
          await tx.query('INSERT INTO service_provider_sites (tenant_id, service_provider_id, site_id) VALUES ($1, $2, $3)', [user.tenantId, providerId, siteId]);
        }
        await audit(tx, user, request.id, 'SERVICE_PROVIDER_REGISTERED', 'SERVICE_PROVIDER', providerId, {
          after: { providerCode: body.providerCode, categories: body.categories, siteIds: body.siteIds },
        });
        return { status: 201, body: { id: providerId } };
      })
    );
    return sendResult(reply, result);
  });

  app.patch('/api/v1/service/providers/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_MANAGE');
      const { id } = request.params as { id: string };
      if (!isUuid(id)) throw notFound('Provider');
      const body = ProviderUpdate.parse(request.body);
      const before = await tx.query<{
        status: string;
        internal_owner_user_id: string | null;
        agreement_reference: string | null;
        effective_to: string | null;
        notes: string | null;
      }>(
        `SELECT status, internal_owner_user_id, agreement_reference, effective_to::text AS effective_to, notes
           FROM service_providers WHERE service_provider_id = $1 FOR UPDATE`,
        [id]
      );
      const prior = before.rows[0];
      if (!prior) throw notFound('Provider');
      const currentSites = (await tx.query<{ site_id: string }>('SELECT site_id FROM service_provider_sites WHERE service_provider_id = $1', [id])).rows.map(r => r.site_id);
      const currentCategories = (
        await tx.query<{ category_code: string }>('SELECT category_code FROM service_provider_categories WHERE service_provider_id = $1', [id])
      ).rows.map(r => r.category_code);

      // Site-scoped managers change the provider's authorizations at their own sites only. Attributes
      // that apply at every site need a tenant-wide administrator once the provider also serves other sites.
      const scope = siteScope(user);
      if (scope !== null && currentSites.some(s => !scope.includes(s))) {
        const changed = <T,>(next: T | undefined, current: T) => next !== undefined && next !== current;
        const categoriesChanged =
          body.categories !== undefined &&
          (new Set(body.categories).size !== currentCategories.length || body.categories.some(c => !currentCategories.includes(c)));
        if (
          changed(body.status, prior.status) ||
          categoriesChanged ||
          changed(body.internalOwnerUserId, prior.internal_owner_user_id) ||
          changed(body.agreementReference, prior.agreement_reference) ||
          changed(body.effectiveTo, prior.effective_to) ||
          changed(body.notes, prior.notes)
        ) {
          throw new HttpError(403, 'FORBIDDEN', 'This provider also serves sites you do not manage. Ask an organization administrator to change it.');
        }
      }
      if (body.internalOwnerUserId) {
        const owner = await tx.query('SELECT 1 FROM users WHERE user_id = $1 AND is_active', [body.internalOwnerUserId]);
        if (!owner.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Internal owner not found.');
      }

      await tx.query(
        `UPDATE service_providers SET
            status = coalesce($2, status),
            internal_owner_user_id = CASE WHEN $3::boolean THEN $4 ELSE internal_owner_user_id END,
            agreement_reference = CASE WHEN $5::boolean THEN $6 ELSE agreement_reference END,
            effective_to = CASE WHEN $7::boolean THEN $8::date ELSE effective_to END,
            notes = CASE WHEN $9::boolean THEN $10 ELSE notes END,
            updated_by = $11, updated_at = now()
          WHERE service_provider_id = $1`,
        [
          id,
          body.status ?? null,
          body.internalOwnerUserId !== undefined,
          body.internalOwnerUserId ?? null,
          body.agreementReference !== undefined,
          body.agreementReference ?? null,
          body.effectiveTo !== undefined,
          body.effectiveTo ?? null,
          body.notes !== undefined,
          body.notes ?? null,
          user.userId,
        ]
      );
      if (body.categories) {
        await tx.query('DELETE FROM service_provider_categories WHERE service_provider_id = $1 AND NOT (category_code = ANY($2))', [id, body.categories]);
        for (const code of new Set(body.categories)) {
          await tx.query(
            'INSERT INTO service_provider_categories (tenant_id, service_provider_id, category_code) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [user.tenantId, id, code]
          );
        }
      }
      if (body.siteIds) {
        const requested = new Set(body.siteIds);
        // Only sites inside the user's scope can be removed; authorizations elsewhere are kept.
        const removable = scope === null ? currentSites : currentSites.filter(s => scope.includes(s));
        const toRemove = removable.filter(s => !requested.has(s));
        if (toRemove.length) {
          await tx.query('DELETE FROM service_provider_sites WHERE service_provider_id = $1 AND site_id = ANY($2)', [id, toRemove]);
        }
        for (const siteId of requested) {
          if (currentSites.includes(siteId)) continue;
          requireSite(user, siteId);
          const site = await tx.query('SELECT 1 FROM sites WHERE site_id = $1', [siteId]);
          if (!site.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown site in siteIds.');
          await tx.query('INSERT INTO service_provider_sites (tenant_id, service_provider_id, site_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
            user.tenantId,
            id,
            siteId,
          ]);
        }
      }
      await audit(tx, user, request.id, 'SERVICE_PROVIDER_UPDATED', 'SERVICE_PROVIDER', id, {
        before: { ...prior, siteIds: currentSites, categories: currentCategories },
        after: { ...body, reason: undefined },
        reason: body.reason,
      });
      return { id };
    })
  );

  // -------------------------------------------------------------------------
  // Technicians
  // -------------------------------------------------------------------------
  app.get('/api/v1/service/technicians', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const q = Paging.extend({
        providerId: Uuid.optional(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
        search: z.string().trim().max(100).optional(),
      }).parse(request.query);
      const { rows } = await tx.query(
        `SELECT t.technician_id AS "id", p.display_name AS "name", t.certification_level AS "certificationLevel", t.badge_id AS "badgeId",
                t.status, t.effective_to AS "effectiveTo", sp.service_provider_id AS "providerId",
                coalesce(o.trade_name, o.legal_name) AS "providerName",
                EXISTS (SELECT 1 FROM contractor_workers cw WHERE cw.person_id = t.person_id) AS "isContractorWorker",
                (SELECT count(*) FROM service_assignments a WHERE a.technician_id = t.technician_id AND a.status = 'ASSIGNED' AND a.planned_end >= now())::int AS "upcomingAssignments",
                count(*) OVER()::int AS "total"
           FROM service_technicians t
           JOIN persons p ON p.person_id = t.person_id
           JOIN service_providers sp ON sp.service_provider_id = t.service_provider_id
           JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE ($1::uuid IS NULL OR t.service_provider_id = $1)
            AND ($2::text IS NULL OR t.status = $2)
            AND ($3::text IS NULL OR p.display_name ILIKE '%' || $3 || '%' OR coalesce(t.badge_id,'') ILIKE '%' || $3 || '%')
          ORDER BY p.display_name LIMIT $4 OFFSET $5`,
        [q.providerId ?? null, q.status ?? null, likePattern(q.search), q.limit, q.offset]
      );
      return { items: rows.map(({ total: _t, ...r }) => r), total: rows[0]?.total ?? 0, limit: q.limit, offset: q.offset };
    })
  );

  app.get('/api/v1/service/technicians/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_READ');
      const { id } = request.params as { id: string };
      if (!isUuid(id)) throw notFound('Technician');
      const { rows } = await tx.query(
        `SELECT t.technician_id AS "id", t.person_id AS "personId", p.display_name AS "name", t.certification_level AS "certificationLevel",
                t.badge_id AS "badgeId", t.status, t.effective_from AS "effectiveFrom", t.effective_to AS "effectiveTo",
                sp.service_provider_id AS "providerId", coalesce(o.trade_name, o.legal_name) AS "providerName",
                (SELECT cc.vendor_code FROM contractor_workers cw JOIN contractor_companies cc ON cc.company_id = cw.company_id
                  WHERE cw.person_id = t.person_id LIMIT 1) AS "contractorVendorCode"
           FROM service_technicians t JOIN persons p ON p.person_id = t.person_id
           JOIN service_providers sp ON sp.service_provider_id = t.service_provider_id
           JOIN external_organizations o ON o.org_id = sp.external_org_id
          WHERE t.technician_id = $1`,
        [id]
      );
      if (!rows[0]) throw notFound('Technician');
      const assignments = await tx.query(
        `SELECT a.assignment_id AS "id", a.planned_start AS "plannedStart", a.planned_end AS "plannedEnd", a.status,
                w.work_order_id AS "workOrderId", w.reference_number AS "workOrderReference", coalesce(w.title, w.equipment_tag) AS "workOrderTitle",
                w.status AS "workOrderStatus", s.name AS "siteName"
           FROM service_assignments a JOIN service_work_orders w ON w.work_order_id = a.work_order_id JOIN sites s ON s.site_id = w.site_id
          WHERE a.technician_id = $1 AND ($2::uuid[] IS NULL OR w.site_id = ANY($2))
          ORDER BY a.planned_start DESC LIMIT 50`,
        [id, siteScope(user)]
      );
      return { ...rows[0], isContractorWorker: !!rows[0].contractorVendorCode, assignments: assignments.rows };
    })
  );

  app.post('/api/v1/service/technicians', async (request, reply) => {
    const result = await ctx.asUser(request, async (tx, user) =>
      idempotent(tx, user, request, async () => {
        authorize(user, 'SERVICE_MANAGE');
        const body = TechnicianCreate.parse(request.body);
        const provider = await tx.query('SELECT status FROM service_providers WHERE service_provider_id = $1', [body.providerId]);
        if (!provider.rows[0]) throw new HttpError(400, 'VALIDATION_ERROR', 'Provider not found.');

        let personId = body.personId;
        if (body.newPerson) {
          const created = await tx.query<{ person_id: string }>(
            `INSERT INTO persons (tenant_id, first_name, last_name, display_name, created_by, updated_by)
             VALUES ($1, $2, $3, $4, $5, $5) RETURNING person_id`,
            [user.tenantId, body.newPerson.firstName, body.newPerson.lastName, `${body.newPerson.firstName} ${body.newPerson.lastName}`, user.userId]
          );
          personId = created.rows[0].person_id;
        } else {
          const person = await tx.query('SELECT 1 FROM persons WHERE person_id = $1', [personId]);
          if (!person.rowCount) throw new HttpError(400, 'VALIDATION_ERROR', 'Person not found.');
        }
        try {
          const { rows } = await tx.query<{ technician_id: string }>(
            `INSERT INTO service_technicians (tenant_id, service_provider_id, person_id, certification_level, badge_id, effective_from, effective_to, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING technician_id`,
            [user.tenantId, body.providerId, personId, body.certificationLevel ?? null, body.badgeId ?? null, body.effectiveFrom ?? null, body.effectiveTo ?? null, user.userId]
          );
          await audit(tx, user, request.id, 'SERVICE_TECHNICIAN_REGISTERED', 'SERVICE_TECHNICIAN', rows[0].technician_id, {
            after: { providerId: body.providerId, personId },
          });
          return { status: 201, body: { id: rows[0].technician_id, personId } };
        } catch (err) {
          if ((err as { code?: string }).code === '23505') {
            throw new HttpError(409, 'ALREADY_TECHNICIAN', 'This person is already a technician of this provider.');
          }
          throw err;
        }
      })
    );
    return sendResult(reply, result);
  });

  app.patch('/api/v1/service/technicians/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'SERVICE_MANAGE');
      const { id } = request.params as { id: string };
      if (!isUuid(id)) throw notFound('Technician');
      const body = TechnicianUpdate.parse(request.body);
      const before = await tx.query('SELECT status, certification_level, effective_to FROM service_technicians WHERE technician_id = $1 FOR UPDATE', [id]);
      if (!before.rows[0]) throw notFound('Technician');
      await tx.query(
        `UPDATE service_technicians SET status = coalesce($2, status),
            certification_level = CASE WHEN $3::boolean THEN $4 ELSE certification_level END,
            effective_to = CASE WHEN $5::boolean THEN $6::date ELSE effective_to END, updated_at = now()
          WHERE technician_id = $1`,
        [id, body.status ?? null, body.certificationLevel !== undefined, body.certificationLevel ?? null, body.effectiveTo !== undefined, body.effectiveTo ?? null]
      );
      await audit(tx, user, request.id, 'SERVICE_TECHNICIAN_UPDATED', 'SERVICE_TECHNICIAN', id, {
        before: before.rows[0],
        after: { status: body.status, certificationLevel: body.certificationLevel, effectiveTo: body.effectiveTo },
        reason: body.reason,
      });
      return { id };
    })
  );
}
