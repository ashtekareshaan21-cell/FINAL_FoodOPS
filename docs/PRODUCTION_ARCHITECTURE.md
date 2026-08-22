# FoodOps 3.0 — Production Architecture Audit
## Vercel Edge Serverless + Next.js App Router + Neon PostgreSQL + Prisma ORM

**Role:** Senior Full-Stack Architect, Security Engineer, DevOps Engineer  
**Audit Date:** August 20, 2026  
**System Status:** Audit Only (No Code/Database Modification Performed)

---

## 1. Production Data Flow & Architecture

The application is designed for serverless, edge-optimized deployment on Vercel, integrated with a Neon serverless PostgreSQL database.

### Data Flow Diagram:
```
USER (Web Browser)
   ↓ (HTTPS / REST)
VERCEL (Edge Routing & Middleware)
   ↓ (Serverless Functions)
NEXT.JS APP ROUTER (Server Components & Server Actions)
   ↓ (Prisma Client + dynamic driver adapter)
PRISMA ORM & pg POOL
   ↓ (Connection Pooling / Secure TCP with SSL)
NEON POSTGRESQL (Production Database)
```

### Execution Boundaries:

1. **Client-Side Execution (Browser):**
   - **Code:** Client components marked with `'use client'` (e.g., [LoginForm.tsx](file:///d:/FINAL_FOODOPS/src/app/login/LoginForm.tsx), [RegisterForm.tsx](file:///d:/FINAL_FOODOPS/src/app/register/RegisterForm.tsx), and [CreateDonationForm.tsx](file:///d:/FINAL_FOODOPS/src/app/donor/create/CreateDonationForm.tsx)).
   - **Responsibilities:** Renders interactive elements, UI state changes, client-side input validations (e.g., image file size under 4MB limit), and loads Map API scripts.
   - **Security:** Private secrets, database queries, or the `GEMINI_API_KEY` are **never** present on the client.

2. **Server-Side Execution (Next.js Node.js Serverless):**
   - **Code:** Next.js Server Components, layouts, Pages (`page.tsx`), and Server Actions (`'use server'` files like [donations.ts](file:///d:/FINAL_FOODOPS/src/app/actions/donations.ts)).
   - **Responsibilities:** Checks and verifies user session cookies, accesses env variables (secrets), runs database queries using Prisma, calculates coordinates/bounding-boxes, hashes/verifies digital OTPs, and executes Gemini API requests.
   - **Security:** Enforces session validation on **every** protected action. Authentication and authorization boundaries are handled entirely on the server.

3. **Authentication & Authorization Checks:**
   - Sessions are read via `getSession()`, which decodes and validates custom JWT tokens from the `session` cookie.
   - Every protected server action explicitly verifies the user's role (e.g., `session.role !== 'DONOR'` throws `Unauthorized`).
   - Ownership validations are done in services (e.g., checks if `donation.acceptedNgoId === ngo.id` to prevent IDOR).

4. **Database Writes & Secrets Access:**
   - Writes are initiated in repositories under Prisma transactions.
   - Secrets (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) are accessed via `process.env` on the server and are never exposed in browser scripts.

---

## 2. Neon PostgreSQL Database Audit

The database schema is defined in [schema.prisma](file:///d:/FINAL_FOODOPS/prisma/schema.prisma). During development, it runs on SQLite via `@prisma/adapter-better-sqlite3`. During deployment, `prisma/prepare.js` automatically swaps the provider to `postgresql` when it detects a `postgresql://` string in `DATABASE_URL`.

### Database Schema Breakdown:

1. **Important Tables & Models:**
   - `User`: Primary account record (role, email, phone hash).
   - `OTPAttempt`: Track secure OTPs and logins.
   - `DonorProfile`, `NGOProfile`, `Volunteer`, `AdminProfile`: Extensions containing role-specific metadata.
   - `Donation`: Central rescue record (title, servings, coordinates, deadline, status).
   - `DonationStatusHistory`: Audit trail of state machine progressions.
   - `VolunteerAssignment`: Tracks rider dispatches and digital OTP handover tokens.
   - `ImpactRecord`: Climate metrics (CO₂ and water saved, calculation factors).
   - `AuditLog`: General operations logs.
   - `FoodListingAudit`: Results of AI visual reviews.

2. **Relationships & Foreign Keys:**
   - **One-to-One:** `User` has optional profiles (`DonorProfile?`, `NGOProfile?`, `Volunteer?`, `AdminProfile?`) mapped on `userId`.
   - **One-to-Many:** `DonorProfile` has many `Donation`. `NGOProfile` has many `Volunteer` riders, `Donation` claims, and `VolunteerAssignment`.
   - **Cascades (`onDelete: Cascade`):** Deleting a `User` cascades to delete their profiles, notifications, and OTP attempts. Deleting a `DonorProfile` cascades to delete their `Donation` listings.
   - **Restrict (`onDelete: Restrict`):** `VolunteerAssignment` uses `onDelete: Restrict` for `Volunteer` to prevent deletion of rider records associated with active or completed rescue assignments.

3. **Indexes & Constraints:**
   - `@unique` constraints are set on `User.email`, `User.phoneNumber`, `NGOProfile.organizationName`, and `NGOProfile.registrationNumber`.
   - Database indexes (`@@index`) are placed on frequently queried fields like `User.email`, `User.role`, `Donation.status`, `Donation.pickupLatitude, pickupLongitude`, `VolunteerAssignment.status`, and `AuditLog.timestamp` to speed up coordinate queries.

### Production Database Safety Checks:
- **Build Guard:** The Next.js `build` step only generates the Prisma client. It does **not** trigger migrations or seeding, eliminating the risk of data overwriting during deployments.
- **Reset Guard:** In [reset-dev.js](file:///d:/FINAL_FOODOPS/prisma/reset-dev.js), a guard detects if `DATABASE_URL` is a non-local PostgreSQL instance and aborts execution:
  ```javascript
  if (isPostgres && !isLocal) {
    console.error('Resetting is strictly prohibited on non-local instances.');
    process.exit(1);
  }
  ```

---

## 3. Database Capacity & Neon Limits

### Data Persistence:
All data is stored in the cloud-hosted Neon database. Vercel is stateless; redeploying applications does **not** affect database records or cause data loss.

### Neon Free Tier / Plan Constraints (Application Impact):
- **Storage Limits:** If Neon hits its storage limit (e.g., 3GB), PostgreSQL blocks subsequent insert and update queries. Prisma will throw error codes `P2002` (write fails) or database timeout errors.
- **Compute Auto-suspension:** Neon puts databases to sleep after inactivity. The first API request after auto-suspension experiences a slight cold-start delay (typically 1-3 seconds) while the database compute wakes up.
- **Connection Limits:** Serverless environments create many database client instances. The connection pooler in Neon (`pg` Pool + Prisma Adapter) should use the pooled connection port (`ep-...-pooler`) to prevent "too many connections" failures.

---

## 4. Environment Variables Security Audit

Every environment variable in the codebase has been verified and classified below.

| Variable Name | Exposure | Required/Optional | Classification | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | SERVER-ONLY | **REQUIRED** | Sensitive | Connection string for Neon PostgreSQL (or local SQLite file). |
| `JWT_SECRET` | SERVER-ONLY | **REQUIRED** | Sensitive | Key for signing and verifying lightweight JWT session cookies. |
| `GEMINI_API_KEY` | SERVER-ONLY | **OPTIONAL** | Sensitive | Google Gemini API key for visual audits. |
| `GEMINI_MODEL` | SERVER-ONLY | **OPTIONAL** | Non-Sensitive | Overrides Gemini model (defaults to `gemini-1.5-flash`). |
| `RESEND_API_KEY` | SERVER-ONLY | **OPTIONAL** | Sensitive | API Key for Resend transactional email dispatches. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | PUBLIC | **REQUIRED** | Public | Google Maps API key loaded in client web page. |

### Security Verification:
- **No Credentials Hardcoded:** No private database passwords or API keys are committed in code files.
- **Example Template Cleanliness:** The `.env.example` file contains placeholder values and instructions only.
- **Client Shielding:** No private keys or database URLs are prefixed with `NEXT_PUBLIC_`, ensuring they are excluded from the client build bundle.

---

## 5. Registration Architecture & UX Flow

To align with the desired UX changes where the platform does not expose three separate login portals, the system has been verified.

### Current Flow:
```
USER 
  ↓
/register
  ├── Tab: Donor (Fills donor details + map)
  ├── Tab: NGO (Fills NGO details + license + radius)
  └── Tab: Volunteer (Selects affiliated NGO from list)
```

### Desired Flow:
```
FOODOPS LANDING PAGE
  ↓
SIGN IN / REGISTER (Unified credentials input: Email, Password, Phone)
  ↓
SELECT ROLE (DONOR, NGO, or VOLUNTEER)
  ↓
Role-specific profile creation (Fields and map location selection)
  ↓
Redirect to Dashboard
```

### Gaps & Required Changes:
- **Current Support:** The schema and services already support this separation because profiles are independent models (`DonorProfile`, `NGOProfile`, `Volunteer`) linked to the base `User` table.
- **Required UI Changes:** Split the current [RegisterForm.tsx](file:///d:/FINAL_FOODOPS/src/app/register/RegisterForm.tsx) into a multi-step form. 
  1. Step 1: Base account creation (Email, Phone, Password).
  2. Step 2: Role selection buttons (excluding ADMIN).
  3. Step 3: Conditional fields (Donor fields/Map vs. NGO fields/FSSAI/Radius vs. Volunteer NGO affiliation list).
- **Backend Adaptability:** The backend services in [authService.ts](file:///d:/FINAL_FOODOPS/src/services/authService.ts) and actions in [auth.ts](file:///d:/FINAL_FOODOPS/src/app/actions/auth.ts) can support this flow without modifications, as they already process base credentials and profile data together.

---

## 6. Cross-Device Data Persistence Validation

The platform is verified as **fully database-backed and persistent**. It does not rely on browser-only state (`localStorage` or mock arrays) for lifecycle coordination.

### Cross-Device Data Flow:
```
[DEVICE A: DONOR]                       [NEON POSTGRESQL DATABASE]                       [DEVICE B: NGO]
Creates Donation ────────────────────> Insert Donation (AVAILABLE) ───────────────> Sees nearby donation
                                                                                        │
NGO claims donation <───────────────── Update status to ACCEPTED <──────────────────────┘
(Sees claim update)
                                                  │
                                                  ▼
[DEVICE C: RIDER]                        Update Assignment (ARRIVED) <─────────────── Assigned volunteer
Sees assignment ─────────────────────> Verify OTP (Hashed check)
                                                  │
                                                  ▼
Donor sees status update <─────────── Update status to PICKED_UP ──────────────────> NGO sees collection
```

Every action is immediately committed to the Neon database via Server Actions, triggering page revalidations (`revalidatePath`) in Next.js. This ensures all connected devices retrieve up-to-date data on page refresh.

---

## 7. Claim Engine Concurrency Safety

To prevent double-claims if multiple NGOs click "Claim" at the same time, FoodOps uses a database-level concurrency guard.

### Claim Transaction Code:
```typescript
const affected = await tx.donation.updateMany({
  where: {
    id: donationId,
    status: 'AVAILABLE', // Only claim if still AVAILABLE
  },
  data: {
    status: 'ACCEPTED',
    acceptedNgoId: ngo.id,
  },
});

if (affected.count === 0) {
  throw new Error('DONATION_ALREADY_ACCEPTED');
}
```

### How it works:
1. When NGO A and NGO B concurrently claim the same donation, they are processed in a queue by PostgreSQL.
2. The first transaction to execute updates the donation status to `ACCEPTED` and sets `acceptedNgoId`.
3. When the second transaction executes, the `where` clause (`status: 'AVAILABLE'`) evaluates to false, updating 0 rows.
4. The service detects `affected.count === 0`, throws a rollback exception, and aborts the second claim, returning a controlled error to the user.

---

## 8. Matching System Audit

The matching service ([matchingService.ts](file:///d:/FINAL_FOODOPS/src/services/matchingService.ts)) connects listings to NGOs using several criteria:

```
Donation Created
   ↓
Geohash Bounding Box query (Filters candidate donations by radius)
   ↓
Iterate matches through criteria list:
   ├── Status Check (Must be AVAILABLE)
   ├── Expiry Check (Current time < Deadline)
   ├── Distance Check (Haversine distance <= NGO Service Radius)
   ├── Food Category Check (Normalizes category and matches accepted types)
   ├── NGO Verification Check (NGO must be VERIFIED by Admin)
   └── NGO Availability Check (NGO must be AVAILABLE, not BUSY or OFFLINE)
```

### Investigation of Mismatches (Distance < 10 km but no match):
If an NGO is within the 10 km radius but does not see a donation, the matching diagnostics trace the following causes:
1. **Verification Status:** The NGO is pending admin review (`NGOProfile.status` is default `PENDING_VERIFICATION`).
2. **Availability Toggle:** The NGO has set their status to `BUSY` or `OFFLINE` in settings.
3. **Food Category Mismatch:** The donation category does not match the NGO's accepted types. For example, if a listing is categorized as `'grains'`, but the NGO has only enabled `'COOKED_VEG'` in settings, the compatibility check fails.
4. **Dietary Constraint (Veg/Non-Veg):** If a donation is categorized as `'mixed'` with dietary info `'MIXED'` (meaning both veg and non-veg items are present), a vegetarian-only NGO will fail compatibility. The system evaluates `'MIXED'` or `'NON_VEG'` as requiring `'COOKED_NON_VEG'` capability.
5. **Deadline Expiration:** If the current system time has passed the donation's `pickupDeadlineAt` (evaluated in UTC), the donation is filtered out.
