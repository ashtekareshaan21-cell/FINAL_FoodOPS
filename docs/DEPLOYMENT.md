# Deployment Guide - FoodOps Phase 2

FoodOps is structured to deploy smoothly on **Vercel** (production web app) and can be fully containerized using **Docker** for standardized staging environments.

---

## 1. Production Deployment (Vercel)

Vercel is the primary host for the web app because of its serverless functions, static optimization, and direct edge network.

### 1.1 Step-by-Step Vercel Setup
1. **Prepare Database:** Provision a PostgreSQL instance (e.g. Neon, Supabase, or AWS RDS).
2. **Configure Environment Variables:** In the Vercel dashboard, navigate to **Project Settings > Environment Variables** and add:
   - `DATABASE_URL`: Connection string to the production PostgreSQL.
   - `JWT_SECRET`: Random 32-character string for signing auth tokens.
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript SDK key.
   - `RESEND_API_KEY`: Key from Resend for transactional email dispatch.
3. **Link Repository:** Connect Vercel to your GitHub repository.
4. **Deploy:** Build settings are auto-detected. The build command `npm run build` will execute, running the Prisma prepare script, generating client libraries, and bundling Next.js pages.

---

## 2. Containerized Deployment (Docker)

To run the entire ecosystem locally or on a private virtual server (VPS) with matching local-production infrastructure, use Docker Compose.

### 2.1 Running the Containers
1. Ensure Docker and Docker Compose are installed on the host.
2. In the project root, run:
   ```bash
   docker-compose up --build
   ```
3. This command will:
   - Compile the Next.js app in a multi-stage Docker builder image.
   - Spin up a PostgreSQL 15 container and map data volumes.
   - Spin up a Redis container.
   - Boot the Next.js app on `http://localhost:3000`, connecting to the PostgreSQL container.

---

## 3. Database Migration Deployment
When pushing schema updates to production:
- Do not run `prisma db push` in production. Instead, run:
  ```bash
  npx prisma migrate deploy
  ```
- This applies compiled SQL migrations sequentially without resetting table contents.
