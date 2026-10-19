import type { NormalizedTransportActivity, ESGActivityRecord, EmissionFactor, GHGCalculationResult, SourceDomain, ScopeMappingRule, AccountingScopeMapping, ESGActivityType } from '@vms/types';
export { AccountingScopeMapping };
export declare class OrganizationalScopeRegistry {
    private rules;
    constructor();
    private seedDefaultRules;
    registerRule(rule: ScopeMappingRule): void;
    resolveScopeMapping(tenantId: string | undefined, sourceDomain: SourceDomain, transport: NormalizedTransportActivity, activityType?: ESGActivityType): AccountingScopeMapping;
}
export declare class EmissionFactorRegistry {
    private factors;
    constructor();
    private seedDefaultFactors;
    registerFactor(factor: EmissionFactor): void;
    /**
     * Finds the active emission factor valid on the specific transaction timestamp.
     * Reproduces historical calculations accurately!
     */
    resolveFactor(factorCode: string, geography: string, asOfDate?: Date, specificVersion?: string): EmissionFactor;
}
export declare class GHGCalculationEngine {
    private factorRegistry;
    private scopeRegistry;
    constructor(factorRegistry?: EmissionFactorRegistry, scopeRegistry?: OrganizationalScopeRegistry);
    getFactorRegistry(): EmissionFactorRegistry;
    getScopeRegistry(): OrganizationalScopeRegistry;
    /**
     * Delegates to the Configurable Organizational Scope Registry.
     * Never hardcodes mapping in UI or engine core!
     */
    resolveScopeMapping(sourceDomain: SourceDomain, transport: NormalizedTransportActivity, activityType?: ESGActivityType): AccountingScopeMapping;
    /**
     * Maps transport dimensional vectors to standard emission factor codes.
     */
    resolveFactorCode(transport: NormalizedTransportActivity): string;
    /**
     * Generates a source-linked ESG activity record from operational transport.
     * Retains complete source provenance and resolves proper activity units.
     */
    captureActivityFromTransport(siteId: string, transport: NormalizedTransportActivity): ESGActivityRecord;
    /**
     * Executes mathematically sound GHG emission calculation with versioned factor binding.
     * Evaluates occupancy distribution only for passenger mobility (not freight/fuel!).
     * Generates RFC 8785 canonical JSON cryptographic hash for auditability.
     */
    calculateEmissions(activity: ESGActivityRecord, transport: NormalizedTransportActivity, options?: {
        specificVersion?: string;
        geography?: string;
        asOfDate?: Date;
    }): GHGCalculationResult;
}
