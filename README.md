# FoodOps - From Surplus to Sustenance

FoodOps is a Circular Food Rescue Logistics platform designed to minimize food waste and optimize distribution. It connects food donors (restaurants, caterers, supermarkets) directly with verified NGOs, dispatching volunteer riders, and tracking delivery progress while calculating water and carbon emissions impact.

---

## 1. Quick Start

### 1.1 Local Setup (SQLite)
1. **Clone & Install:**
   ```bash
   git clone <repo-url>
   cd final_foodops
   npm install
   ```
2. **Environment Variables:**
   Create a `.env` file in the root based on `.env.example` (or use the configured local SQLite path):
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_jwt_secret"
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_KEY_HERE"
   ```
3. **Database Preparation & Seed:**
   ```bash
   node prisma/prepare.js
   npx prisma generate
   node prisma/seed.js
   ```
4. **Run Dev Server:**
   ```bash
   npm run dev
   ```
5. **Open Portal:** Navigate to `http://localhost:3000`.

---

## 2. Docker Execution (PostgreSQL)
To build and run the entire stack (Next.js app, PostgreSQL 15, Redis) under local container environments matching production:
```bash
docker-compose up --build
```
This serves the application on `http://localhost:3000` connected to PostgreSQL.

---

## 3. Quality & Testing

### 3.1 Verification Checklist
Before submitting modifications, ensure you run quality checks:
```bash
# Run ESLint linter
npm run lint

# Run TypeScript static compiler
npx tsc --noEmit

# Run Vitest test suites
npm test

# Run Production compile build
npm run build
```

---

## 4. Documentation Index

Detailed engineering manuals are located in the `docs/` folder:
- [Architecture & Layering Guide](file:///d:/FINAL_FOODOPS/docs/ARCHITECTURE.md)
- [Database Schema & Optimizations](file:///d:/FINAL_FOODOPS/docs/DATABASE.md)
- [Vercel & Container Deployment Guide](file:///d:/FINAL_FOODOPS/docs/DEPLOYMENT.md)
- [Server Actions API Contracts](file:///d:/FINAL_FOODOPS/docs/API.md)
- [Developer Contribution Rules](file:///d:/FINAL_FOODOPS/docs/CONTRIBUTING.md)
- [Environment Configuration Manual](file:///d:/FINAL_FOODOPS/docs/ENVIRONMENT_VARIABLES.md)
