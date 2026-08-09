# Architecture Overview

## Stile architetturale

nootree è un **modular monolith**: una singola applicazione Next.js (App Router) deployata come unico processo, ma organizzata internamente per domini di business (`src/modules/*`) invece che per tipo tecnico. Vedi [ADR 001](./decisions/001-modular-monolith.md).

```
Browser
  │
  ▼
Next.js App Router (src/app)          ← routing, layout, server components
  │
  ▼
Domain modules (src/modules/*)        ← contratti, repository, regole di dominio
  │
  ▼
Drizzle ORM (src/db)                  ← schema, query, migrazioni
  │
  ▼
PostgreSQL (Docker Compose in locale)
```

## Principi

1. **Un solo processo, confini interni chiari.** Nessun microservizio: la separazione è a livello di modulo TypeScript, non di rete.
2. **I provider esterni sono dietro un'interfaccia.** Auth.js, Resend, Stripe non sono mai importati da un modulo di dominio: ogni modulo espone un contratto (`IdentityService`, `EmailProvider`, `BillingProvider`) e un'implementazione concreta verrà iniettata dall'infrastruttura. Vedi [ADR 004](./decisions/004-provider-adapters.md).
3. **Multi-tenancy a schema condiviso.** Un solo database, `tenantId` su ogni tabella tenant-owned, isolamento applicato a livello di query — mai a livello di schema/database separato. Vedi [multi-tenancy.md](./multi-tenancy.md) e [ADR 002](./decisions/002-shared-schema-multitenancy.md).
4. **Persistenza tipizzata e migrazioni esplicite.** Drizzle ORM + Drizzle Kit, mai sync distruttivo dello schema. Vedi [ADR 003](./decisions/003-drizzle-postgresql.md).
5. **Validazione a runtime ai confini.** Le variabili d'ambiente sono validate con Zod all'avvio (`src/config/env.ts`); gli input utente verranno validati con Zod quando i flussi di mutazione saranno implementati.

## Stato di questa milestone

Questa milestone copre solo le fondamenta: non esiste ancora un livello di autenticazione/autorizzazione applicato realmente, quindi il diagramma sopra descrive l'architettura di destinazione. Vedi [docs/product/milestone-01-scope.md](../product/milestone-01-scope.md) per cosa è realmente implementato oggi.
