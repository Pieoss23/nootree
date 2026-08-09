# nootree

Gestionale SaaS multi-tenant per studi di nutrizione — **Milestone 1: fondazioni**. Non è un prodotto completo: vedi [docs/product/milestone-01-scope.md](docs/product/milestone-01-scope.md) per cosa è realmente implementato e cosa è solo predisposto.

## Quick start

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Dettagli completi: [docs/setup/local-development.md](docs/setup/local-development.md).

## Stack

Next.js (App Router) · TypeScript strict · Tailwind CSS · shadcn/ui · PostgreSQL · Drizzle ORM · Zod · Vitest · Testing Library · Playwright · ESLint · Prettier.

## Documentazione

- [Scope della milestone](docs/product/milestone-01-scope.md)
- [Panoramica architettura](docs/architecture/architecture-overview.md)
- [Modello dati](docs/architecture/domain-model.md)
- [Multi-tenancy](docs/architecture/multi-tenancy.md)
- [Regole di isolamento tenant](docs/security/tenant-isolation-rules.md)
- [Strategia di test](docs/testing/milestone-01-test-strategy.md)
- [Setup locale](docs/setup/local-development.md) · [Variabili d'ambiente](docs/setup/environment-variables.md) · [Database](docs/setup/database.md)
- [Audit log](docs/audit/execution-log.md) · [Decisioni](docs/audit/decisions.md) · [Rischi aperti](docs/audit/open-risks.md)
