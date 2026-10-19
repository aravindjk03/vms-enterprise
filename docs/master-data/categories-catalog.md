# Canonical Enterprise Master Data Categories Catalog

## 1. Catalog Structure

Master data categories in VMS Enterprise span 10 canonical functional groups (Sections 4.1 to 4.10). Every category is cataloged with its sensitivity classification and activation approval prerequisite.

---

## 2. Category Inventory

### 4.1 Organization & Site Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `ORGANIZATIONS` | Organizations | Yes | Yes | Corporate entities, operating subsidiaries, and legal business units. |
| `SITES` | Facility Sites | Yes | Yes | Industrial production facilities, technical centers, logistics complexes. |
| `DEPARTMENTS` | Departments | No | No | Organizational departments and functional cost centers. |
| `BUILDINGS` | Buildings & Structures | No | No | Physical campus buildings, workshop hangars, and administrative blocks. |
| `GATES` | Gates & Portals | Yes | Yes | Physical access gates, turnstiles, and boom barriers. |
| `ZONES` | Security Zones | Yes | Yes | Graded clearance physical zones (Lobby, Plant Floor, R&D Labs, Hazmat). |
| `GATE_TYPES` | Gate Classifications | No | No | Modalities: Pedestrian, Heavy Vehicle, Executive, Service. |
| `ZONE_TYPES` | Zone Security Levels | Yes | No | Risk classifications: Standard, High Security, Hazardous, Muster Point. |
| `HOST_DEPARTMENTS` | Host Departments | No | No | Business units eligible to sponsor and host external guests. |
| `SITE_SETTINGS` | Site Configurations | Yes | Yes | Local operating thresholds, shift timings, and security overrides. |

### 4.2 Visitor Management Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `VISITOR_TYPES` | Visitor Classifications | No | No | New, Repeated, Group, VIP, Auditor, Consultant, Government, Candidate. |
| `VISIT_PURPOSES` | Visit Purposes | No | No | Meeting, Audit, Inspection, Training, Interview, Consultation, Site Visit. |
| `BOOKING_MODES` | Booking Modes | No | No | Pre-registered, Walk-in, Kiosk, Host-invited, Security-assisted. |
| `VISIT_CLASSIFICATIONS` | Confidentiality Tiers | Yes | No | Standard, High-Confidentiality, Restricted, Commercial. |
| `ESCORT_REQUIREMENTS` | Escort Requirements | Yes | Yes | Full Escort Required, Unescorted Allowed, Designated Route Only. |
| `VISITOR_DOCUMENT_REQUIREMENTS` | Document Rules | Yes | Yes | Mandatory documentation rules per visitor tier (Govt ID, Passport, NDA). |
| `VISITOR_ACCESS_CATEGORIES` | Access Categories | Yes | Yes | Public Lobby, General Office, Manufacturing Floor, R&D Labs. |

### 4.3 Customer Visit Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `CUSTOMER_CLASSIFICATIONS` | Customer Tiers | No | No | Tier-1 Strategic OEM, Commercial Buyer, Prospect, Channel Partner. |
| `CUSTOMER_VISIT_TYPES` | Visit Types | No | No | Executive Review, Factory Acceptance Test (FAT), Quality Audit, Sourcing. |
| `CUSTOMER_APPROVAL_REQUIREMENTS` | Approval Rules | Yes | Yes | Plant Director Clearance, Commercial Head Authorization. |
| `CUSTOMER_NDA_REQUIREMENTS` | NDA Rules | Yes | Yes | Bilateral Corporate NDA, Project-Specific Secrecy Declaration. |
| `CUSTOMER_ACCESS_REQUIREMENTS` | Access Clearances | Yes | Yes | Escorted Access Only, Photography Prohibition Badge. |
| `CUSTOMER_VISIT_INSTRUCTIONS` | Hospitality Protocols | No | No | VIP Parking, Boardroom Protocol, Corporate Briefing Book. |

