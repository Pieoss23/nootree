# Test Log — Milestone 1

Registro dei comandi di verifica eseguiti (lint, typecheck, test, build, migrazioni, seed, e2e) con esito.

Formato: data, comando, esito, note.

---

_(popolato progressivamente durante l'esecuzione della milestone — vedi fondo file per le esecuzioni più recenti)_

---

## 2026-07-31

| Comando                                                       | Esito | Note                                                                                                                     |
| ------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm db:generate`                                            | OK    | 18 tabelle generate in `src/db/migrations/0000_freezing_sleepwalker.sql` (dopo fix del doppio primary key su `accounts`) |
| `pnpm db:migrate` (nootree)                                   | OK    | Migrazione applicata al database di sviluppo su `localhost:5439/nootree`                                                 |
| `pnpm db:migrate` (nootree_test, via `DATABASE_URL` override) | OK    | Migrazione applicata al database di test su `localhost:5439/nootree_test`                                                |

**Nota impedimento risolto**: la porta host `5432` di default in `docker-compose.yml` era già occupata da un container Postgres di un altro progetto in esecuzione sulla stessa macchina. Riassegnata a `5439` in `docker-compose.yml`, `.env.example` e `.env.local`.

**Nota bug risolto**: lo schema iniziale di `accounts` dichiarava sia una colonna `id` con `.primaryKey()` sia una primary key composita su `(provider, providerAccountId)`, non consentito da PostgreSQL (`multiple primary keys ... not allowed`). Rimossa la colonna `id` ridondante, mantenendo la sola chiave composita (coerente con la convenzione dell'adapter Auth.js).

**Nota bug risolto**: `tenant_entitlements.limit_value` era `integer`, insufficiente per limiti come `storageBytes` (50 GB = 50.000.000.000, fuori range int4). Cambiato a `bigint` (`mode: "number"`). Migrazione rigenerata da zero con reset di entrambi i database (nessun dato di produzione coinvolto).

---

## 2026-07-31 (continua) — Vitest + Playwright

| Comando                      | Esito | Note                                                                    |
| ---------------------------- | ----- | ----------------------------------------------------------------------- |
| `pnpm typecheck`             | OK    | Nessun errore dopo l'aggiunta di moduli, shell UI, pagine e test        |
| `pnpm lint`                  | OK    | Nessun errore/warning ESLint                                            |
| `pnpm build`                 | OK    | Build di produzione completata, tutte le rotte generate correttamente   |
| `pnpm test` (Vitest)         | OK    | 7 file di test, 37 test totali, tutti superati (unit + integrazione DB) |
| `pnpm test:e2e` (Playwright) | OK    | 14 test (7 scenari × 2 progetti desktop/mobile), tutti superati         |

**Nota impedimento risolto**: il pacchetto `server-only`, usato per impedire l'import lato client di moduli server-side, lancia sempre un errore quando risolto fuori dalla condizione bundler `react-server` di Next.js — questo rompeva l'import di `@/db`, `@/config/env` e dei repository di dominio nei test Vitest. Risolto con un alias in `vitest.config.ts` che punta `server-only` a uno stub vuoto (`src/tests/server-only-stub.ts`), attivo solo nell'ambiente di test.

**Nota impedimento risolto**: il test e2e di login cercava un heading semantico ("Accedi") ma `CardTitle` di shadcn/ui renderizza un `<div>`, non un tag `<h1>-<h6>`. Corretto l'asserzione per cercare il testo visibile invece del ruolo `heading`.

**Verifica requisiti test DB** (`src/tests/db.integration.test.ts`, eseguito contro `TEST_DATABASE_URL`, mai contro il database di sviluppo):

1. connessione al database di test — OK
2. applicazione migrazioni da database vuoto (drop schema + migrate in `beforeAll`) — OK
3. seed (esecuzione doppia per verificarne l'idempotenza) — OK
4. stesso indirizzo email paziente ammesso in tenant diversi — OK
5. vincolo di unicità membership `(tenantId, userId)` — OK
6. unicità `(provider, providerEventId)` su `webhook_events` — OK
7. corretta associazione piano-feature (piano PROFESSIONAL) — OK
8. query pazienti (`listPatientsByTenant`, `getPatientById`) filtrata esplicitamente per tenant — OK
