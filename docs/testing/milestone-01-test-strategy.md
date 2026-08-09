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
- scrittura pazienti (`createPatient`, `updatePatient`, `setPatientStatus`): la riga creata è scoperta al tenant giusto, un `updatePatient` con il `tenantId` sbagliato restituisce `null` e non modifica nulla, `setPatientStatus` archivia/riattiva valorizzando/azzerando `archivedAt`;
- `tenantResolver.resolveActiveTenant`: risolve la membership `ACTIVE` di un utente, restituisce `null` se non ce n'è nessuna, ignora una membership `SUSPENDED`;
- `membershipChecker.verifyMembership`: conferma una membership valida nel tenant giusto, restituisce `null` per un tentativo cross-tenant;
- rifiuto di valori enum non validi (`role`) a livello database;
- cascata `ON DELETE CASCADE` da `tenants` a `memberships`.

## Cosa copre la suite Vitest unitaria

Variabili d'ambiente (`src/config/env.test.ts`), normalizzazione email/codice fiscale (`src/lib/normalize.test.ts`), mapping ruoli (`src/modules/memberships/roles.test.ts`), definizione piani/feature/limiti (`src/config/plans.test.ts`), utility monetarie (`src/modules/billing/money.test.ts`), componente `UsageMeter` (`src/components/shared/usage-meter.test.tsx`), guardia di autorizzazione delle rotte `/app/*` (`src/lib/auth-authorization.test.ts` — tenuta priva di import di `next-auth` così è testabile senza avviare Auth.js, vedi `docs/architecture/authentication-boundary.md`), schema di validazione pazienti (`src/modules/patients/validation.test.ts` — normalizzazione, email/data non valide), selezione del provider email (`src/modules/notifications/email-provider-factory.test.ts` — Resend vs Console in base a env/`NODE_ENV`, errore in produzione senza configurazione; non invia email reali, testa solo la logica di scelta), enforcement dell'autorizzazione per ruolo (`src/modules/memberships/authorization.test.ts` — `assertRole` non lancia quando il ruolo soddisfa il minimo, lancia `InsufficientRoleError` altrimenti).

## Cosa copre Playwright

Landing page, login (con l'avviso "modalità sviluppo"), dashboard Oggi, pagina Pazienti, pagina Abbonamento, pagina Impostazioni (mostra nome/email dell'utente autenticato, non sempre il titolare), pagina non trovata, navigazione desktop (sidebar), navigazione mobile (menu a sheet), redirect a `/login` per visitatori non autenticati su `/app/*`, sign out, CRUD pazienti (`tests-e2e/patients-crud.spec.ts`: crea, modifica, archivia, riattiva; blocca un'email non valida mostrando l'errore di campo), stato "nessuno studio associato" per un utente autenticato senza membership attiva. Esclude ancora qualunque flusso Stripe, perché non esiste.

Per i test che richiedono un utente autenticato, `tests-e2e/helpers/auth.ts` inserisce direttamente una riga in `sessions` (per l'owner demo seedato, o per un nuovo utente senza membership) e imposta il cookie `authjs.session-token`, invece di passare dal flusso magic-link reale (che richiederebbe leggere lo stdout del dev server, non accessibile al processo di test).

## Cosa manca volutamente

- Nessun test per flussi non implementati (checkout Stripe, inviti team).
- Nessun test che verifichi l'autorizzazione per ruolo sulle scritture pazienti (non ancora implementata — vedi `docs/audit/open-risks.md`).
- Nessun test per lo switch tra tenant quando un utente ha più membership (nessuna UI per farlo in questa milestone).
- Nessun test E2E che completi il flusso magic-link end-to-end cliccando il link reale (richiederebbe intercettare l'email/lo stdout del server); la sessione per i test autenticati viene creata direttamente nel database, vedi sopra.
- Nessun invio reale tramite Resend testato con una chiave API vera — `ResendEmailProvider` non è mockato/testato oltre alla logica di selezione del provider (non disponibile una chiave Resend in questo ambiente). Vedi `docs/audit/open-risks.md`.
- Nessun test di carico/performance.
- Copertura di codice non misurata numericamente in questa milestone; l'obiettivo era coprire i confini critici (isolamento tenant, validazione ambiente, entitlement), non raggiungere una percentuale.