### 4.4 Contractor Management Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `CONTRACTOR_CLASSIFICATIONS` | Contractor Trades | No | No | Civil Construction, Electrical, Mechanical, Housekeeping, IT Services. |
| `WORK_CATEGORIES` | Work Categories | Yes | Yes | Hot Work, Height Work, Confined Space, Chemical Handling. |
| `WORKER_CATEGORIES` | Worker Categories | No | No | Skilled Tradesperson, Certified Welder, Heavy Rigger, General Labour. |
| `QUALIFICATION_TYPES` | Qualifications | Yes | Yes | Certified Electrician, Heavy Crane Operator, Scaffold Inspector. |
| `SAFETY_TRAINING_TYPES` | Training Inductions | Yes | Yes | Annual General Induction, Chemical Safety, Working at Height. |
| `PERMIT_TYPES` | Permit To Work (PTW) | Yes | Yes | PTW Hot Work, Cold Work, Confined Space, High Voltage Isolation. |
| `MEDICAL_FITNESS_REQUIREMENTS` | Fitness Tests | Yes | Yes | Audiometric Test, Pulmonary Function Test, Vision Acuity. |
| `WORK_ORDER_CLASSIFICATIONS` | Work Order Tiers | No | No | Capital Project, Turnaround Shutdown, Routine Maintenance. |

### 4.5 Service & Plant Maintenance Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `SERVICE_CATEGORIES` | Service Categories | No | No | HVAC Servicing, Boiler Maintenance, Calibration, Fire System Audit. |
| `TECHNICIAN_CATEGORIES` | Technician Tiers | No | No | OEM Factory Specialist, Third-Party Technician, Certified Expert. |
| `SERVICE_WORK_ORDER_TYPES` | Work Order Types | No | No | Preventive Maintenance, Corrective Repair, Warranty Calibration. |
| `WORK_LOCATIONS` | Work Locations | Yes | No | Substation Yard, Compressor Room, Cleanroom Bay, Server Room. |
| `SERVICE_PERMIT_REQUIREMENTS` | Service Permits | Yes | Yes | Lockout/Tagout (LOTO), Gas Free Certification. |
| `MAINTENANCE_ACTIVITY_TYPES` | Activity Types | No | No | Bearing Replacement, Oil Flushing, Sensor Diagnostic. |
| `SAFETY_PREREQUISITES` | Safety Prerequisites | Yes | Yes | Flame Retardant Suit, Insulated Tools, Personal Gas Detector. |

### 4.6 Material Logistics Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `MATERIAL_CATEGORIES` | Material Categories | No | No | Raw Materials, Sub-assemblies, Consumables, MRO Spares, Hazmat. |
| `MATERIAL_TRANSACTION_TYPES` | Movement Types | Yes | Yes | Inward, Outward, Returnable, Non-returnable, Scrap, Sample, Tool, Spare. |
| `UNITS_OF_MEASURE` | UOM Definitions | No | No | Tonnes, Kilograms, Litres, Barrels, Pieces, Pallets. |
| `MATERIAL_OWNERSHIP_CATEGORIES` | Ownership | No | No | Company Owned, Consignment Stock, Customer Owned, Leased. |
| `MATERIAL_HAZARD_CLASSIFICATIONS` | Hazmat Tiers | Yes | Yes | Flammable Liquid, Toxic Substance, Corrosive, Compressed Gas. |
| `RETURNABLE_CLASSIFICATIONS` | Returnable Escrow | Yes | Yes | Returnable Packaging, Tooling & Dies, Test Equipment. |
| `INSPECTION_CATEGORIES` | Inspection Types | Yes | Yes | Weighbridge Gross/Tare, Quality Check, Radioactivity Scan. |
| `MATERIAL_DOCUMENT_REQUIREMENTS` | Document Rules | Yes | Yes | Delivery Challan, Purchase Order, SDS (Safety Data Sheet), Tax Invoice. |

### 4.7 Vehicle & Transport Domain (Independent Vectors)
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `TRANSPORT_MODES` | Transport Modes | No | No | Car, Two-Wheeler, Bus, Train, Flight, Taxi, Walking, Other. |
| `TRANSPORT_OWNERSHIP_TYPES` | Ownership Types | No | No | Personal, Company, Hired, Public, Transporter, Customer, 3PL. |
| `VEHICLE_TYPES` | Vehicle Classes | No | No | Hatchback, Sedan, SUV, Two-Wheeler, Bus, Van, Truck, Trailer. |
| `FUEL_TYPES` | Fuel Types | No | No | Petrol, Diesel, CNG, Electric, Hybrid Petrol, Hydrogen. |
| `USAGE_TYPES` | Usage Modes | No | No | Individual, Shared, Carpool, Company Pool, Public Commute. |
| `JOURNEY_TYPES` | Journey Types | No | No | One-way, Round-trip, Multi-stop, Local Campus. |
| `MEASUREMENT_METHODS` | Measurement | No | No | Measured (Weighbridge/Odometer), User-provided, System-estimated. |

