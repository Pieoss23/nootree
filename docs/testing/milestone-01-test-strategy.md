# Test Strategy — Milestone 1

## Livelli

1. **Unit test (Vitest + Testing Library)** — logica pura e componenti semplici, ambiente `jsdom`, alias `@` risolto in `vitest.config.ts`. `server-only` è aliasato a uno stub vuoto (`src/tests/server-only-stub.ts`) **solo nell'ambiente di test**, perché quel pacchetto lancia sempre un errore fuori dalla condizione bundler `react-server` di Next.js.
2. **DB integration test (Vitest, `src/tests/db.integration.test.ts`)** — colpiscono un database Postgres reale, mai quello di sviluppo.
3. **E2E smoke test (Playwright, `tests-e2e/`)** — avviano `pnpm dev` (o riusano un dev server già attivo in locale) e verificano che le pagine chiave siano navigabili.

## Perché il database di test è separato

`TEST_DATABASE_URL` punta a un database Postgres dedicato (`nootree_test` nel Docker Compose locale). `src/db/client.ts` seleziona automaticamente `TEST_DATABASE_URL` quando `NODE_ENV=test` (impostato di default da Vitest), così qualunque modulo importi `@/db` — incluso il codice di produzione sotto test — non tocca mai il database di sviluppo.

## Cosa copre `db.integration.test.ts`

All'avvio della suite (`beforeAll`), lo schema `public` del database di test viene **rilasciato e ricreato**, poi le migrazioni vengono applicate da zero — la suite quindi verifica anche che le migrazioni si applichino correttamente partendo da un database vuoto. Poi:

- connessione al database di test;
- seed (`seedDevelopmentData`, la stessa funzione usata da `pnpm db:seed`) eseguito due volte per verificarne l'idempotenza;
- corretta associazione piano→feature per il piano PROFESSIONAL;
- stessa email paziente ammessa in tenant diversi;
- vincolo di unicità membership `(tenantId, userId)`;
- vincolo di unicità webhook event `(provider, providerEventId)`;
- lettura pazienti (`listPatientsByTenant`, `getPatientById`) filtrata esplicitamente per tenant, incluso un tentativo di lettura cross-tenant che deve restituire `null`;
- rifiuto di valori enum non validi (`role`) a livello database;
- cascata `ON DELETE CASCADE` da `tenants` a `memberships`.

## Cosa copre la suite Vitest unitaria

Variabili d'ambiente (`src/config/env.test.ts`), normalizzazione email/codice fiscale (`src/lib/normalize.test.ts`), mapping ruoli (`src/modules/memberships/roles.test.ts`), definizione piani/feature/limiti (`src/config/plans.test.ts`), utility monetarie (`src/modules/billing/money.test.ts`), componente `UsageMeter` (`src/components/shared/usage-meter.test.tsx`).

## Cosa copre Playwright

Landing page, login (con l'avviso "modalità sviluppo"), dashboard Oggi, pagina Pazienti, pagina non trovata, navigazione desktop (sidebar) e navigazione mobile (menu a sheet). Esclude qualunque flusso Stripe o di autenticazione reale, perché non esistono ancora.

## Cosa manca volutamente

- Nessun test per flussi non implementati (checkout Stripe, invio email reale, CRUD pazienti, inviti team).
- Nessun test di carico/performance.
- Copertura di codice non misurata numericamente in questa milestone; l'obiettivo era coprire i confini critici (isolamento tenant, validazione ambiente, entitlement), non raggiungere una percentuale.
