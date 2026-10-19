import { z } from 'zod';
export declare const SourceDomainSchema: z.ZodEnum<{
    CONTRACTOR: "CONTRACTOR";
    CUSTOMER: "CUSTOMER";
    MATERIAL: "MATERIAL";
    SERVICE: "SERVICE";
    VEHICLE: "VEHICLE";
    VISITOR: "VISITOR";
}>;
export declare const TransactionStageSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    APPROVAL: "APPROVAL";
    CHECK_IN: "CHECK_IN";
    CHECK_OUT: "CHECK_OUT";
    CLOSED: "CLOSED";
    DRAFT: "DRAFT";
    SCHEDULED: "SCHEDULED";
}>;
export declare const TransactionStatusSchema: z.ZodEnum<{
    APPROVED: "APPROVED";
    BLOCKED: "BLOCKED";
    CANCELLED: "CANCELLED";
    CHECKED_OUT: "CHECKED_OUT";
    COMPLETED: "COMPLETED";
    CONFIRMED: "CONFIRMED";
    DRAFT: "DRAFT";
    EXPIRED: "EXPIRED";
    IN_PROGRESS: "IN_PROGRESS";
    NO_SHOW: "NO_SHOW";
    ON_PREMISES: "ON_PREMISES";
    PENDING: "PENDING";
    REJECTED: "REJECTED";
}>;
export declare const CommonTransactionEnvelopeSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    sourceDomain: z.ZodEnum<{
        CONTRACTOR: "CONTRACTOR";
        CUSTOMER: "CUSTOMER";
        MATERIAL: "MATERIAL";
        SERVICE: "SERVICE";
        VEHICLE: "VEHICLE";
        VISITOR: "VISITOR";
    }>;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const TransportModeSchema: z.ZodEnum<{
    AUTO_RICKSHAW: "AUTO_RICKSHAW";
    BUS: "BUS";
    CAR: "CAR";
    FLIGHT: "FLIGHT";
    OTHER: "OTHER";
    TAXI_CAB: "TAXI_CAB";
    TRAIN: "TRAIN";
    TRUCK: "TRUCK";
    TWO_WHEELER: "TWO_WHEELER";
    VAN: "VAN";
    WALKING: "WALKING";
}>;
export declare const OwnershipTypeSchema: z.ZodEnum<{
    COMPANY: "COMPANY";
    CUSTOMER: "CUSTOMER";
    HIRED: "HIRED";
    OTHER: "OTHER";
    PERSONAL: "PERSONAL";
    PUBLIC: "PUBLIC";
    SUPPLIER: "SUPPLIER";
    THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
    TRANSPORTER: "TRANSPORTER";
}>;
export declare const VehicleClassSchema: z.ZodEnum<{
    COACH_BUS: "COACH_BUS";
    CONTAINER_CARRIER: "CONTAINER_CARRIER";
    HATCHBACK: "HATCHBACK";
    HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
    LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
    MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
    MINI_BUS: "MINI_BUS";
    OTHER: "OTHER";
    SEDAN: "SEDAN";
    SUV: "SUV";
    TRAILER: "TRAILER";
    TWO_WHEELER: "TWO_WHEELER";
}>;
export declare const FuelTypeSchema: z.ZodEnum<{
    CNG: "CNG";
    DIESEL: "DIESEL";
    ELECTRIC: "ELECTRIC";
    HYBRID_DIESEL: "HYBRID_DIESEL";
    HYBRID_PETROL: "HYBRID_PETROL";
    HYDROGEN: "HYDROGEN";
    OTHER: "OTHER";
    PETROL: "PETROL";
}>;
export declare const UsageTypeSchema: z.ZodEnum<{
    CARPOOL: "CARPOOL";
    COMPANY_POOL: "COMPANY_POOL";
    INDIVIDUAL: "INDIVIDUAL";
    OTHER: "OTHER";
    PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
    SHARED: "SHARED";
}>;
export declare const JourneyTypeSchema: z.ZodEnum<{
    LOCAL_CAMPUS: "LOCAL_CAMPUS";
    MULTI_STOP: "MULTI_STOP";
    ONE_WAY: "ONE_WAY";
    ROUND_TRIP: "ROUND_TRIP";
}>;
export declare const TripDirectionSchema: z.ZodEnum<{
    INBOUND: "INBOUND";
    INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
    OUTBOUND: "OUTBOUND";
}>;
export declare const MeasurementMethodSchema: z.ZodEnum<{
    DECLARED_MANIFEST: "DECLARED_MANIFEST";
    ESTIMATED_TABLE: "ESTIMATED_TABLE";
    GIS_ROUTING: "GIS_ROUTING";
    ODOMETER: "ODOMETER";
    TELEMATICS_GPS: "TELEMATICS_GPS";
    WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
}>;
export declare const DataProvenanceSchema: z.ZodEnum<{
    IMPORTED: "IMPORTED";
    MEASURED: "MEASURED";
    SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
    SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
    USER_PROVIDED: "USER_PROVIDED";
}>;
export declare const NormalizedTransportActivitySchema: z.ZodObject<{
    transportId: z.ZodString;
    tenantId: z.ZodString;
    sourceDomain: z.ZodEnum<{
        CONTRACTOR: "CONTRACTOR";
        CUSTOMER: "CUSTOMER";
        MATERIAL: "MATERIAL";
        SERVICE: "SERVICE";
        VEHICLE: "VEHICLE";
        VISITOR: "VISITOR";
    }>;
    sourceTransactionId: z.ZodString;
    mode: z.ZodEnum<{
        AUTO_RICKSHAW: "AUTO_RICKSHAW";
        BUS: "BUS";
        CAR: "CAR";
        FLIGHT: "FLIGHT";
        OTHER: "OTHER";
        TAXI_CAB: "TAXI_CAB";
        TRAIN: "TRAIN";
        TRUCK: "TRUCK";
        TWO_WHEELER: "TWO_WHEELER";
        VAN: "VAN";
        WALKING: "WALKING";
    }>;
    ownership: z.ZodEnum<{
        COMPANY: "COMPANY";
        CUSTOMER: "CUSTOMER";
        HIRED: "HIRED";
        OTHER: "OTHER";
        PERSONAL: "PERSONAL";
        PUBLIC: "PUBLIC";
        SUPPLIER: "SUPPLIER";
        THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
        TRANSPORTER: "TRANSPORTER";
    }>;
    vehicleClass: z.ZodEnum<{
        COACH_BUS: "COACH_BUS";
        CONTAINER_CARRIER: "CONTAINER_CARRIER";
        HATCHBACK: "HATCHBACK";
        HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
        LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
        MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
        MINI_BUS: "MINI_BUS";
        OTHER: "OTHER";
        SEDAN: "SEDAN";
        SUV: "SUV";
        TRAILER: "TRAILER";
        TWO_WHEELER: "TWO_WHEELER";
    }>;
    fuelType: z.ZodEnum<{
        CNG: "CNG";
        DIESEL: "DIESEL";
        ELECTRIC: "ELECTRIC";
        HYBRID_DIESEL: "HYBRID_DIESEL";
        HYBRID_PETROL: "HYBRID_PETROL";
        HYDROGEN: "HYDROGEN";
        OTHER: "OTHER";
        PETROL: "PETROL";
    }>;
    usageType: z.ZodEnum<{
        CARPOOL: "CARPOOL";
        COMPANY_POOL: "COMPANY_POOL";
        INDIVIDUAL: "INDIVIDUAL";
        OTHER: "OTHER";
        PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
        SHARED: "SHARED";
    }>;
    occupancy: z.ZodNumber;
    originLocation: z.ZodString;
    destinationLocation: z.ZodString;
    distanceKm: z.ZodNumber;
    journeyType: z.ZodDefault<z.ZodEnum<{
        LOCAL_CAMPUS: "LOCAL_CAMPUS";
        MULTI_STOP: "MULTI_STOP";
        ONE_WAY: "ONE_WAY";
        ROUND_TRIP: "ROUND_TRIP";
    }>>;
    tripDirection: z.ZodDefault<z.ZodEnum<{
        INBOUND: "INBOUND";
        INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
        OUTBOUND: "OUTBOUND";
    }>>;
    fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
    payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
    distanceProvenance: z.ZodDefault<z.ZodEnum<{
        IMPORTED: "IMPORTED";
        MEASURED: "MEASURED";
        SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
        SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
        USER_PROVIDED: "USER_PROVIDED";
    }>>;
    measurementMethod: z.ZodDefault<z.ZodEnum<{
        DECLARED_MANIFEST: "DECLARED_MANIFEST";
        ESTIMATED_TABLE: "ESTIMATED_TABLE";
        GIS_ROUTING: "GIS_ROUTING";
        ODOMETER: "ODOMETER";
        TELEMATICS_GPS: "TELEMATICS_GPS";
        WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
    }>>;
    dataSource: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const ESGActivityTypeSchema: z.ZodEnum<{
    BUSINESS_TRAVEL: "BUSINESS_TRAVEL";
    COMMUTER_TRAVEL: "COMMUTER_TRAVEL";
    DOWNSTREAM_LOGISTICS: "DOWNSTREAM_LOGISTICS";
    FLEET_FUEL: "FLEET_FUEL";
    ON_SITE_EQUIPMENT: "ON_SITE_EQUIPMENT";
    UPSTREAM_LOGISTICS: "UPSTREAM_LOGISTICS";
}>;
export declare const AccountingScopeMappingSchema: z.ZodObject<{
    scope: z.ZodEnum<{
        SCOPE_1: "SCOPE_1";
        SCOPE_2: "SCOPE_2";
        SCOPE_3: "SCOPE_3";
    }>;
    category: z.ZodString;
    subcategory: z.ZodString;
    methodology: z.ZodString;
}, z.core.$strip>;
export declare const ScopeMappingRuleSchema: z.ZodObject<{
    ruleId: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    sourceDomain: z.ZodEnum<{
        CONTRACTOR: "CONTRACTOR";
        CUSTOMER: "CUSTOMER";
        MATERIAL: "MATERIAL";
        SERVICE: "SERVICE";
        VEHICLE: "VEHICLE";
        VISITOR: "VISITOR";
    }>;
    ownership: z.ZodOptional<z.ZodEnum<{
        COMPANY: "COMPANY";
        CUSTOMER: "CUSTOMER";
        HIRED: "HIRED";
        OTHER: "OTHER";
        PERSONAL: "PERSONAL";
        PUBLIC: "PUBLIC";
        SUPPLIER: "SUPPLIER";
        THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
        TRANSPORTER: "TRANSPORTER";
    }>>;
    tripDirection: z.ZodOptional<z.ZodEnum<{
        INBOUND: "INBOUND";
        INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
        OUTBOUND: "OUTBOUND";
    }>>;
    activityType: z.ZodOptional<z.ZodEnum<{
        BUSINESS_TRAVEL: "BUSINESS_TRAVEL";
        COMMUTER_TRAVEL: "COMMUTER_TRAVEL";
        DOWNSTREAM_LOGISTICS: "DOWNSTREAM_LOGISTICS";
        FLEET_FUEL: "FLEET_FUEL";
        ON_SITE_EQUIPMENT: "ON_SITE_EQUIPMENT";
        UPSTREAM_LOGISTICS: "UPSTREAM_LOGISTICS";
    }>>;
    scope: z.ZodEnum<{
        SCOPE_1: "SCOPE_1";
        SCOPE_2: "SCOPE_2";
        SCOPE_3: "SCOPE_3";
    }>;
    category: z.ZodString;
    subcategory: z.ZodString;
    methodology: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ESGActivityRecordSchema: z.ZodObject<{
    esgActivityId: z.ZodString;
    tenantId: z.ZodString;
    siteId: z.ZodString;
    sourceDomain: z.ZodEnum<{
        CONTRACTOR: "CONTRACTOR";
        CUSTOMER: "CUSTOMER";
        MATERIAL: "MATERIAL";
        SERVICE: "SERVICE";
        VEHICLE: "VEHICLE";
        VISITOR: "VISITOR";
    }>;
    sourceTransactionId: z.ZodString;
    transportId: z.ZodOptional<z.ZodString>;
    activityType: z.ZodEnum<{
        BUSINESS_TRAVEL: "BUSINESS_TRAVEL";
        COMMUTER_TRAVEL: "COMMUTER_TRAVEL";
        DOWNSTREAM_LOGISTICS: "DOWNSTREAM_LOGISTICS";
        FLEET_FUEL: "FLEET_FUEL";
        ON_SITE_EQUIPMENT: "ON_SITE_EQUIPMENT";
        UPSTREAM_LOGISTICS: "UPSTREAM_LOGISTICS";
    }>;
    activityQuantity: z.ZodNumber;
    activityUnit: z.ZodEnum<{
        KM: "KM";
        KWH: "KWH";
        LITRES: "LITRES";
        TONNE_KM: "TONNE_KM";
    }>;
    dataProvenance: z.ZodEnum<{
        IMPORTED: "IMPORTED";
        MEASURED: "MEASURED";
        SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
        SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
        USER_PROVIDED: "USER_PROVIDED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const EmissionFactorSchema: z.ZodObject<{
    factorId: z.ZodString;
    factorCode: z.ZodString;
    version: z.ZodString;
    source: z.ZodString;
    factorValue: z.ZodNumber;
    unit: z.ZodString;
    geography: z.ZodString;
    reportingYear: z.ZodNumber;
    methodology: z.ZodDefault<z.ZodString>;
    validFrom: z.ZodString;
    validTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gasScope: z.ZodDefault<z.ZodEnum<{
        CH4: "CH4";
        CO2: "CO2";
        CO2e: "CO2e";
        N2O: "N2O";
    }>>;
    evidenceDocUrl: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        DRAFT: "DRAFT";
        REVOKED: "REVOKED";
        SUPERSEDED: "SUPERSEDED";
    }>>;
    tenantId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const GHGCalculationResultSchema: z.ZodObject<{
    calculationId: z.ZodString;
    tenantId: z.ZodString;
    esgActivityId: z.ZodString;
    factorId: z.ZodString;
    factorVersion: z.ZodString;
    ghgScope: z.ZodEnum<{
        SCOPE_1: "SCOPE_1";
        SCOPE_2: "SCOPE_2";
        SCOPE_3: "SCOPE_3";
    }>;
    ghgCategory: z.ZodString;
    subcategory: z.ZodString;
    methodology: z.ZodString;
    factorValueUsed: z.ZodNumber;
    activityQuantity: z.ZodNumber;
    emissionsKgCO2e: z.ZodNumber;
    calculationHash: z.ZodString;
    calculatedAt: z.ZodDefault<z.ZodDate>;
    status: z.ZodDefault<z.ZodEnum<{
        FINAL: "FINAL";
        HISTORICAL_ARCHIVED: "HISTORICAL_ARCHIVED";
        NEEDS_RECALCULATION: "NEEDS_RECALCULATION";
    }>>;
}, z.core.$strip>;
export declare const VisitorCategorySchema: z.ZodEnum<{
    AUDITOR: "AUDITOR";
    CONSULTANT: "CONSULTANT";
    GOVERNMENT_OFFICIAL: "GOVERNMENT_OFFICIAL";
    GROUP_VISITOR: "GROUP_VISITOR";
    INTERVIEW_CANDIDATE: "INTERVIEW_CANDIDATE";
    NEW_VISITOR: "NEW_VISITOR";
    OTHER: "OTHER";
    REPEATED_VISITOR: "REPEATED_VISITOR";
    VIP_VISITOR: "VIP_VISITOR";
}>;
export declare const VisitorPurposeSchema: z.ZodEnum<{
    AUDIT: "AUDIT";
    CONSULTATION: "CONSULTATION";
    INSPECTION: "INSPECTION";
    INTERVIEW: "INTERVIEW";
    MEETING: "MEETING";
    OTHER: "OTHER";
    SITE_VISIT: "SITE_VISIT";
    TRAINING: "TRAINING";
    VENDOR_NEGOTIATION: "VENDOR_NEGOTIATION";
}>;
export declare const BookingModeSchema: z.ZodEnum<{
    EMERGENCY: "EMERGENCY";
    GROUP: "GROUP";
    RECURRING: "RECURRING";
    RESERVED: "RESERVED";
    WALK_IN: "WALK_IN";
}>;
export declare const VisitorTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sourceDomain: z.ZodLiteral<"VISITOR">;
    visitorCategory: z.ZodEnum<{
        AUDITOR: "AUDITOR";
        CONSULTANT: "CONSULTANT";
        GOVERNMENT_OFFICIAL: "GOVERNMENT_OFFICIAL";
        GROUP_VISITOR: "GROUP_VISITOR";
        INTERVIEW_CANDIDATE: "INTERVIEW_CANDIDATE";
        NEW_VISITOR: "NEW_VISITOR";
        OTHER: "OTHER";
        REPEATED_VISITOR: "REPEATED_VISITOR";
        VIP_VISITOR: "VIP_VISITOR";
    }>;
    purpose: z.ZodEnum<{
        AUDIT: "AUDIT";
        CONSULTATION: "CONSULTATION";
        INSPECTION: "INSPECTION";
        INTERVIEW: "INTERVIEW";
        MEETING: "MEETING";
        OTHER: "OTHER";
        SITE_VISIT: "SITE_VISIT";
        TRAINING: "TRAINING";
        VENDOR_NEGOTIATION: "VENDOR_NEGOTIATION";
    }>;
    bookingMode: z.ZodDefault<z.ZodEnum<{
        EMERGENCY: "EMERGENCY";
        GROUP: "GROUP";
        RECURRING: "RECURRING";
        RESERVED: "RESERVED";
        WALK_IN: "WALK_IN";
    }>>;
    visitorName: z.ZodString;
    visitorEmail: z.ZodOptional<z.ZodString>;
    visitorPhone: z.ZodOptional<z.ZodString>;
    governmentIdNumber: z.ZodOptional<z.ZodString>;
    governmentIdType: z.ZodOptional<z.ZodString>;
    governmentIdScanUrl: z.ZodOptional<z.ZodString>;
    facialBiometricTemplate: z.ZodOptional<z.ZodString>;
    hostUserId: z.ZodString;
    scheduledStart: z.ZodDate;
    scheduledEnd: z.ZodDate;
    actualCheckIn: z.ZodOptional<z.ZodDate>;
    actualCheckOut: z.ZodOptional<z.ZodDate>;
    transport: z.ZodOptional<z.ZodObject<{
        transportId: z.ZodString;
        tenantId: z.ZodString;
        sourceDomain: z.ZodEnum<{
            CONTRACTOR: "CONTRACTOR";
            CUSTOMER: "CUSTOMER";
            MATERIAL: "MATERIAL";
            SERVICE: "SERVICE";
            VEHICLE: "VEHICLE";
            VISITOR: "VISITOR";
        }>;
        sourceTransactionId: z.ZodString;
        mode: z.ZodEnum<{
            AUTO_RICKSHAW: "AUTO_RICKSHAW";
            BUS: "BUS";
            CAR: "CAR";
            FLIGHT: "FLIGHT";
            OTHER: "OTHER";
            TAXI_CAB: "TAXI_CAB";
            TRAIN: "TRAIN";
            TRUCK: "TRUCK";
            TWO_WHEELER: "TWO_WHEELER";
            VAN: "VAN";
            WALKING: "WALKING";
        }>;
        ownership: z.ZodEnum<{
            COMPANY: "COMPANY";
            CUSTOMER: "CUSTOMER";
            HIRED: "HIRED";
            OTHER: "OTHER";
            PERSONAL: "PERSONAL";
            PUBLIC: "PUBLIC";
            SUPPLIER: "SUPPLIER";
            THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
            TRANSPORTER: "TRANSPORTER";
        }>;
        vehicleClass: z.ZodEnum<{
            COACH_BUS: "COACH_BUS";
            CONTAINER_CARRIER: "CONTAINER_CARRIER";
            HATCHBACK: "HATCHBACK";
            HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
            LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
            MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
            MINI_BUS: "MINI_BUS";
            OTHER: "OTHER";
            SEDAN: "SEDAN";
            SUV: "SUV";
            TRAILER: "TRAILER";
            TWO_WHEELER: "TWO_WHEELER";
        }>;
        fuelType: z.ZodEnum<{
            CNG: "CNG";
            DIESEL: "DIESEL";
            ELECTRIC: "ELECTRIC";
            HYBRID_DIESEL: "HYBRID_DIESEL";
            HYBRID_PETROL: "HYBRID_PETROL";
            HYDROGEN: "HYDROGEN";
            OTHER: "OTHER";
            PETROL: "PETROL";
        }>;
        usageType: z.ZodEnum<{
            CARPOOL: "CARPOOL";
            COMPANY_POOL: "COMPANY_POOL";
            INDIVIDUAL: "INDIVIDUAL";
            OTHER: "OTHER";
            PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
            SHARED: "SHARED";
        }>;
        occupancy: z.ZodNumber;
        originLocation: z.ZodString;
        destinationLocation: z.ZodString;
        distanceKm: z.ZodNumber;
        journeyType: z.ZodDefault<z.ZodEnum<{
            LOCAL_CAMPUS: "LOCAL_CAMPUS";
            MULTI_STOP: "MULTI_STOP";
            ONE_WAY: "ONE_WAY";
            ROUND_TRIP: "ROUND_TRIP";
        }>>;
        tripDirection: z.ZodDefault<z.ZodEnum<{
            INBOUND: "INBOUND";
            INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
            OUTBOUND: "OUTBOUND";
        }>>;
        fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
        payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
        distanceProvenance: z.ZodDefault<z.ZodEnum<{
            IMPORTED: "IMPORTED";
            MEASURED: "MEASURED";
            SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
            SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
            USER_PROVIDED: "USER_PROVIDED";
        }>>;
        measurementMethod: z.ZodDefault<z.ZodEnum<{
            DECLARED_MANIFEST: "DECLARED_MANIFEST";
            ESTIMATED_TABLE: "ESTIMATED_TABLE";
            GIS_ROUTING: "GIS_ROUTING";
            ODOMETER: "ODOMETER";
            TELEMATICS_GPS: "TELEMATICS_GPS";
            WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
        }>>;
        dataSource: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CustomerVisitTypeSchema: z.ZodEnum<{
    CUSTOMER_AUDIT: "CUSTOMER_AUDIT";
    CUSTOMER_INSPECTION: "CUSTOMER_INSPECTION";
    CUSTOMER_MEETING: "CUSTOMER_MEETING";
    DELEGATION: "DELEGATION";
    DELEGATION_VISIT: "DELEGATION_VISIT";
    MANAGEMENT_VISIT: "MANAGEMENT_VISIT";
    OTHER: "OTHER";
    PLANT_VISIT: "PLANT_VISIT";
    PROCESS_REVIEW: "PROCESS_REVIEW";
    PRODUCT_REVIEW: "PRODUCT_REVIEW";
    QUALITY_VISIT: "QUALITY_VISIT";
    TECHNICAL_VISIT: "TECHNICAL_VISIT";
}>;
export declare const CustomerVisitTypeCodeSchema: z.ZodEnum<{
    CUSTOMER_AUDIT: "CUSTOMER_AUDIT";
    CUSTOMER_INSPECTION: "CUSTOMER_INSPECTION";
    CUSTOMER_MEETING: "CUSTOMER_MEETING";
    DELEGATION: "DELEGATION";
    DELEGATION_VISIT: "DELEGATION_VISIT";
    MANAGEMENT_VISIT: "MANAGEMENT_VISIT";
    OTHER: "OTHER";
    PLANT_VISIT: "PLANT_VISIT";
    PROCESS_REVIEW: "PROCESS_REVIEW";
    PRODUCT_REVIEW: "PRODUCT_REVIEW";
    QUALITY_VISIT: "QUALITY_VISIT";
    TECHNICAL_VISIT: "TECHNICAL_VISIT";
}>;
export declare const CustomerTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sourceDomain: z.ZodLiteral<"CUSTOMER">;
    customerAccountName: z.ZodString;
    visitType: z.ZodEnum<{
        CUSTOMER_AUDIT: "CUSTOMER_AUDIT";
        CUSTOMER_INSPECTION: "CUSTOMER_INSPECTION";
        CUSTOMER_MEETING: "CUSTOMER_MEETING";
        DELEGATION: "DELEGATION";
        DELEGATION_VISIT: "DELEGATION_VISIT";
        MANAGEMENT_VISIT: "MANAGEMENT_VISIT";
        OTHER: "OTHER";
        PLANT_VISIT: "PLANT_VISIT";
        PROCESS_REVIEW: "PROCESS_REVIEW";
        PRODUCT_REVIEW: "PRODUCT_REVIEW";
        QUALITY_VISIT: "QUALITY_VISIT";
        TECHNICAL_VISIT: "TECHNICAL_VISIT";
    }>;
    delegationSize: z.ZodDefault<z.ZodNumber>;
    executiveHostId: z.ZodString;
    ndaSigned: z.ZodDefault<z.ZodBoolean>;
    scheduledStart: z.ZodDate;
    scheduledEnd: z.ZodDate;
    transport: z.ZodOptional<z.ZodObject<{
        transportId: z.ZodString;
        tenantId: z.ZodString;
        sourceDomain: z.ZodEnum<{
            CONTRACTOR: "CONTRACTOR";
            CUSTOMER: "CUSTOMER";
            MATERIAL: "MATERIAL";
            SERVICE: "SERVICE";
            VEHICLE: "VEHICLE";
            VISITOR: "VISITOR";
        }>;
        sourceTransactionId: z.ZodString;
        mode: z.ZodEnum<{
            AUTO_RICKSHAW: "AUTO_RICKSHAW";
            BUS: "BUS";
            CAR: "CAR";
            FLIGHT: "FLIGHT";
            OTHER: "OTHER";
            TAXI_CAB: "TAXI_CAB";
            TRAIN: "TRAIN";
            TRUCK: "TRUCK";
            TWO_WHEELER: "TWO_WHEELER";
            VAN: "VAN";
            WALKING: "WALKING";
        }>;
        ownership: z.ZodEnum<{
            COMPANY: "COMPANY";
            CUSTOMER: "CUSTOMER";
            HIRED: "HIRED";
            OTHER: "OTHER";
            PERSONAL: "PERSONAL";
            PUBLIC: "PUBLIC";
            SUPPLIER: "SUPPLIER";
            THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
            TRANSPORTER: "TRANSPORTER";
        }>;
        vehicleClass: z.ZodEnum<{
            COACH_BUS: "COACH_BUS";
            CONTAINER_CARRIER: "CONTAINER_CARRIER";
            HATCHBACK: "HATCHBACK";
            HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
            LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
            MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
            MINI_BUS: "MINI_BUS";
            OTHER: "OTHER";
            SEDAN: "SEDAN";
            SUV: "SUV";
            TRAILER: "TRAILER";
            TWO_WHEELER: "TWO_WHEELER";
        }>;
        fuelType: z.ZodEnum<{
            CNG: "CNG";
            DIESEL: "DIESEL";
            ELECTRIC: "ELECTRIC";
            HYBRID_DIESEL: "HYBRID_DIESEL";
            HYBRID_PETROL: "HYBRID_PETROL";
            HYDROGEN: "HYDROGEN";
            OTHER: "OTHER";
            PETROL: "PETROL";
        }>;
        usageType: z.ZodEnum<{
            CARPOOL: "CARPOOL";
            COMPANY_POOL: "COMPANY_POOL";
            INDIVIDUAL: "INDIVIDUAL";
            OTHER: "OTHER";
            PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
            SHARED: "SHARED";
        }>;
        occupancy: z.ZodNumber;
        originLocation: z.ZodString;
        destinationLocation: z.ZodString;
        distanceKm: z.ZodNumber;
        journeyType: z.ZodDefault<z.ZodEnum<{
            LOCAL_CAMPUS: "LOCAL_CAMPUS";
            MULTI_STOP: "MULTI_STOP";
            ONE_WAY: "ONE_WAY";
            ROUND_TRIP: "ROUND_TRIP";
        }>>;
        tripDirection: z.ZodDefault<z.ZodEnum<{
            INBOUND: "INBOUND";
            INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
            OUTBOUND: "OUTBOUND";
        }>>;
        fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
        payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
        distanceProvenance: z.ZodDefault<z.ZodEnum<{
            IMPORTED: "IMPORTED";
            MEASURED: "MEASURED";
            SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
            SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
            USER_PROVIDED: "USER_PROVIDED";
        }>>;
        measurementMethod: z.ZodDefault<z.ZodEnum<{
            DECLARED_MANIFEST: "DECLARED_MANIFEST";
            ESTIMATED_TABLE: "ESTIMATED_TABLE";
            GIS_ROUTING: "GIS_ROUTING";
            ODOMETER: "ODOMETER";
            TELEMATICS_GPS: "TELEMATICS_GPS";
            WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
        }>>;
        dataSource: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ContractorTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sourceDomain: z.ZodLiteral<"CONTRACTOR">;
    contractorCompanyName: z.ZodString;
    workOrderNumber: z.ZodString;
    authorizedWorkerCount: z.ZodNumber;
    safetyPermitRequired: z.ZodDefault<z.ZodBoolean>;
    contractStartDate: z.ZodDate;
    contractEndDate: z.ZodDate;
    transport: z.ZodOptional<z.ZodObject<{
        transportId: z.ZodString;
        tenantId: z.ZodString;
        sourceDomain: z.ZodEnum<{
            CONTRACTOR: "CONTRACTOR";
            CUSTOMER: "CUSTOMER";
            MATERIAL: "MATERIAL";
            SERVICE: "SERVICE";
            VEHICLE: "VEHICLE";
            VISITOR: "VISITOR";
        }>;
        sourceTransactionId: z.ZodString;
        mode: z.ZodEnum<{
            AUTO_RICKSHAW: "AUTO_RICKSHAW";
            BUS: "BUS";
            CAR: "CAR";
            FLIGHT: "FLIGHT";
            OTHER: "OTHER";
            TAXI_CAB: "TAXI_CAB";
            TRAIN: "TRAIN";
            TRUCK: "TRUCK";
            TWO_WHEELER: "TWO_WHEELER";
            VAN: "VAN";
            WALKING: "WALKING";
        }>;
        ownership: z.ZodEnum<{
            COMPANY: "COMPANY";
            CUSTOMER: "CUSTOMER";
            HIRED: "HIRED";
            OTHER: "OTHER";
            PERSONAL: "PERSONAL";
            PUBLIC: "PUBLIC";
            SUPPLIER: "SUPPLIER";
            THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
            TRANSPORTER: "TRANSPORTER";
        }>;
        vehicleClass: z.ZodEnum<{
            COACH_BUS: "COACH_BUS";
            CONTAINER_CARRIER: "CONTAINER_CARRIER";
            HATCHBACK: "HATCHBACK";
            HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
            LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
            MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
            MINI_BUS: "MINI_BUS";
            OTHER: "OTHER";
            SEDAN: "SEDAN";
            SUV: "SUV";
            TRAILER: "TRAILER";
            TWO_WHEELER: "TWO_WHEELER";
        }>;
        fuelType: z.ZodEnum<{
            CNG: "CNG";
            DIESEL: "DIESEL";
            ELECTRIC: "ELECTRIC";
            HYBRID_DIESEL: "HYBRID_DIESEL";
            HYBRID_PETROL: "HYBRID_PETROL";
            HYDROGEN: "HYDROGEN";
            OTHER: "OTHER";
            PETROL: "PETROL";
        }>;
        usageType: z.ZodEnum<{
            CARPOOL: "CARPOOL";
            COMPANY_POOL: "COMPANY_POOL";
            INDIVIDUAL: "INDIVIDUAL";
            OTHER: "OTHER";
            PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
            SHARED: "SHARED";
        }>;
        occupancy: z.ZodNumber;
        originLocation: z.ZodString;
        destinationLocation: z.ZodString;
        distanceKm: z.ZodNumber;
        journeyType: z.ZodDefault<z.ZodEnum<{
            LOCAL_CAMPUS: "LOCAL_CAMPUS";
            MULTI_STOP: "MULTI_STOP";
            ONE_WAY: "ONE_WAY";
            ROUND_TRIP: "ROUND_TRIP";
        }>>;
        tripDirection: z.ZodDefault<z.ZodEnum<{
            INBOUND: "INBOUND";
            INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
            OUTBOUND: "OUTBOUND";
        }>>;
        fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
        payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
        distanceProvenance: z.ZodDefault<z.ZodEnum<{
            IMPORTED: "IMPORTED";
            MEASURED: "MEASURED";
            SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
            SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
            USER_PROVIDED: "USER_PROVIDED";
        }>>;
        measurementMethod: z.ZodDefault<z.ZodEnum<{
            DECLARED_MANIFEST: "DECLARED_MANIFEST";
            ESTIMATED_TABLE: "ESTIMATED_TABLE";
            GIS_ROUTING: "GIS_ROUTING";
            ODOMETER: "ODOMETER";
            TELEMATICS_GPS: "TELEMATICS_GPS";
            WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
        }>>;
        dataSource: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const ServiceRequestTypeSchema: z.ZodEnum<{
    CALIBRATION: "CALIBRATION";
    EMERGENCY_REPAIR: "EMERGENCY_REPAIR";
    INSTALLATION: "INSTALLATION";
    OEM_BREAKDOWN: "OEM_BREAKDOWN";
    PREVENTIVE_MAINTENANCE: "PREVENTIVE_MAINTENANCE";
}>;
export declare const ServiceTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sourceDomain: z.ZodLiteral<"SERVICE">;
    serviceRequestType: z.ZodEnum<{
        CALIBRATION: "CALIBRATION";
        EMERGENCY_REPAIR: "EMERGENCY_REPAIR";
        INSTALLATION: "INSTALLATION";
        OEM_BREAKDOWN: "OEM_BREAKDOWN";
        PREVENTIVE_MAINTENANCE: "PREVENTIVE_MAINTENANCE";
    }>;
    equipmentTag: z.ZodString;
    targetZoneId: z.ZodString;
    maintenanceLeadId: z.ZodString;
    inwardToolsDeclared: z.ZodDefault<z.ZodBoolean>;
    serviceCompleted: z.ZodDefault<z.ZodBoolean>;
    transport: z.ZodOptional<z.ZodObject<{
        transportId: z.ZodString;
        tenantId: z.ZodString;
        sourceDomain: z.ZodEnum<{
            CONTRACTOR: "CONTRACTOR";
            CUSTOMER: "CUSTOMER";
            MATERIAL: "MATERIAL";
            SERVICE: "SERVICE";
            VEHICLE: "VEHICLE";
            VISITOR: "VISITOR";
        }>;
        sourceTransactionId: z.ZodString;
        mode: z.ZodEnum<{
            AUTO_RICKSHAW: "AUTO_RICKSHAW";
            BUS: "BUS";
            CAR: "CAR";
            FLIGHT: "FLIGHT";
            OTHER: "OTHER";
            TAXI_CAB: "TAXI_CAB";
            TRAIN: "TRAIN";
            TRUCK: "TRUCK";
            TWO_WHEELER: "TWO_WHEELER";
            VAN: "VAN";
            WALKING: "WALKING";
        }>;
        ownership: z.ZodEnum<{
            COMPANY: "COMPANY";
            CUSTOMER: "CUSTOMER";
            HIRED: "HIRED";
            OTHER: "OTHER";
            PERSONAL: "PERSONAL";
            PUBLIC: "PUBLIC";
            SUPPLIER: "SUPPLIER";
            THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
            TRANSPORTER: "TRANSPORTER";
        }>;
        vehicleClass: z.ZodEnum<{
            COACH_BUS: "COACH_BUS";
            CONTAINER_CARRIER: "CONTAINER_CARRIER";
            HATCHBACK: "HATCHBACK";
            HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
            LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
            MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
            MINI_BUS: "MINI_BUS";
            OTHER: "OTHER";
            SEDAN: "SEDAN";
            SUV: "SUV";
            TRAILER: "TRAILER";
            TWO_WHEELER: "TWO_WHEELER";
        }>;
        fuelType: z.ZodEnum<{
            CNG: "CNG";
            DIESEL: "DIESEL";
            ELECTRIC: "ELECTRIC";
            HYBRID_DIESEL: "HYBRID_DIESEL";
            HYBRID_PETROL: "HYBRID_PETROL";
            HYDROGEN: "HYDROGEN";
            OTHER: "OTHER";
            PETROL: "PETROL";
        }>;
        usageType: z.ZodEnum<{
            CARPOOL: "CARPOOL";
            COMPANY_POOL: "COMPANY_POOL";
            INDIVIDUAL: "INDIVIDUAL";
            OTHER: "OTHER";
            PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
            SHARED: "SHARED";
        }>;
        occupancy: z.ZodNumber;
        originLocation: z.ZodString;
        destinationLocation: z.ZodString;
        distanceKm: z.ZodNumber;
        journeyType: z.ZodDefault<z.ZodEnum<{
            LOCAL_CAMPUS: "LOCAL_CAMPUS";
            MULTI_STOP: "MULTI_STOP";
            ONE_WAY: "ONE_WAY";
            ROUND_TRIP: "ROUND_TRIP";
        }>>;
        tripDirection: z.ZodDefault<z.ZodEnum<{
            INBOUND: "INBOUND";
            INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
            OUTBOUND: "OUTBOUND";
        }>>;
        fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
        payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
        distanceProvenance: z.ZodDefault<z.ZodEnum<{
            IMPORTED: "IMPORTED";
            MEASURED: "MEASURED";
            SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
            SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
            USER_PROVIDED: "USER_PROVIDED";
        }>>;
        measurementMethod: z.ZodDefault<z.ZodEnum<{
            DECLARED_MANIFEST: "DECLARED_MANIFEST";
            ESTIMATED_TABLE: "ESTIMATED_TABLE";
            GIS_ROUTING: "GIS_ROUTING";
            ODOMETER: "ODOMETER";
            TELEMATICS_GPS: "TELEMATICS_GPS";
            WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
        }>>;
        dataSource: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const MaterialMovementTypeSchema: z.ZodEnum<{
    INWARD: "INWARD";
    OUTWARD: "OUTWARD";
}>;
export declare const MaterialClassificationSchema: z.ZodEnum<{
    EMERGENCY: "EMERGENCY";
    EQUIPMENT: "EQUIPMENT";
    NON_RETURNABLE: "NON_RETURNABLE";
    RETURNABLE: "RETURNABLE";
    SAMPLE: "SAMPLE";
    SCRAP: "SCRAP";
    SPARE: "SPARE";
}>;
export declare const MaterialTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sourceDomain: z.ZodLiteral<"MATERIAL">;
    movementType: z.ZodEnum<{
        INWARD: "INWARD";
        OUTWARD: "OUTWARD";
    }>;
    classification: z.ZodEnum<{
        EMERGENCY: "EMERGENCY";
        EQUIPMENT: "EQUIPMENT";
        NON_RETURNABLE: "NON_RETURNABLE";
        RETURNABLE: "RETURNABLE";
        SAMPLE: "SAMPLE";
        SCRAP: "SCRAP";
        SPARE: "SPARE";
    }>;
    deliveryChallanNumber: z.ZodString;
    poReference: z.ZodOptional<z.ZodString>;
    transporterCompany: z.ZodString;
    vehicleRegistration: z.ZodString;
    grossWeightKg: z.ZodOptional<z.ZodNumber>;
    tareWeightKg: z.ZodOptional<z.ZodNumber>;
    netWeightKg: z.ZodOptional<z.ZodNumber>;
    transport: z.ZodOptional<z.ZodObject<{
        transportId: z.ZodString;
        tenantId: z.ZodString;
        sourceDomain: z.ZodEnum<{
            CONTRACTOR: "CONTRACTOR";
            CUSTOMER: "CUSTOMER";
            MATERIAL: "MATERIAL";
            SERVICE: "SERVICE";
            VEHICLE: "VEHICLE";
            VISITOR: "VISITOR";
        }>;
        sourceTransactionId: z.ZodString;
        mode: z.ZodEnum<{
            AUTO_RICKSHAW: "AUTO_RICKSHAW";
            BUS: "BUS";
            CAR: "CAR";
            FLIGHT: "FLIGHT";
            OTHER: "OTHER";
            TAXI_CAB: "TAXI_CAB";
            TRAIN: "TRAIN";
            TRUCK: "TRUCK";
            TWO_WHEELER: "TWO_WHEELER";
            VAN: "VAN";
            WALKING: "WALKING";
        }>;
        ownership: z.ZodEnum<{
            COMPANY: "COMPANY";
            CUSTOMER: "CUSTOMER";
            HIRED: "HIRED";
            OTHER: "OTHER";
            PERSONAL: "PERSONAL";
            PUBLIC: "PUBLIC";
            SUPPLIER: "SUPPLIER";
            THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
            TRANSPORTER: "TRANSPORTER";
        }>;
        vehicleClass: z.ZodEnum<{
            COACH_BUS: "COACH_BUS";
            CONTAINER_CARRIER: "CONTAINER_CARRIER";
            HATCHBACK: "HATCHBACK";
            HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
            LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
            MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
            MINI_BUS: "MINI_BUS";
            OTHER: "OTHER";
            SEDAN: "SEDAN";
            SUV: "SUV";
            TRAILER: "TRAILER";
            TWO_WHEELER: "TWO_WHEELER";
        }>;
        fuelType: z.ZodEnum<{
            CNG: "CNG";
            DIESEL: "DIESEL";
            ELECTRIC: "ELECTRIC";
            HYBRID_DIESEL: "HYBRID_DIESEL";
            HYBRID_PETROL: "HYBRID_PETROL";
            HYDROGEN: "HYDROGEN";
            OTHER: "OTHER";
            PETROL: "PETROL";
        }>;
        usageType: z.ZodEnum<{
            CARPOOL: "CARPOOL";
            COMPANY_POOL: "COMPANY_POOL";
            INDIVIDUAL: "INDIVIDUAL";
            OTHER: "OTHER";
            PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
            SHARED: "SHARED";
        }>;
        occupancy: z.ZodNumber;
        originLocation: z.ZodString;
        destinationLocation: z.ZodString;
        distanceKm: z.ZodNumber;
        journeyType: z.ZodDefault<z.ZodEnum<{
            LOCAL_CAMPUS: "LOCAL_CAMPUS";
            MULTI_STOP: "MULTI_STOP";
            ONE_WAY: "ONE_WAY";
            ROUND_TRIP: "ROUND_TRIP";
        }>>;
        tripDirection: z.ZodDefault<z.ZodEnum<{
            INBOUND: "INBOUND";
            INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
            OUTBOUND: "OUTBOUND";
        }>>;
        fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
        payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
        distanceProvenance: z.ZodDefault<z.ZodEnum<{
            IMPORTED: "IMPORTED";
            MEASURED: "MEASURED";
            SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
            SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
            USER_PROVIDED: "USER_PROVIDED";
        }>>;
        measurementMethod: z.ZodDefault<z.ZodEnum<{
            DECLARED_MANIFEST: "DECLARED_MANIFEST";
            ESTIMATED_TABLE: "ESTIMATED_TABLE";
            GIS_ROUTING: "GIS_ROUTING";
            ODOMETER: "ODOMETER";
            TELEMATICS_GPS: "TELEMATICS_GPS";
            WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
        }>>;
        dataSource: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const VehicleTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodString;
    siteId: z.ZodString;
    stage: z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>;
    status: z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>;
    createdAt: z.ZodDefault<z.ZodDate>;
    createdBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    version: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sourceDomain: z.ZodLiteral<"VEHICLE">;
    registrationPlate: z.ZodString;
    vehicleType: z.ZodString;
    driverName: z.ZodString;
    driverLicenseNumber: z.ZodString;
    breathalyzerPassed: z.ZodDefault<z.ZodBoolean>;
    entryOdometerKm: z.ZodOptional<z.ZodNumber>;
    exitOdometerKm: z.ZodOptional<z.ZodNumber>;
    transport: z.ZodOptional<z.ZodObject<{
        transportId: z.ZodString;
        tenantId: z.ZodString;
        sourceDomain: z.ZodEnum<{
            CONTRACTOR: "CONTRACTOR";
            CUSTOMER: "CUSTOMER";
            MATERIAL: "MATERIAL";
            SERVICE: "SERVICE";
            VEHICLE: "VEHICLE";
            VISITOR: "VISITOR";
        }>;
        sourceTransactionId: z.ZodString;
        mode: z.ZodEnum<{
            AUTO_RICKSHAW: "AUTO_RICKSHAW";
            BUS: "BUS";
            CAR: "CAR";
            FLIGHT: "FLIGHT";
            OTHER: "OTHER";
            TAXI_CAB: "TAXI_CAB";
            TRAIN: "TRAIN";
            TRUCK: "TRUCK";
            TWO_WHEELER: "TWO_WHEELER";
            VAN: "VAN";
            WALKING: "WALKING";
        }>;
        ownership: z.ZodEnum<{
            COMPANY: "COMPANY";
            CUSTOMER: "CUSTOMER";
            HIRED: "HIRED";
            OTHER: "OTHER";
            PERSONAL: "PERSONAL";
            PUBLIC: "PUBLIC";
            SUPPLIER: "SUPPLIER";
            THIRD_PARTY_LOGISTICS: "THIRD_PARTY_LOGISTICS";
            TRANSPORTER: "TRANSPORTER";
        }>;
        vehicleClass: z.ZodEnum<{
            COACH_BUS: "COACH_BUS";
            CONTAINER_CARRIER: "CONTAINER_CARRIER";
            HATCHBACK: "HATCHBACK";
            HEAVY_DUTY_TRUCK: "HEAVY_DUTY_TRUCK";
            LIGHT_COMMERCIAL_VAN: "LIGHT_COMMERCIAL_VAN";
            MEDIUM_DUTY_TRUCK: "MEDIUM_DUTY_TRUCK";
            MINI_BUS: "MINI_BUS";
            OTHER: "OTHER";
            SEDAN: "SEDAN";
            SUV: "SUV";
            TRAILER: "TRAILER";
            TWO_WHEELER: "TWO_WHEELER";
        }>;
        fuelType: z.ZodEnum<{
            CNG: "CNG";
            DIESEL: "DIESEL";
            ELECTRIC: "ELECTRIC";
            HYBRID_DIESEL: "HYBRID_DIESEL";
            HYBRID_PETROL: "HYBRID_PETROL";
            HYDROGEN: "HYDROGEN";
            OTHER: "OTHER";
            PETROL: "PETROL";
        }>;
        usageType: z.ZodEnum<{
            CARPOOL: "CARPOOL";
            COMPANY_POOL: "COMPANY_POOL";
            INDIVIDUAL: "INDIVIDUAL";
            OTHER: "OTHER";
            PUBLIC_COMMUTE: "PUBLIC_COMMUTE";
            SHARED: "SHARED";
        }>;
        occupancy: z.ZodNumber;
        originLocation: z.ZodString;
        destinationLocation: z.ZodString;
        distanceKm: z.ZodNumber;
        journeyType: z.ZodDefault<z.ZodEnum<{
            LOCAL_CAMPUS: "LOCAL_CAMPUS";
            MULTI_STOP: "MULTI_STOP";
            ONE_WAY: "ONE_WAY";
            ROUND_TRIP: "ROUND_TRIP";
        }>>;
        tripDirection: z.ZodDefault<z.ZodEnum<{
            INBOUND: "INBOUND";
            INTERNAL_TRANSFER: "INTERNAL_TRANSFER";
            OUTBOUND: "OUTBOUND";
        }>>;
        fuelConsumedLitres: z.ZodOptional<z.ZodNumber>;
        payloadWeightTonnes: z.ZodOptional<z.ZodNumber>;
        distanceProvenance: z.ZodDefault<z.ZodEnum<{
            IMPORTED: "IMPORTED";
            MEASURED: "MEASURED";
            SYSTEM_CALCULATED: "SYSTEM_CALCULATED";
            SYSTEM_ESTIMATED: "SYSTEM_ESTIMATED";
            USER_PROVIDED: "USER_PROVIDED";
        }>>;
        measurementMethod: z.ZodDefault<z.ZodEnum<{
            DECLARED_MANIFEST: "DECLARED_MANIFEST";
            ESTIMATED_TABLE: "ESTIMATED_TABLE";
            GIS_ROUTING: "GIS_ROUTING";
            ODOMETER: "ODOMETER";
            TELEMATICS_GPS: "TELEMATICS_GPS";
            WEIGHBRIDGE_SCALE: "WEIGHBRIDGE_SCALE";
        }>>;
        dataSource: z.ZodDefault<z.ZodString>;
        createdAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const MasterRecordStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    ARCHIVED: "ARCHIVED";
    DRAFT: "DRAFT";
    INACTIVE: "INACTIVE";
}>;
export declare const MasterRecordSchema: z.ZodObject<{
    id: z.ZodString;
    tenantId: z.ZodString;
    organizationId: z.ZodOptional<z.ZodString>;
    siteId: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentRecordId: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
        DRAFT: "DRAFT";
        INACTIVE: "INACTIVE";
    }>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    effectiveFrom: z.ZodDefault<z.ZodDate>;
    effectiveUntil: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    version: z.ZodDefault<z.ZodNumber>;
    createdBy: z.ZodString;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedBy: z.ZodString;
    updatedAt: z.ZodDefault<z.ZodDate>;
    isSensitive: z.ZodOptional<z.ZodBoolean>;
    pendingApproval: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const MasterRecordImportRowSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    siteCode: z.ZodOptional<z.ZodString>;
    parentCode: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    effectiveFrom: z.ZodOptional<z.ZodString>;
    effectiveUntil: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const WorkflowDomainSchema: z.ZodEnum<{
    CONTRACTOR: "CONTRACTOR";
    CUSTOMER: "CUSTOMER";
    DOCUMENT: "DOCUMENT";
    MATERIAL: "MATERIAL";
    OTHER_APPROVED_DOMAIN: "OTHER_APPROVED_DOMAIN";
    SAFETY: "SAFETY";
    SERVICE: "SERVICE";
    VEHICLE: "VEHICLE";
    VISITOR: "VISITOR";
}>;
export declare const WorkflowLifecycleStatusSchema: z.ZodEnum<{
    DRAFT: "DRAFT";
    PUBLISHED: "PUBLISHED";
    RETIRED: "RETIRED";
    VALIDATED: "VALIDATED";
}>;
export declare const WorkflowStageTypeSchema: z.ZodEnum<{
    ACCESS_DECISION: "ACCESS_DECISION";
    APPROVAL: "APPROVAL";
    AUTOMATED_RULE_EVALUATION: "AUTOMATED_RULE_EVALUATION";
    DATA_VALIDATION: "DATA_VALIDATION";
    DELAY_WAIT: "DELAY_WAIT";
    DOCUMENT_VERIFICATION: "DOCUMENT_VERIFICATION";
    END: "END";
    EXCEPTION_HANDLING: "EXCEPTION_HANDLING";
    IDENTITY_VERIFICATION: "IDENTITY_VERIFICATION";
    NOTIFICATION: "NOTIFICATION";
    OPERATIONAL_TASK: "OPERATIONAL_TASK";
    SAFETY_CHECK: "SAFETY_CHECK";
    START: "START";
}>;
export declare const RuleOperatorSchema: z.ZodEnum<{
    CONTAINS: "CONTAINS";
    EQUALS: "EQUALS";
    EXISTS: "EXISTS";
    GREATER_THAN: "GREATER_THAN";
    IN: "IN";
    IS_EXPIRED: "IS_EXPIRED";
    IS_VALID: "IS_VALID";
    LESS_THAN: "LESS_THAN";
    NOT_EQUALS: "NOT_EQUALS";
    NOT_IN: "NOT_IN";
}>;
export declare const WorkflowConditionSchema: z.ZodObject<{
    conditionId: z.ZodString;
    field: z.ZodString;
    operator: z.ZodEnum<{
        CONTAINS: "CONTAINS";
        EQUALS: "EQUALS";
        EXISTS: "EXISTS";
        GREATER_THAN: "GREATER_THAN";
        IN: "IN";
        IS_EXPIRED: "IS_EXPIRED";
        IS_VALID: "IS_VALID";
        LESS_THAN: "LESS_THAN";
        NOT_EQUALS: "NOT_EQUALS";
        NOT_IN: "NOT_IN";
    }>;
    value: z.ZodUnknown;
    logicGroup: z.ZodOptional<z.ZodEnum<{
        AND: "AND";
        OR: "OR";
    }>>;
}, z.core.$strip>;
export declare const WorkflowTransitionSchema: z.ZodObject<{
    transitionId: z.ZodString;
    fromStageId: z.ZodString;
    toStageId: z.ZodString;
    trigger: z.ZodString;
    requiredPermission: z.ZodOptional<z.ZodString>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        conditionId: z.ZodString;
        field: z.ZodString;
        operator: z.ZodEnum<{
            CONTAINS: "CONTAINS";
            EQUALS: "EQUALS";
            EXISTS: "EXISTS";
            GREATER_THAN: "GREATER_THAN";
            IN: "IN";
            IS_EXPIRED: "IS_EXPIRED";
            IS_VALID: "IS_VALID";
            LESS_THAN: "LESS_THAN";
            NOT_EQUALS: "NOT_EQUALS";
            NOT_IN: "NOT_IN";
        }>;
        value: z.ZodUnknown;
        logicGroup: z.ZodOptional<z.ZodEnum<{
            AND: "AND";
            OR: "OR";
        }>>;
    }, z.core.$strip>>>;
    reasonRequired: z.ZodOptional<z.ZodBoolean>;
    resultStatus: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const SlaConfigSchema: z.ZodObject<{
    slaMinutes: z.ZodNumber;
    warningMinutes: z.ZodNumber;
    escalationTargetRole: z.ZodOptional<z.ZodString>;
    escalationTargetUserId: z.ZodOptional<z.ZodString>;
    escalationFrequencyMinutes: z.ZodOptional<z.ZodNumber>;
    escalateToManager: z.ZodOptional<z.ZodBoolean>;
    autoApproveOnExpiry: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const ApprovalAssignmentRuleSchema: z.ZodObject<{
    approverType: z.ZodEnum<{
        APPROVAL_GROUP: "APPROVAL_GROUP";
        DEPARTMENT: "DEPARTMENT";
        HOST_SPONSOR: "HOST_SPONSOR";
        NAMED_USER: "NAMED_USER";
        RESPONSIBLE_MANAGER: "RESPONSIBLE_MANAGER";
        ROLE: "ROLE";
        SITE_RESPONSIBILITY: "SITE_RESPONSIBILITY";
    }>;
    targetRole: z.ZodOptional<z.ZodString>;
    targetUserId: z.ZodOptional<z.ZodString>;
    targetDepartmentCode: z.ZodOptional<z.ZodString>;
    allowSelfApproval: z.ZodDefault<z.ZodBoolean>;
    delegationAllowed: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const WorkflowStageSchema: z.ZodObject<{
    stageId: z.ZodString;
    stageCode: z.ZodString;
    stageName: z.ZodString;
    stageType: z.ZodEnum<{
        ACCESS_DECISION: "ACCESS_DECISION";
        APPROVAL: "APPROVAL";
        AUTOMATED_RULE_EVALUATION: "AUTOMATED_RULE_EVALUATION";
        DATA_VALIDATION: "DATA_VALIDATION";
        DELAY_WAIT: "DELAY_WAIT";
        DOCUMENT_VERIFICATION: "DOCUMENT_VERIFICATION";
        END: "END";
        EXCEPTION_HANDLING: "EXCEPTION_HANDLING";
        IDENTITY_VERIFICATION: "IDENTITY_VERIFICATION";
        NOTIFICATION: "NOTIFICATION";
        OPERATIONAL_TASK: "OPERATIONAL_TASK";
        SAFETY_CHECK: "SAFETY_CHECK";
        START: "START";
    }>;
    orderIndex: z.ZodNumber;
    slaConfig: z.ZodOptional<z.ZodObject<{
        slaMinutes: z.ZodNumber;
        warningMinutes: z.ZodNumber;
        escalationTargetRole: z.ZodOptional<z.ZodString>;
        escalationTargetUserId: z.ZodOptional<z.ZodString>;
        escalationFrequencyMinutes: z.ZodOptional<z.ZodNumber>;
        escalateToManager: z.ZodOptional<z.ZodBoolean>;
        autoApproveOnExpiry: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    approvalPolicy: z.ZodOptional<z.ZodEnum<{
        PARALLEL_ALL_REQUIRED: "PARALLEL_ALL_REQUIRED";
        PARALLEL_ANY_ONE: "PARALLEL_ANY_ONE";
        PARALLEL_QUORUM: "PARALLEL_QUORUM";
        SEQUENTIAL: "SEQUENTIAL";
        SINGLE: "SINGLE";
    }>>;
    assignmentRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        approverType: z.ZodEnum<{
            APPROVAL_GROUP: "APPROVAL_GROUP";
            DEPARTMENT: "DEPARTMENT";
            HOST_SPONSOR: "HOST_SPONSOR";
            NAMED_USER: "NAMED_USER";
            RESPONSIBLE_MANAGER: "RESPONSIBLE_MANAGER";
            ROLE: "ROLE";
            SITE_RESPONSIBILITY: "SITE_RESPONSIBILITY";
        }>;
        targetRole: z.ZodOptional<z.ZodString>;
        targetUserId: z.ZodOptional<z.ZodString>;
        targetDepartmentCode: z.ZodOptional<z.ZodString>;
        allowSelfApproval: z.ZodDefault<z.ZodBoolean>;
        delegationAllowed: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    quorumRequired: z.ZodOptional<z.ZodNumber>;
    notificationTemplateId: z.ZodOptional<z.ZodString>;
    requiredInputs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    isMandatory: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const WorkflowDefinitionSchema: z.ZodObject<{
    definitionId: z.ZodString;
    tenantId: z.ZodString;
    siteId: z.ZodOptional<z.ZodString>;
    domain: z.ZodEnum<{
        CONTRACTOR: "CONTRACTOR";
        CUSTOMER: "CUSTOMER";
        DOCUMENT: "DOCUMENT";
        MATERIAL: "MATERIAL";
        OTHER_APPROVED_DOMAIN: "OTHER_APPROVED_DOMAIN";
        SAFETY: "SAFETY";
        SERVICE: "SERVICE";
        VEHICLE: "VEHICLE";
        VISITOR: "VISITOR";
    }>;
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    isCurrent: z.ZodDefault<z.ZodBoolean>;
    ownerId: z.ZodString;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const WorkflowVersionSchema: z.ZodObject<{
    versionId: z.ZodString;
    definitionId: z.ZodString;
    versionNumber: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<{
        DRAFT: "DRAFT";
        PUBLISHED: "PUBLISHED";
        RETIRED: "RETIRED";
        VALIDATED: "VALIDATED";
    }>>;
    effectiveFrom: z.ZodDefault<z.ZodDate>;
    effectiveTo: z.ZodOptional<z.ZodDate>;
    stages: z.ZodArray<z.ZodObject<{
        stageId: z.ZodString;
        stageCode: z.ZodString;
        stageName: z.ZodString;
        stageType: z.ZodEnum<{
            ACCESS_DECISION: "ACCESS_DECISION";
            APPROVAL: "APPROVAL";
            AUTOMATED_RULE_EVALUATION: "AUTOMATED_RULE_EVALUATION";
            DATA_VALIDATION: "DATA_VALIDATION";
            DELAY_WAIT: "DELAY_WAIT";
            DOCUMENT_VERIFICATION: "DOCUMENT_VERIFICATION";
            END: "END";
            EXCEPTION_HANDLING: "EXCEPTION_HANDLING";
            IDENTITY_VERIFICATION: "IDENTITY_VERIFICATION";
            NOTIFICATION: "NOTIFICATION";
            OPERATIONAL_TASK: "OPERATIONAL_TASK";
            SAFETY_CHECK: "SAFETY_CHECK";
            START: "START";
        }>;
        orderIndex: z.ZodNumber;
        slaConfig: z.ZodOptional<z.ZodObject<{
            slaMinutes: z.ZodNumber;
            warningMinutes: z.ZodNumber;
            escalationTargetRole: z.ZodOptional<z.ZodString>;
            escalationTargetUserId: z.ZodOptional<z.ZodString>;
            escalationFrequencyMinutes: z.ZodOptional<z.ZodNumber>;
            escalateToManager: z.ZodOptional<z.ZodBoolean>;
            autoApproveOnExpiry: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        approvalPolicy: z.ZodOptional<z.ZodEnum<{
            PARALLEL_ALL_REQUIRED: "PARALLEL_ALL_REQUIRED";
            PARALLEL_ANY_ONE: "PARALLEL_ANY_ONE";
            PARALLEL_QUORUM: "PARALLEL_QUORUM";
            SEQUENTIAL: "SEQUENTIAL";
            SINGLE: "SINGLE";
        }>>;
        assignmentRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
            approverType: z.ZodEnum<{
                APPROVAL_GROUP: "APPROVAL_GROUP";
                DEPARTMENT: "DEPARTMENT";
                HOST_SPONSOR: "HOST_SPONSOR";
                NAMED_USER: "NAMED_USER";
                RESPONSIBLE_MANAGER: "RESPONSIBLE_MANAGER";
                ROLE: "ROLE";
                SITE_RESPONSIBILITY: "SITE_RESPONSIBILITY";
            }>;
            targetRole: z.ZodOptional<z.ZodString>;
            targetUserId: z.ZodOptional<z.ZodString>;
            targetDepartmentCode: z.ZodOptional<z.ZodString>;
            allowSelfApproval: z.ZodDefault<z.ZodBoolean>;
            delegationAllowed: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>>;
        quorumRequired: z.ZodOptional<z.ZodNumber>;
        notificationTemplateId: z.ZodOptional<z.ZodString>;
        requiredInputs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        isMandatory: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    transitions: z.ZodArray<z.ZodObject<{
        transitionId: z.ZodString;
        fromStageId: z.ZodString;
        toStageId: z.ZodString;
        trigger: z.ZodString;
        requiredPermission: z.ZodOptional<z.ZodString>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            conditionId: z.ZodString;
            field: z.ZodString;
            operator: z.ZodEnum<{
                CONTAINS: "CONTAINS";
                EQUALS: "EQUALS";
                EXISTS: "EXISTS";
                GREATER_THAN: "GREATER_THAN";
                IN: "IN";
                IS_EXPIRED: "IS_EXPIRED";
                IS_VALID: "IS_VALID";
                LESS_THAN: "LESS_THAN";
                NOT_EQUALS: "NOT_EQUALS";
                NOT_IN: "NOT_IN";
            }>;
            value: z.ZodUnknown;
            logicGroup: z.ZodOptional<z.ZodEnum<{
                AND: "AND";
                OR: "OR";
            }>>;
        }, z.core.$strip>>>;
        reasonRequired: z.ZodOptional<z.ZodBoolean>;
        resultStatus: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    publishedBy: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    immutable: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const ApprovalDecisionSchema: z.ZodEnum<{
    APPROVED: "APPROVED";
    CHANGES_REQUESTED: "CHANGES_REQUESTED";
    DELEGATED: "DELEGATED";
    REJECTED: "REJECTED";
}>;
export declare const ApprovalActionInputSchema: z.ZodObject<{
    taskId: z.ZodString;
    decision: z.ZodEnum<{
        APPROVED: "APPROVED";
        CHANGES_REQUESTED: "CHANGES_REQUESTED";
        DELEGATED: "DELEGATED";
        REJECTED: "REJECTED";
    }>;
    remarks: z.ZodOptional<z.ZodString>;
    delegationId: z.ZodOptional<z.ZodString>;
    changesRequiredDetails: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ApprovalDelegationSchema: z.ZodObject<{
    delegationId: z.ZodString;
    tenantId: z.ZodString;
    delegatorUserId: z.ZodString;
    delegateUserId: z.ZodString;
    domainScope: z.ZodOptional<z.ZodEnum<{
        CONTRACTOR: "CONTRACTOR";
        CUSTOMER: "CUSTOMER";
        DOCUMENT: "DOCUMENT";
        MATERIAL: "MATERIAL";
        OTHER_APPROVED_DOMAIN: "OTHER_APPROVED_DOMAIN";
        SAFETY: "SAFETY";
        SERVICE: "SERVICE";
        VEHICLE: "VEHICLE";
        VISITOR: "VISITOR";
    }>>;
    siteScopeId: z.ZodOptional<z.ZodString>;
    stageScopeId: z.ZodOptional<z.ZodString>;
    validFrom: z.ZodDate;
    validTo: z.ZodDate;
    reason: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        EXPIRED: "EXPIRED";
        REVOKED: "REVOKED";
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const PolicyRuleSchema: z.ZodObject<{
    ruleId: z.ZodString;
    policyId: z.ZodString;
    ruleCode: z.ZodString;
    name: z.ZodString;
    priority: z.ZodDefault<z.ZodNumber>;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<{
            CONTAINS: "CONTAINS";
            EQUALS: "EQUALS";
            EXISTS: "EXISTS";
            GREATER_THAN: "GREATER_THAN";
            IN: "IN";
            IS_EXPIRED: "IS_EXPIRED";
            IS_VALID: "IS_VALID";
            LESS_THAN: "LESS_THAN";
            NOT_EQUALS: "NOT_EQUALS";
            NOT_IN: "NOT_IN";
        }>;
        value: z.ZodUnknown;
        logic: z.ZodOptional<z.ZodEnum<{
            AND: "AND";
            OR: "OR";
        }>>;
    }, z.core.$strip>>;
    action: z.ZodEnum<{
        ALLOW: "ALLOW";
        DENY: "DENY";
        ESCALATE: "ESCALATE";
        REQUIRE_APPROVAL: "REQUIRE_APPROVAL";
        REQUIRE_DOCUMENT: "REQUIRE_DOCUMENT";
    }>;
    actionPayload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const CustomerClassificationSchema: z.ZodEnum<{
    EXISTING_CUSTOMER: "EXISTING_CUSTOMER";
    OEM_CUSTOMER: "OEM_CUSTOMER";
    OTHER: "OTHER";
    PROSPECTIVE_CUSTOMER: "PROSPECTIVE_CUSTOMER";
    QUALITY_CUSTOMER: "QUALITY_CUSTOMER";
    STRATEGIC_CUSTOMER: "STRATEGIC_CUSTOMER";
    TECHNICAL_CUSTOMER: "TECHNICAL_CUSTOMER";
}>;
export declare const CustomerAccountTierSchema: z.ZodEnum<{
    GLOBAL_ENTERPRISE: "GLOBAL_ENTERPRISE";
    KEY_ACCOUNT: "KEY_ACCOUNT";
    OEM: "OEM";
    STANDARD: "STANDARD";
    TIER_1_STRATEGIC: "TIER_1_STRATEGIC";
}>;
export declare const CustomerAccountStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    ARCHIVED: "ARCHIVED";
    DRAFT: "DRAFT";
    INACTIVE: "INACTIVE";
    SUSPENDED: "SUSPENDED";
}>;
export declare const CustomerBookingModeSchema: z.ZodEnum<{
    DELEGATION: "DELEGATION";
    RECURRING: "RECURRING";
    RESERVED: "RESERVED";
    WALK_IN: "WALK_IN";
}>;
export declare const CustomerPhotographyPolicySchema: z.ZodEnum<{
    PERMITTED: "PERMITTED";
    PROHIBITED: "PROHIBITED";
    RESTRICTED: "RESTRICTED";
}>;
export declare const CustomerAccountSchema: z.ZodObject<{
    customerAccountId: z.ZodString;
    tenantId: z.ZodString;
    externalOrgId: z.ZodString;
    accountCode: z.ZodString;
    accountName: z.ZodString;
    classification: z.ZodDefault<z.ZodEnum<{
        EXISTING_CUSTOMER: "EXISTING_CUSTOMER";
        OEM_CUSTOMER: "OEM_CUSTOMER";
        OTHER: "OTHER";
        PROSPECTIVE_CUSTOMER: "PROSPECTIVE_CUSTOMER";
        QUALITY_CUSTOMER: "QUALITY_CUSTOMER";
        STRATEGIC_CUSTOMER: "STRATEGIC_CUSTOMER";
        TECHNICAL_CUSTOMER: "TECHNICAL_CUSTOMER";
    }>>;
    tier: z.ZodDefault<z.ZodEnum<{
        GLOBAL_ENTERPRISE: "GLOBAL_ENTERPRISE";
        KEY_ACCOUNT: "KEY_ACCOUNT";
        OEM: "OEM";
        STANDARD: "STANDARD";
        TIER_1_STRATEGIC: "TIER_1_STRATEGIC";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        ARCHIVED: "ARCHIVED";
        DRAFT: "DRAFT";
        INACTIVE: "INACTIVE";
        SUSPENDED: "SUSPENDED";
    }>>;
    registrationNumber: z.ZodOptional<z.ZodString>;
    primaryContactPersonId: z.ZodOptional<z.ZodString>;
    commercialOwnerUserId: z.ZodOptional<z.ZodString>;
    approvedSiteIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultVisitRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultNdaRequired: z.ZodDefault<z.ZodBoolean>;
    defaultPhotographyPolicy: z.ZodDefault<z.ZodEnum<{
        PERMITTED: "PERMITTED";
        PROHIBITED: "PROHIBITED";
        RESTRICTED: "RESTRICTED";
    }>>;
    defaultEscortRequired: z.ZodDefault<z.ZodBoolean>;
    defaultAccessRequirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const CustomerRepresentativeSchema: z.ZodObject<{
    repId: z.ZodString;
    tenantId: z.ZodString;
    customerAccountId: z.ZodString;
    personId: z.ZodString;
    jobTitle: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
    identityVerificationStatus: z.ZodDefault<z.ZodEnum<{
        EXPIRED: "EXPIRED";
        FAILED: "FAILED";
        PENDING: "PENDING";
        VERIFIED: "VERIFIED";
    }>>;
    profileStatus: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        SUSPENDED: "SUSPENDED";
    }>>;
    preferredContactChannel: z.ZodOptional<z.ZodEnum<{
        EMAIL: "EMAIL";
        PHONE: "PHONE";
        SMS: "SMS";
    }>>;
    notes: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const CustomerVisitTypeEntitySchema: z.ZodObject<{
    visitTypeId: z.ZodString;
    tenantId: z.ZodOptional<z.ZodString>;
    code: z.ZodEnum<{
        CUSTOMER_AUDIT: "CUSTOMER_AUDIT";
        CUSTOMER_INSPECTION: "CUSTOMER_INSPECTION";
        CUSTOMER_MEETING: "CUSTOMER_MEETING";
        DELEGATION: "DELEGATION";
        DELEGATION_VISIT: "DELEGATION_VISIT";
        MANAGEMENT_VISIT: "MANAGEMENT_VISIT";
        OTHER: "OTHER";
        PLANT_VISIT: "PLANT_VISIT";
        PROCESS_REVIEW: "PROCESS_REVIEW";
        PRODUCT_REVIEW: "PRODUCT_REVIEW";
        QUALITY_VISIT: "QUALITY_VISIT";
        TECHNICAL_VISIT: "TECHNICAL_VISIT";
    }>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const CustomerRequirementSchema: z.ZodObject<{
    requirementId: z.ZodString;
    tenantId: z.ZodString;
    customerVisitId: z.ZodString;
    requirementType: z.ZodEnum<{
        CONFIDENTIALITY: "CONFIDENTIALITY";
        ESCORT: "ESCORT";
        NDA: "NDA";
        PHOTO_RESTRICTION: "PHOTO_RESTRICTION";
        PPE: "PPE";
        QUALITY_REP: "QUALITY_REP";
        RESTRICTED_AREA: "RESTRICTED_AREA";
        SAFETY_INDUCTION: "SAFETY_INDUCTION";
        TECHNICAL_REP: "TECHNICAL_REP";
    }>;
    description: z.ZodString;
    isMandatory: z.ZodDefault<z.ZodBoolean>;
    isFulfilled: z.ZodDefault<z.ZodBoolean>;
    fulfilledAt: z.ZodOptional<z.ZodDate>;
    scope: z.ZodDefault<z.ZodEnum<{
        CUSTOMER_ACCOUNT: "CUSTOMER_ACCOUNT";
        GLOBAL: "GLOBAL";
        SITE: "SITE";
        VISIT_EXCEPTION: "VISIT_EXCEPTION";
        VISIT_TYPE: "VISIT_TYPE";
    }>>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const CustomerVisitClosureSchema: z.ZodObject<{
    completed: z.ZodBoolean;
    actualStart: z.ZodOptional<z.ZodDate>;
    actualEnd: z.ZodOptional<z.ZodDate>;
    followUpRequired: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodDefault<z.ZodString>;
    evidenceDocumentRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    closedBy: z.ZodString;
    closedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const CustomerAuditDetailsSchema: z.ZodObject<{
    auditType: z.ZodEnum<{
        COMPLIANCE_AUDIT: "COMPLIANCE_AUDIT";
        OTHER: "OTHER";
        PROCESS_AUDIT: "PROCESS_AUDIT";
        PRODUCT_AUDIT: "PRODUCT_AUDIT";
        QUALITY_AUDIT: "QUALITY_AUDIT";
        SUPPLIER_ASSESSMENT: "SUPPLIER_ASSESSMENT";
        SYSTEM_AUDIT: "SYSTEM_AUDIT";
    }>;
    auditScope: z.ZodString;
    auditReference: z.ZodOptional<z.ZodString>;
    auditingOrganization: z.ZodOptional<z.ZodString>;
    leadAuditorPersonId: z.ZodOptional<z.ZodString>;
    leadAuditorName: z.ZodOptional<z.ZodString>;
    additionalAuditorIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    departmentsInvolved: z.ZodOptional<z.ZodArray<z.ZodString>>;
    closureSummary: z.ZodOptional<z.ZodObject<{
        completed: z.ZodBoolean;
        actualStart: z.ZodOptional<z.ZodDate>;
        actualEnd: z.ZodOptional<z.ZodDate>;
        followUpRequired: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodDefault<z.ZodString>;
        evidenceDocumentRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        closedBy: z.ZodString;
        closedAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CustomerInspectionDetailsSchema: z.ZodObject<{
    inspectionCategory: z.ZodEnum<{
        FIRST_ARTICLE: "FIRST_ARTICLE";
        OTHER: "OTHER";
        PRE_DISPATCH: "PRE_DISPATCH";
        PROCESS_INSPECTION: "PROCESS_INSPECTION";
        PRODUCT_INSPECTION: "PRODUCT_INSPECTION";
        TOOLING: "TOOLING";
    }>;
    inspectionScope: z.ZodString;
    productProcessReference: z.ZodOptional<z.ZodString>;
    leadInspectorPersonId: z.ZodOptional<z.ZodString>;
    leadInspectorName: z.ZodOptional<z.ZodString>;
    requiredQualityRepId: z.ZodOptional<z.ZodString>;
    productionAreaRequirements: z.ZodOptional<z.ZodString>;
    closureSummary: z.ZodOptional<z.ZodObject<{
        completed: z.ZodBoolean;
        actualStart: z.ZodOptional<z.ZodDate>;
        actualEnd: z.ZodOptional<z.ZodDate>;
        followUpRequired: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodDefault<z.ZodString>;
        evidenceDocumentRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        closedBy: z.ZodString;
        closedAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CustomerVisitTransactionSchema: z.ZodObject<{
    transactionId: z.ZodString;
    referenceNumber: z.ZodString;
    tenantId: z.ZodString;
    siteId: z.ZodString;
    customerAccountId: z.ZodString;
    visitTypeId: z.ZodOptional<z.ZodString>;
    visitTypeCode: z.ZodEnum<{
        CUSTOMER_AUDIT: "CUSTOMER_AUDIT";
        CUSTOMER_INSPECTION: "CUSTOMER_INSPECTION";
        CUSTOMER_MEETING: "CUSTOMER_MEETING";
        DELEGATION: "DELEGATION";
        DELEGATION_VISIT: "DELEGATION_VISIT";
        MANAGEMENT_VISIT: "MANAGEMENT_VISIT";
        OTHER: "OTHER";
        PLANT_VISIT: "PLANT_VISIT";
        PROCESS_REVIEW: "PROCESS_REVIEW";
        PRODUCT_REVIEW: "PRODUCT_REVIEW";
        QUALITY_VISIT: "QUALITY_VISIT";
        TECHNICAL_VISIT: "TECHNICAL_VISIT";
    }>;
    title: z.ZodString;
    purpose: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    hostUserId: z.ZodString;
    relationshipOwnerUserId: z.ZodOptional<z.ZodString>;
    bookingMode: z.ZodDefault<z.ZodEnum<{
        DELEGATION: "DELEGATION";
        RECURRING: "RECURRING";
        RESERVED: "RESERVED";
        WALK_IN: "WALK_IN";
    }>>;
    scheduledStart: z.ZodDate;
    scheduledEnd: z.ZodDate;
    actualArrival: z.ZodOptional<z.ZodDate>;
    actualEntry: z.ZodOptional<z.ZodDate>;
    actualExit: z.ZodOptional<z.ZodDate>;
    stage: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        APPROVAL: "APPROVAL";
        CHECK_IN: "CHECK_IN";
        CHECK_OUT: "CHECK_OUT";
        CLOSED: "CLOSED";
        DRAFT: "DRAFT";
        SCHEDULED: "SCHEDULED";
    }>>;
    status: z.ZodDefault<z.ZodEnum<{
        APPROVED: "APPROVED";
        BLOCKED: "BLOCKED";
        CANCELLED: "CANCELLED";
        CHECKED_OUT: "CHECKED_OUT";
        COMPLETED: "COMPLETED";
        CONFIRMED: "CONFIRMED";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        IN_PROGRESS: "IN_PROGRESS";
        NO_SHOW: "NO_SHOW";
        ON_PREMISES: "ON_PREMISES";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>>;
    version: z.ZodDefault<z.ZodNumber>;
    workflowInstanceId: z.ZodOptional<z.ZodString>;
    approvalState: z.ZodDefault<z.ZodEnum<{
        APPROVED: "APPROVED";
        CHANGES_REQUESTED: "CHANGES_REQUESTED";
        DRAFT: "DRAFT";
        PENDING: "PENDING";
        REJECTED: "REJECTED";
    }>>;
    ndaSigned: z.ZodDefault<z.ZodBoolean>;
    ndaDocumentRef: z.ZodOptional<z.ZodString>;
    photographyPolicy: z.ZodDefault<z.ZodEnum<{
        PERMITTED: "PERMITTED";
        PROHIBITED: "PROHIBITED";
        RESTRICTED: "RESTRICTED";
    }>>;
    escortRequired: z.ZodDefault<z.ZodBoolean>;
    accessRequirement: z.ZodOptional<z.ZodString>;
    transportActivityId: z.ZodOptional<z.ZodString>;
    ghgActivityId: z.ZodOptional<z.ZodString>;
    auditDetails: z.ZodOptional<z.ZodObject<{
        auditType: z.ZodEnum<{
            COMPLIANCE_AUDIT: "COMPLIANCE_AUDIT";
            OTHER: "OTHER";
            PROCESS_AUDIT: "PROCESS_AUDIT";
            PRODUCT_AUDIT: "PRODUCT_AUDIT";
            QUALITY_AUDIT: "QUALITY_AUDIT";
            SUPPLIER_ASSESSMENT: "SUPPLIER_ASSESSMENT";
            SYSTEM_AUDIT: "SYSTEM_AUDIT";
        }>;
        auditScope: z.ZodString;
        auditReference: z.ZodOptional<z.ZodString>;
        auditingOrganization: z.ZodOptional<z.ZodString>;
        leadAuditorPersonId: z.ZodOptional<z.ZodString>;
        leadAuditorName: z.ZodOptional<z.ZodString>;
        additionalAuditorIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        departmentsInvolved: z.ZodOptional<z.ZodArray<z.ZodString>>;
        closureSummary: z.ZodOptional<z.ZodObject<{
            completed: z.ZodBoolean;
            actualStart: z.ZodOptional<z.ZodDate>;
            actualEnd: z.ZodOptional<z.ZodDate>;
            followUpRequired: z.ZodDefault<z.ZodBoolean>;
            notes: z.ZodDefault<z.ZodString>;
            evidenceDocumentRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
            closedBy: z.ZodString;
            closedAt: z.ZodDefault<z.ZodDate>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    inspectionDetails: z.ZodOptional<z.ZodObject<{
        inspectionCategory: z.ZodEnum<{
            FIRST_ARTICLE: "FIRST_ARTICLE";
            OTHER: "OTHER";
            PRE_DISPATCH: "PRE_DISPATCH";
            PROCESS_INSPECTION: "PROCESS_INSPECTION";
            PRODUCT_INSPECTION: "PRODUCT_INSPECTION";
            TOOLING: "TOOLING";
        }>;
        inspectionScope: z.ZodString;
        productProcessReference: z.ZodOptional<z.ZodString>;
        leadInspectorPersonId: z.ZodOptional<z.ZodString>;
        leadInspectorName: z.ZodOptional<z.ZodString>;
        requiredQualityRepId: z.ZodOptional<z.ZodString>;
        productionAreaRequirements: z.ZodOptional<z.ZodString>;
        closureSummary: z.ZodOptional<z.ZodObject<{
            completed: z.ZodBoolean;
            actualStart: z.ZodOptional<z.ZodDate>;
            actualEnd: z.ZodOptional<z.ZodDate>;
            followUpRequired: z.ZodDefault<z.ZodBoolean>;
            notes: z.ZodDefault<z.ZodString>;
            evidenceDocumentRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
            closedBy: z.ZodString;
            closedAt: z.ZodDefault<z.ZodDate>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    closureSummary: z.ZodOptional<z.ZodObject<{
        completed: z.ZodBoolean;
        actualStart: z.ZodOptional<z.ZodDate>;
        actualEnd: z.ZodOptional<z.ZodDate>;
        followUpRequired: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodDefault<z.ZodString>;
        evidenceDocumentRefs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        closedBy: z.ZodString;
        closedAt: z.ZodDefault<z.ZodDate>;
    }, z.core.$strip>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdBy: z.ZodString;
    updatedBy: z.ZodString;
    createdAt: z.ZodDefault<z.ZodDate>;
    updatedAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
export declare const CustomerVisitParticipantSchema: z.ZodObject<{
    participantId: z.ZodString;
    customerVisitId: z.ZodString;
    personId: z.ZodString;
    customerRepId: z.ZodOptional<z.ZodString>;
    fullName: z.ZodString;
    designation: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    isLead: z.ZodDefault<z.ZodBoolean>;
    identityStatus: z.ZodDefault<z.ZodEnum<{
        FAILED: "FAILED";
        PENDING: "PENDING";
        VERIFIED: "VERIFIED";
    }>>;
    presenceStatus: z.ZodDefault<z.ZodEnum<{
        ARRIVED: "ARRIVED";
        CHECKED_IN: "CHECKED_IN";
        DEPARTED: "DEPARTED";
        EXPECTED: "EXPECTED";
        NO_SHOW: "NO_SHOW";
    }>>;
    actualArrival: z.ZodOptional<z.ZodDate>;
    actualEntry: z.ZodOptional<z.ZodDate>;
    actualExit: z.ZodOptional<z.ZodDate>;
    transportMode: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDefault<z.ZodDate>;
}, z.core.$strip>;
