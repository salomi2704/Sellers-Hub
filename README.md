# Sellers Hub

Sellers Hub is a production-oriented multi-tenant seller operations platform scaffold with a React 19 frontend, a NestJS 11 API, shared domain packages, worker contracts, and deployable infrastructure definitions.

## Repository layout

- `apps/frontend` – seller and admin web application with guarded routes, analytics widgets, discovery, onboarding, and affiliate comparison UX
- `services/api` – API-first NestJS service with tenancy context, JWT auth, RBAC, health checks, observability, redirect logging, and discovery endpoints
- `workers/*` – async worker contracts for media, bulk upload, affiliate sync, analytics ingestion, and reconciliation
- `packages/*` – shared configuration, domain types, utilities, and UI primitives
- `infra/*` – local Docker, Kubernetes, and Terraform bootstrap configuration
- `helm/sellers-hub` – Helm chart for production deployment

## Commands

```bash
npm --prefix apps/frontend install
npm --prefix services/api install
npm run lint
npm run test
npm run build
```

## Demo credentials

Use `owner@sellers-hub.test` with password `Password@123` against the API login endpoint to retrieve a JWT containing tenant and permission claims.