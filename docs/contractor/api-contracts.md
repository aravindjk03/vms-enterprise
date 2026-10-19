# Contractor Management API Contracts

## 1. Overview & Conventions

The Contractor Management Domain exposes a complete set of RESTful JSON endpoints for enterprise web applications, mobile contractor portals, edge access turnstile controllers, and ERP integrations.

### Standard Request Headers
- `Authorization: Bearer <JWT_TOKEN>` — Authenticated user token.
- `X-Tenant-Id: <TENANT_UUID>` — Mandatory multi-tenant isolation key.
- `X-Site-Id: <SITE_CODE>` — Facility plant identifier (e.g. `SITE-PUNE-01`).
- `Content-Type: application/json`

---

## 2. API Endpoints

### 2.1 Contractor Companies

#### `POST /api/v1/contractors/companies`
Registers a new contractor organization.
- **Request Body:**
  ```json
  {
    "organizationName": "Apex Industrial Infrastructure Ltd",
    "vendorCode": "VEND-APEX-01",
    "tradeName": "Apex Industrial",
    "contractorClassification": "GENERAL_CONTRACTOR",
    "safetyRating": "GRADE_A",
    "primaryContactName": "Rajesh Sharma",
    "primaryContactPhone": "+91 98220 11223",
    "primaryContactEmail": "r.sharma@apexindustrial.com",
    "approvedSiteIds": ["SITE-PUNE-01", "SITE-MUMBAI-02"],
    "insurancePolicyNumber": "POL-ENG-2026-9901",
    "insuranceExpiryDate": "2027-03-31"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "companyId": "060d4b9a-4bf7-4ba3-a720-7f22ddcfc3c8",
    "vendorCode": "VEND-APEX-01",
    "tradeName": "Apex Industrial",
    "status": "ACTIVE",
    "safetyRating": "GRADE_A",
    "createdAt": "2026-10-11T04:30:00.000Z"
  }
  ```

---

### 2.2 Commercial Contracts

#### `POST /api/v1/contractors/contracts`
Creates a commercial contract.
- **Request Body:**
  ```json
  {
    "companyId": "060d4b9a-4bf7-4ba3-a720-7f22ddcfc3c8",
    "contractNumber": "CNT-2026-081",
    "title": "Annual Plant Piping & Mechanical Maintenance MSA",
    "contractType": "MASTER_SERVICES_AGREEMENT",
    "startDate": "2026-10-01",
    "endDate": "2027-09-30",
    "scopeOfWork": "Mechanical maintenance across Bays 1 through 4",
    "siteId": "SITE-PUNE-01"
  }
  ```
- **Response `201 Created`:** Returns contract entity with status `ACTIVE`.

---

### 2.3 Work Orders

#### `POST /api/v1/contractors/work-orders`
Issues a work order tied to an active contract.
- **Request Body:**
  ```json
  {
    "contractId": "48b64e52-1f74-4b47-b844-386d34e9bfda",
    "companyId": "060d4b9a-4bf7-4ba3-a720-7f22ddcfc3c8",
    "workOrderNumber": "WO-INFRA-8801",
    "title": "Boiler Piping Overhaul",
    "workCategory": "MECHANICAL",
    "startDate": "2026-10-10",
    "endDate": "2026-11-15",
    "workLocation": "Heavy Machining Bay 2",
    "authorizedWorkerCount": 15,
    "safetyPermitRequired": true
  }
  ```

#### `POST /api/v1/contractors/work-orders/:id/approve`
Approves a submitted work order.
- **Response `200 OK`:** Work order transitions to `APPROVED`.

---

### 2.4 Worker Registration & Assignments

#### `POST /api/v1/contractors/workers`
Registers or deduplicates a contractor craftsperson.
- **Request Body:**
  ```json
  {
    "companyId": "060d4b9a-4bf7-4ba3-a720-7f22ddcfc3c8",
    "fullName": "Ramesh K. Yadav",
    "workerCategory": "SKILLED",
    "tradeSkill": "High-Pressure Steam Pipefitter",
    "phone": "+91 98220 12345",
    "govtIdHash": "78a9c1e...",
    "medicalFitnessValid": true,
    "medicalFitnessExpiry": "2027-06-30"
  }
  ```

#### `POST /api/v1/contractors/assignments`
Assigns a worker to an approved work order.
- **Request Body:**
  ```json
  {
    "workOrderId": "7b049d50-1365-4f0e-b78b-39f20108ec73",
    "contractorWorkerId": "3491f249-165b-4ec2-9e96-a059d0426b68",
    "assignedRole": "Lead Pipefitter",
    "startDate": "2026-10-11",
    "endDate": "2026-10-31",
    "shiftPattern": "DAY_SHIFT"
  }
  ```

---

### 2.5 Gate Operations & Turnstile Authorization

#### `POST /api/v1/contractors/authorization/evaluate`
Evaluates real-time turnstile authorization.
- **Request Body:**
  ```json
  {
    "contractorWorkerId": "3491f249-165b-4ec2-9e96-a059d0426b68",
    "siteId": "SITE-PUNE-01",
    "gateId": "GATE-02-TURNA"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "isAuthorized": true,
    "badgeNumber": "CW-4001",
    "workerName": "Ramesh K. Yadav",
    "companyName": "Apex Industrial Infrastructure Ltd",
    "workOrderNumber": "WO-INFRA-8801",
    "workLocation": "Heavy Machining Bay 2"
  }
  ```

#### `POST /api/v1/contractors/attendance/check-in`
Executes turnstile check-in with embedded commuter transport capture.
- **Request Body:**
  ```json
  {
    "contractorWorkerId": "3491f249-165b-4ec2-9e96-a059d0426b68",
    "workOrderId": "7b049d50-1365-4f0e-b78b-39f20108ec73",
    "gateId": "GATE-02-TURNA",
    "siteId": "SITE-PUNE-01",
    "transport": {
      "mode": "BUS",
      "distanceKm": 28.5,
      "isSharedVehicle": true,
      "tripRef": "SHUTTLE-ROUTE-NORTH-AM",
      "occupancy": 24
    }
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "attendanceId": "att-501",
    "presenceStatus": "CHECKED_IN",
    "entryTime": "2026-10-11T07:45:00.000Z",
    "transportActivityId": "tra-3001",
    "barrierCommand": "UNLATCH"
  }
  ```
