# Sellers Hub Module-by-Module Improvement Plan

## Tech Stack Summary

| Layer | Tech | Version | Role |
|-------|------|---------|------|
| Frontend | React 19 + Vite | 19.2.6 | Seller dashboard SPA |
| State mgmt | Zustand | 5.0.13 | Session/auth store |
| Data fetching | TanStack Query | 5.100 | Server state, optimistic updates, pagination |
| Styling | Tailwind CSS 4 | 4.3.0 | Utility-first CSS |
| Icons | Lucide React | 1.16.0 | Iconography |
| Charts | Recharts | 3.8.1 | Analytics widgets |
| Backend | NestJS 11 | 11.0.x | API microservice |
| Auth | Passport + JWT | 11.0.x | Stateless token auth |
| Validation | class-validator + class-transformer | 0.15.x | DTO validation |
| Observability | prom-client | 15.1.3 | Prometheus metrics |
| Testing | Jest + Supertest | 30.x | Unit + e2e |
| Workers | TypeScript (Node) | - | Async background jobs |
| Infra | Docker Compose, Terraform, Helm, K8s | - | Local + cloud deployment |
| CI/CD | GitHub Actions | - | Lint → Test → Build |

## Module Map

```
apps/frontend/          → Shell, Login, Dashboard, Onboarding, Catalog, Orders,
                          Shipments, Finance, Analytics, Discovery, Comparison, Admin
services/api/           → Auth (login/refresh), Platform (catalog/analytics/
                          discovery/redirect/health/metrics)
workers/reconciliation  → Settlement mismatch detection (stub)
workers/media-processor → Image/media async processing (stub)
workers/bulk-uploads    → CSV/Excel bulk product import (stub)
workers/analytics-ingestion → Event batch ingestion (stub)
workers/affiliate-sync  → External affiliate feed sync (stub)
packages/types          → Shared TS types
packages/utils          → Tenant key builder, paginate helper
packages/config         → AppEnvironment interface
packages/ui             → Panel primitive
infra/docker            → Local compose
infra/k8s / helm        → K8s deployments + Helm chart
infra/terraform         → K8s namespace bootstrap
```

## Current Gaps

1. Frontend uses hardcoded mock data — no real API integration
2. Auth: no password reset, no refresh token rotation (re-signs same token)
3. Catalog: read-only via API — no create/update/delete endpoints
4. Orders/Finance: hardcoded values, no persistence
5. Workers: contract stubs only, no real job logic
6. No DB integration (Postgres/Redis/MinIO defined but unused)
7. Minimal test coverage
8. No tracing or structured logging

## Execution Plan (Commit after each feature)

| Module | Feature | Commit |
|--------|---------|--------|
| 1. Auth | Password reset flow + refresh token rotation | `feat(auth): password reset and refresh token rotation` |
| 2. Catalog | Full product CRUD + image upload (MinIO) | `feat(catalog): product CRUD and image upload` |
| 3. Orders | Order lifecycle state machine + persistence | `feat(orders): order state machine and persistence` |
| 4. Finance | Immutable ledger + payout batches | `feat(finance): ledger and payout batching` |
| 5. Analytics | Event ingestion pipeline + dashboards | `feat(analytics): event ingestion and dashboards` |
| 6. Discovery/Affiliate | Offer matching + redirect tracking | `feat(discovery): offer matching and redirect tracking` |
| 7. Workers | Bulk uploads, media processing, affiliate sync, reconciliation | `feat(workers): async job implementations` |
| 8. Frontend | Connect to real API, forms, validation, error handling | `feat(frontend): real API integration` |
| 9. CI/CD & Infra | Docker multi-stage, Helm upgrades, Terraform, pipeline gates | `feat(infra): production-ready deployment` |
| 10. Testing & Observability | Unit/e2e tests, Prometheus metrics, tracing | `feat(observability): metrics, tracing, test coverage` |
