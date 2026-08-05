# Contributing Guidelines - FoodOps Phase 2

Thank you for contributing to the circular food rescue platform. To maintain a production-grade software standard, please follow these workflows:

## 1. Code Standards

### 1.1 Architectural Compliance
- **No Direct Database Queries:** Never query the database directly inside files in `src/app/pages` or `src/app/actions/`. Use the Services layer (`src/services/`) and Repositories layer (`src/repositories/`).
- **No Direct Email Dispatches:** Trigger emails strictly through the unified `emailService`.

### 1.2 TypeScript Rules
- **No `any` or `ts-ignore`:** Every input parameter, return type, and database model mapping must be fully typed. If a type is unknown or compound, define a specific `interface` or use Prisma's generated types (e.g. `Prisma.UserCreateInput`).

---

## 2. Testing Requirements

- **Write Unit/Integration Tests:** Every new service or business rule must include unit tests matching the structure inside `src/__tests__/`.
- **Run the Suite:** Ensure all tests pass before opening a PR:
  ```bash
  npm test
  ```

---

## 3. Pull Request Checklist

Before submitting a PR, run the local verification checks in order:
1. **Linter:** `npm run lint` (ensure zero warnings or errors).
2. **TypeScript:** `npx tsc --noEmit` (ensure zero type compilation issues).
3. **Tests:** `npm test` (ensure all tests pass).
4. **Build:** `npm run build` (ensure production build compiles successfully).
