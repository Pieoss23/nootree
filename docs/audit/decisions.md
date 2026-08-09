# Decision Log — Milestone 1

Elenco delle decisioni architetturali e operative prese durante la Milestone 1, con motivazione sintetica. Le decisioni estese sono documentate come ADR in `docs/architecture/decisions/`.

---

## 2026-07-31 — Bootstrap da repository vuota

**Decisione**: procedere con inizializzazione completa (Next.js + TypeScript strict + pnpm) poiché la directory di lavoro non conteneva alcun file preesistente.

**Motivazione**: nessun rischio di conflitto o perdita di lavoro pregresso.

**Alternative scartate**: nessuna, non applicabile.

---

## 2026-07-31 — Modular monolith con cartelle a dominio

**Decisione**: adottare la struttura `src/modules/*` per i domini di business (identity, tenancy, memberships, billing, entitlements, patients, audit, notifications), separata da `src/app` (routing) e `src/db` (persistenza).

**Motivazione**: richiesta esplicita della milestone; evita la complessità di microservizi non necessaria in questa fase, mantenendo confini di dominio chiari tramite contratti TypeScript. Vedi ADR 001.

---

## 2026-07-31 — Multi-tenancy a schema condiviso

**Decisione**: un solo schema PostgreSQL condiviso tra tutti i tenant, con colonna `tenantId` su ogni tabella tenant-owned, invece di schema-per-tenant o database-per-tenant.

**Motivazione**: minor complessità operativa per una fase iniziale, compatibile con la scala attesa; l'isolamento è garantito a livello applicativo tramite firma delle query (`{ tenantId, ... }`). Vedi ADR 002.

---

## 2026-07-31 — Drizzle ORM + PostgreSQL

**Decisione**: Drizzle ORM con Drizzle Kit per le migrazioni versionate, driver `postgres` (postgres-js).

**Motivazione**: tipizzazione end-to-end, migrazioni SQL esplicite e ispezionabili, nessun magic sync distruttivo in produzione. Vedi ADR 003.

---

## 2026-07-31 — Adapter pattern per provider esterni

**Decisione**: Auth.js, Resend e Stripe non sono referenziati direttamente dai moduli di dominio; ogni modulo espone un'interfaccia (`IdentityService`, `EmailProvider`, `BillingProvider`) con implementazione concreta iniettata nell'infrastruttura.

**Motivazione**: consente di predisporre i confini senza implementare integralmente i flussi reali (fuori scope Milestone 1), e mantiene il dominio testabile e indipendente dal provider. Vedi ADR 004.