### 4.8 Document, Legal & Compliance Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `DOCUMENT_TYPES` | Document Types | Yes | Yes | Government Photo ID, Passport, Driver License, Safety Certificate, NDA. |
| `DOCUMENT_CLASSIFICATIONS` | Classifications | Yes | Yes | Public, Internal, Confidential, Restricted, Highly Restricted. |
| `VERIFICATION_TYPES` | Verification Types | Yes | Yes | Automated OCR, Security Guard Manual Verification, Biometric Liveness. |
| `RETENTION_POLICIES` | Retention Schedules | Yes | Yes | Statutory 7-Year Tax Hold, 90-Day Ephemeral Visitor Photo, Permanent Audit. |
| `LEGAL_AGREEMENT_TYPES` | Agreements | Yes | Yes | Unilateral NDA, Mutual Non-Disclosure, Facility Code of Conduct. |
| `CONSENT_TYPES` | Consent Mandates | Yes | Yes | Data Processing Consent, Facial Biometric Storage Consent. |
| `EXPIRY_WARNING_SCHEDULES` | Expiry Warnings | No | No | 30 days prior, 7 days prior, 24 hours prior. |
| `REQUIRED_DOCUMENT_RULES` | Document Matrices | Yes | Yes | Mandatory document rules enforced across transactional domains. |

### 4.9 Safety & Emergency Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `INDUCTION_TYPES` | Induction Briefings | Yes | Yes | General Visitor Briefing, Contractor EHS Induction, Hazmat Training. |
| `SAFETY_TRAINING_CATALOG` | Training Catalog | Yes | Yes | Fire Extinguisher Handling, Confined Space Entry, Fall Protection. |
| `SAFETY_PERMIT_TYPES` | Permit Types | Yes | Yes | Hot Work, Cold Work, Excavation, High Voltage Intervention. |
| `PPE_REQUIREMENTS` | PPE Requirements | Yes | Yes | Hard Hat, High-Vis Vest, Steel-Toe Boots, Safety Glasses, Respirator. |
| `SAFETY_DECLARATION_TYPES` | Declarations | No | No | Zero Harm Commitment, Medical Fitness Self-Declaration. |
| `INCIDENT_TYPES` | Incident Types | Yes | Yes | Near Miss, First Aid Case, Lost Time Injury, Chemical Release. |
| `EXCEPTION_TYPES` | Safety Exceptions | Yes | Yes | Missing PPE Override, Escort Waiver, Manual Gate Override. |
| `MUSTER_POINTS` | Muster Points | Yes | Yes | Assembly Point Alpha, Assembly Point Bravo, Muster Point Charlie. |
| `EMERGENCY_CLASSIFICATIONS` | Emergency Tiers | Yes | Yes | Level 1 Localized Alert, Level 2 Site Evacuation, Level 3 Off-site Event. |

### 4.10 ESG / GHG Methodology Configuration Domain
| Category Code | Display Name | Sensitive? | Approval Req? | Description |
|---|---|---|---|---|
| `ESG_ACTIVITY_TYPES` | Activity Types | Yes | Yes | Commute, Business Travel, Inbound Freight, Outbound Freight, Machinery. |
| `DATA_QUALITY_CLASSIFICATIONS` | Data Quality Tiers | No | No | Tier 1 Primary Measured, Tier 2 User Reported, Tier 3 Estimated. |
| `ACTIVITY_PROVENANCE_TYPES` | Provenance Types | Yes | Yes | WEIGHBRIDGE_MEASURED, USER_PROVIDED, SYSTEM_CALCULATED, ERP. |
| `EVIDENCE_TYPES` | Evidence Types | No | No | Odometer Photo, Weighbridge Slip, Fuel Bill, E-Way Bill, GPS Log. |
| `METHODOLOGY_REFERENCES` | Methodologies | Yes | Yes | GHG Protocol Corporate Standard, ISO 14064-1, DEFRA Guidelines. |
| `GHG_SCOPE_DEFINITIONS` | Scope Definitions | Yes | Yes | Scope 1 Direct Mobile, Scope 2 Electricity, Scope 3 Value Chain. |
| `GHG_CATEGORY_DEFINITIONS` | Scope 3 Categories | Yes | Yes | Cat 4 Upstream Freight, Cat 6 Business Travel, Cat 7 Commuting, Cat 9. |
| `EMISSION_FACTOR_SOURCE_CLASSIFICATIONS`| Factor Sources | Yes | Yes | UK DEFRA 2025, US EPA 2024, IPCC AR6, CEA India Baseline. |
