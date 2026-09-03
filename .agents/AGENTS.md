# OutBox Email Scheduler — Project Rules

## Architecture
- This is a **monorepo** with `backend/` (Express + TypeScript) and `frontend/` (React + Vite + Tailwind).
- Follow the folder structure defined in the PRD exactly.

## Backend Rules
- Always use **Prisma** for database access — never raw SQL.
- Use **Zod** for all request body/params validation.
- Use **async/await** — never `.then()` chains.
- All services must be stateless — persist everything to Redis or PostgreSQL.
- Never use `cron`, `node-cron`, `agenda`, or any cron-based scheduling.
- All scheduling must use **BullMQ delayed jobs**.
- Rate limiting counters must use **Redis atomic INCR** — never in-memory counters.
- Every email must have a unique **idempotencyKey** to prevent duplicate sends.
- Use **structured JSON logging** via a logger utility.

## Frontend Rules
- Use **TypeScript** with strict mode for all components.
- Use **TanStack Query** (React Query) for all API calls.
- Use **Tailwind CSS** for styling — match the Figma design closely.
- Keep components small, reusable, and properly typed.
- Always handle loading, error, and empty states.

## Naming Conventions
- Files: `camelCase.ts` for utilities, `PascalCase.tsx` for React components.
- Backend routes: `kebab-case` in URL paths.
- Database: `snake_case` for table/column names (Prisma `@@map`).
- Environment variables: `SCREAMING_SNAKE_CASE`.

## Error Handling
- Backend: Global error middleware catches all errors; services throw typed errors.
- Frontend: React Query error boundaries + toast notifications.
