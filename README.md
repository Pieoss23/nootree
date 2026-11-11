# nootree

[![CI](https://github.com/Pieoss23/nootree/actions/workflows/ci.yml/badge.svg)](https://github.com/Pieoss23/nootree/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Gestionale SaaS **multi-tenant** per studi di nutrizione: più studi sullo
stesso database, ciascuno che vede soltanto i propri dati. Pazienti, piani
alimentari, appuntamenti, ricette e fatturazione, con isolamento fra tenant
verificato dai test, non solo dichiarato.

> **Stato: Milestone 1 — fondazioni.** Non è un prodotto completo. Cosa è
> davvero implementato e cosa è solo predisposto sta in
> [docs/product/milestone-01-scope.md](docs/product/milestone-01-scope.md),
> e i problemi ancora aperti in
> [docs/audit/open-risks.md](docs/audit/open-risks.md).

## Cosa dimostra questo progetto

- **Multi-tenancy presa sul serio.** Le regole di isolamento sono scritte
  ([docs/security/tenant-isolation-rules.md](docs/security/tenant-isolation-rules.md))
  e coperte da test di integrazione: in un gestionale sanitario una query
  che dimentica il filtro sul tenant è un incidente, non un bug.
- **Dominio diviso in moduli.** Dodici aree separate — pazienti,
  appuntamenti, ricette, fatturazione, identità, entitlements, audit,
  notifiche — invece di un unico blocco indistinto.
- **TypeScript in modalità strict**, con validazione a runtime tramite Zod
  ai confini: i tipi spariscono in esecuzione, i dati in ingresso no.
- **Rischi aperti dichiarati.** `docs/audit/open-risks.md` elenca quello che
  non è ancora risolto. Un progetto che dichiara i propri buchi è più
  affidabile di uno che finge di non averne.
- **Decisioni tracciate** in `docs/audit/decisions.md`, con il motivo delle
  scelte e non solo il risultato.

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

## Verifiche

```bash
pnpm check   # formattazione, lint, tipi, test
```

**146 test su 22 file.** I 117 unitari girano senza dipendenze esterne; i 29
di integrazione richiedono `TEST_DATABASE_URL` e si saltano da soli quando non
è configurata, così `pnpm test` resta verde anche senza un Postgres locale.

La CI (`.github/workflows/ci.yml`) il database invece ce l'ha, quindi li
esegue tutti: le migrazioni vengono applicate da uno schema vuoto a ogni
push e le regole di isolamento fra tenant sono verificate contro PostgreSQL
reale, non contro un mock.

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
