# Execution Log — Milestone 1

Registro cronologico delle modifiche eseguite durante la Milestone 1 (Fondazioni del SaaS per Nutrizionisti).

Ogni voce riporta: data/ora, fase, obiettivo, modifiche, file coinvolti, decisioni, comandi eseguiti, risultato, rischi aperti.

---

## 2026-07-31 — Fase 1 — Analisi iniziale

**Obiettivo**: verificare lo stato della repository e predisporre l'audit trail prima di qualsiasi modifica al codice.

**Modifiche**:

- Verificata la directory di lavoro `c:\dev\nootree`: risultava vuota, priva di repository git.
- Eseguito `git init` per abilitare il versionamento e la tracciabilità delle modifiche.
- Creata la struttura `docs/audit/`, `docs/product/`, `docs/architecture/decisions/`, `docs/security/`, `docs/testing/`, `docs/setup/`.
- Creati i quattro file di audit richiesti: `execution-log.md`, `decisions.md`, `test-log.md`, `open-risks.md`.

**File coinvolti**:

- `docs/audit/execution-log.md`
- `docs/audit/decisions.md`
- `docs/audit/test-log.md`
- `docs/audit/open-risks.md`

**Decisioni**: nessun codice preesistente da valutare o preservare; si procede con un bootstrap completo da repository vuota (vedi `docs/audit/decisions.md`).

**Comandi eseguiti**:

- `git init` → repository inizializzata correttamente in `.git`.
- `node -v` → v24.13.1
- `pnpm -v` → 10.30.0
- `git --version` → 2.53.0
- `docker --version` / `docker compose version` → disponibili (Docker 29.2.1, Compose v5.0.2)

**Risultato**: ambiente idoneo al bootstrap (Node, pnpm, git, Docker disponibili).

**Rischi aperti**: nessuno specifico a questa fase; si veda `docs/audit/open-risks.md` per i rischi complessivi della milestone.

---

## 2026-07-31 — Fasi 2-10 — Bootstrap, dominio, database, UI, testing

**Obiettivo**: costruire l'intera milestone come da checklist (bootstrap Next.js, struttura a domini, database, variabili ambiente, UI system, shell applicativa, health check/error handling, testing).

**Modifiche principali**:

- Bootstrap con `create-next-app` (App Router, `src/`, TS strict, Tailwind, ESLint) + Prettier + shadcn/ui configurati manualmente sopra.
- 8 moduli di dominio creati in `src/modules/*` con contratti e, dove nel perimetro della milestone, implementazioni reali basate su Drizzle.
- Schema Drizzle completo (18 tabelle) in `src/db/schema/*`, migrazione generata e applicata a database di sviluppo (`nootree`) e di test (`nootree_test`) via Docker Compose.
- Configurazione centralizzata piani/feature/limiti in `src/config/plans.ts`.
- Validazione ambiente con Zod (`src/config/env.ts`, `env.client.ts`) + `.env.example`.
- Seed di sviluppo idempotente (`src/db/seed-core.ts` + `seed.ts`), verificato eseguendolo due volte.
- Componenti UI condivisi, shell applicativa responsive, 7 pagine iniziali — tutte verificate live con il dev server (curl su ogni rotta + verifica contenuto renderizzato contro i dati seed).
- Health check (`/api/health`) verificato live (risponde `{"status":"ok", "database":"up", ...}`).
- 37 test Vitest (unit + integrazione DB) e 14 test Playwright (2 progetti × 7 scenari), tutti superati.
- Documentazione completa in `docs/product`, `docs/architecture` (+ 4 ADR), `docs/security`, `docs/testing`, `docs/setup`.

**File coinvolti**: l'intero albero `src/`, `docs/`, file di configurazione a livello di repository (`package.json`, `tsconfig.json`, `drizzle.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `docker-compose.yml`, `eslint.config.mjs`, `.prettierrc.json`).

**Comandi eseguiti**: vedi `docs/audit/test-log.md` per l'elenco dettagliato con esito.

**Decisioni**: vedi `docs/audit/decisions.md` e gli ADR in `docs/architecture/decisions/`.

**Rischi aperti**: vedi `docs/audit/open-risks.md` (consolidato a fine milestone).

---

## 2026-08-09 — Milestone 1.1 — Autenticazione reale (Auth.js)

**Obiettivo**: chiudere il rischio "nessuna autenticazione reale" collegando `IdentityService` a un'implementazione reale, come indicato in `docs/audit/open-risks.md`.

**Modifiche**:

- Aggiunte le dipendenze `next-auth@5.0.0-beta.32` e `@auth/drizzle-adapter@1.11.3`.
- `src/lib/auth.ts` (nuovo): configurazione Auth.js — adapter Drizzle su `users`/`sessions`/`verification_tokens`, sessioni `database`, provider `Nodemailer` (id `"email"`) con `sendVerificationRequest` che usa ancora `ConsoleEmailProvider` in sviluppo, callback `authorized` che protegge i path `/app/*`.
- `src/db/schema/identity.ts`: rinominate le proprietà JS `emailVerifiedAt` → `emailVerified` (users) e `expiresAt` → `expires` (sessions, verification_tokens) per farle combaciare con le chiavi attese dall'adapter Drizzle di Auth.js. Nessuna migrazione: i nomi colonna DB sono invariati. La tabella `accounts` resta con le colonne esistenti (non ancora nella forma OAuth di Auth.js) perché non è mai toccata dal flusso solo-email; viene castata esplicitamente al momento di passarla all'adapter.
- `src/app/api/auth/[...nextauth]/route.ts` (nuovo): espone gli handler `GET`/`POST` di Auth.js.
- `src/proxy.ts` (nuovo): sostituisce il vecchio concetto di `middleware.ts` (deprecato in questa versione di Next.js, rinominato `proxy.ts` — vedi `node_modules/next/dist/docs/.../proxy.md`); protegge `/app/:path*` delegando alla callback `authorized`.
- `src/modules/identity/identity-service.ts` (nuovo): `authIdentityService`, implementazione reale di `IdentityService` sopra Auth.js; esportato da `src/modules/identity/index.ts`.
- `src/app/(auth)/login/actions.ts`: `requestMagicLink` ora chiama `signIn("email", …)` invece di limitarsi a loggare l'email.
- `src/components/shared/user-menu-actions.ts` (nuovo) + `user-menu.tsx`: la voce "Esci" del menu utente ora invoca `authIdentityService.signOut()` invece di essere disabilitata.
- Documentazione aggiornata: `docs/architecture/authentication-boundary.md` (stato reale), `docs/audit/open-risks.md` (rischio chiuso, nuovi rischi residui annotati).

**File coinvolti**: `package.json`, `pnpm-lock.yaml`, `src/lib/auth.ts`, `src/db/schema/identity.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/proxy.ts`, `src/modules/identity/*`, `src/app/(auth)/login/actions.ts`, `src/components/shared/user-menu.tsx`, `src/components/shared/user-menu-actions.ts`, `docs/architecture/authentication-boundary.md`, `docs/audit/open-risks.md`.

**Decisioni**: vedi `docs/audit/decisions.md` (voce 2026-08-09).

**Rischi aperti**: autorizzazione a livello di tenant (le pagine `(app)` usano ancora `getDemoTenant()`), autorizzazione basata su ruolo, rate limiting sul flusso magic-link, invio email reale (Resend) non ancora collegato. Vedi `docs/audit/open-risks.md`.

**Verifica live**: `pnpm dev` + Playwright (`pnpm test:e2e`, 18/18 verdi) contro il database Docker locale. Percorsi verificati: `/app/*` non autenticato → redirect a `/login`; richiesta magic-link reale (email loggata da `ConsoleEmailProvider`); sessione iniettata direttamente in `sessions` per i test autenticati; sign out → redirect a `/login` e nuova richiesta a `/app` nuovamente reindirizzata. `pnpm typecheck`/`lint`/`format:check`/`test` (40/40 Vitest) tutti verdi.

**Bug pre-esistente trovato e corretto durante la verifica**: `UserMenu` (`src/components/shared/user-menu.tsx`) usava `DropdownMenuLabel` fuori da un `DropdownMenuGroup` — base-ui lancia `"MenuGroupContext is missing"` non appena il menu viene aperto, mai emerso prima perché nessun test/Playwright apriva effettivamente il menu utente (la voce "Esci" era `disabled`). Corretto avvolgendo label + separator + item in `DropdownMenuGroup`.

**Nota tecnica**: il `signOut` di Auth.js con `redirectTo` lancia internamente un redirect; invocato da un `onClick` su una voce di menu che si chiude (smonta) al click, il redirect rischia di degenerare in un errore non gestito invece che in una navigazione. `authIdentityService.signOut()` usa quindi `redirect: false` e lascia il redirect al chiamante lato client (`UserMenu`, via `useRouter().push("/login")` dopo che l'azione è risolta).

---

## 2026-08-09 — Milestone 1.1 — CRUD pazienti

**Obiettivo**: passare i pazienti da sola lettura a creazione/modifica/archiviazione, come indicato in `docs/product/milestone-01-scope.md` e `docs/audit/open-risks.md`.

**Modifiche**:

- `src/modules/patients/repository.ts`: aggiunte `createPatient`, `updatePatient`, `setPatientStatus`. Nessuna cancellazione fisica: i pazienti vengono archiviati (`status: "ARCHIVED"`, `archivedAt` valorizzato), coerentemente con lo schema già esistente (`patient_status` enum + colonna `archived_at`). `updatePatient`/`setPatientStatus` filtrano sempre per `(tenantId, patientId)`, quindi un tentativo cross-tenant restituisce `null` invece di modificare la riga.
- `src/modules/patients/validation.ts` (nuovo): schema Zod condiviso da creazione/modifica — normalizza email (`normalizeEmail`) e codice fiscale (`normalizeFiscalCode`, già esistenti in `src/lib/normalize.ts`), valida il formato data (`YYYY-MM-DD`), converte campi opzionali vuoti in `null`.
- `src/app/(app)/app/patients/actions.ts` (nuovo): `createPatientAction`/`updatePatientAction`/`setPatientStatusAction`. Ogni scrittura richiede una sessione reale (`authIdentityService.requireUser()`) e registra un `recordAuditEvent` (`patient.created`/`patient.updated`/`patient.archived`/`patient.reactivated`) — chiude il rischio "audit non invocato sistematicamente" per questo percorso. La creazione chiama `assertFeature("patients.management")` e `assertWithinLimit("activePatients", …)` prima di scrivere — chiude il rischio "nessun punto di enforcement automatico" per gli entitlement.
- UI: `patient-form-dialog.tsx` (dialog condiviso creazione/modifica), `patients-page-client.tsx` (wrapper client per lo stato del dialog di creazione), `patients-table.tsx` con menu azioni per riga (Modifica/Archivia/Riattiva) — questi tre file sono stati spostati/creati in `src/app/(app)/app/patients/` (non più in `src/modules/patients/`, per non far dipendere il modulo di dominio dalle server action della route). Aggiunto il componente UI `Textarea` (`src/components/ui/textarea.tsx`).
- Il tenant di scrittura resta `getDemoTenant()` (fuori scope: `TenantResolver` non implementato — vedi `docs/audit/open-risks.md`).

**File coinvolti**: `src/modules/patients/*`, `src/app/(app)/app/patients/*`, `src/components/ui/textarea.tsx`, `src/tests/db.integration.test.ts`, `tests-e2e/patients-crud.spec.ts`, `tests-e2e/smoke.spec.ts` (una query resa `exact: true` per non confondersi con il nuovo bottone azioni riga), `docs/audit/open-risks.md`.

**Bug scoperto e corretto durante la verifica live**: un file `"use server"` può esportare solo funzioni async — un `export { idleState as patientFormIdleState }` (un oggetto, non una funzione) faceva crashare l'intera pagina con `A "use server" file can only export async functions, found object.`. Lo stato iniziale di `useActionState` è stato spostato nel componente client. Corretto anche l'input email nel form: `type="email"` con validazione nativa del browser impediva l'invio verso il server action per testare la validazione Zod lato server; aggiunto `noValidate` al form per lasciare Zod come unica fonte di verità sulla validazione (con errori per campo già visualizzati inline).

**Verifica live**: `pnpm dev` + Playwright (`pnpm test:e2e`, 22/22 verdi, incluso il nuovo `patients-crud.spec.ts`: crea, modifica, archivia, riattiva un paziente; blocca un'email non valida mostrando l'errore di campo). `pnpm typecheck`/`lint`/`format:check`/`test` (50/50 Vitest, inclusi i nuovi test di validazione e di isolamento tenant sulle scritture) tutti verdi.

**Decisioni**: vedi `docs/audit/decisions.md` (voce 2026-08-09 — CRUD pazienti).

**Rischi aperti**: autorizzazione per ruolo sulle scritture pazienti (dipende da `TenantResolver`/`MembershipChecker`, non implementati), rate limiting, invio email reale. Vedi `docs/audit/open-risks.md`.

---

## 2026-08-09 — Milestone 1.1 — TenantResolver reale, rimozione di `demo-tenant.ts`

**Obiettivo**: chiudere il rischio "nessuna autorizzazione a livello di tenant" implementando `TenantResolver`/`MembershipChecker` e rimuovendo il bypass `src/lib/demo-tenant.ts`, come indicato in `docs/audit/open-risks.md` e `docs/architecture/multi-tenancy.md`.

**Modifiche**:

- `src/modules/tenancy/resolver.ts` (nuovo): `tenantResolver.resolveActiveTenant(user)` interroga `memberships` per `(userId, status = 'ACTIVE')`; un utente con più tenant ottiene deterministicamente la membership più vecchia (nessuna UI di switch tenant in questa milestone — vedi `docs/architecture/multi-tenancy.md`). `membershipChecker.verifyMembership({ userId, tenantId })` verifica una membership specifica, indipendente da quale sia "attiva"; non ha ancora un chiamante nell'app, solo test.
- `src/lib/active-tenant.ts` (nuovo): `getActiveTenant()`, la Data Access Layer che ogni pagina `(app)` e ogni server action ora chiamano al posto di `getDemoTenant()`. Combina `authIdentityService.requireUser()` + `tenantResolver.resolveActiveTenant()` + i dati del tenant per l'UI, avvolta in `React.cache()` (dedup per richiesta, mai tra richieste diverse — pattern raccomandato in `node_modules/next/dist/docs/01-app/02-guides/authentication.md`, sezione "Creating a Data Access Layer"). Ritorna `null` se l'utente autenticato non ha nessuna membership attiva (caso reale: invito non ancora accettato, non solo "seed mancante").
- `src/lib/demo-tenant.ts` **rimosso**. Aggiornati tutti gli 8 punti che lo chiamavano: `layout.tsx`, `page.tsx` (Oggi), `patients/page.tsx`, `patients/actions.ts`, `team/page.tsx`, `billing/page.tsx`, `settings/page.tsx`.
- Effetto collaterale positivo: `tenant.ownerName`/`ownerEmail` (sempre il titolare, indipendentemente da chi era loggato — non c'era altra scelta senza sessione reale) sono diventati `tenant.userName`/`userEmail` (l'utente effettivamente autenticato). La pagina Impostazioni ora mostra correttamente "i tuoi dati", non sempre quelli del titolare. `patients/actions.ts` usa `tenant.userId` come `actorUserId` per l'audit invece di una `requireUser()` separata e non verificata contro il tenant.
- `layout.tsx`: il messaggio per "nessun tenant" è passato da "Tenant demo non trovato" (invitava a rilanciare il seed) a "Nessuno studio associato" (riflette un caso reale: utente autenticato ma senza membership).

**File coinvolti**: `src/modules/tenancy/*`, `src/lib/active-tenant.ts`, `src/lib/demo-tenant.ts` (rimosso), le 7 pagine/azioni sopra elencate, `src/tests/db.integration.test.ts`, `tests-e2e/helpers/auth.ts` (nuovo `signInAsUserWithNoMembership`), `tests-e2e/smoke.spec.ts`, `docs/architecture/multi-tenancy.md`, `docs/architecture/project-structure.md`, `docs/audit/open-risks.md`.

**Verifica live**: `pnpm dev` + Playwright (`pnpm test:e2e`, 28/28 verdi — aggiunti test per billing/settings, mai coperti prima, e per lo stato "nessuno studio associato" con un utente senza membership). `pnpm typecheck`/`lint`/`format:check`/`test` (54/54 Vitest, inclusi i nuovi test di integrazione DB per `resolveActiveTenant`/`verifyMembership`) tutti verdi.

**Decisioni**: vedi `docs/audit/decisions.md` (voce 2026-08-09 — TenantResolver).

**Rischi aperti**: autorizzazione per ruolo sulle scritture (role è ora disponibile ma non ancora controllato in nessuna server action), switch tra tenant per utenti con più membership, rate limiting, billing Stripe, invio email reale. Vedi `docs/audit/open-risks.md`.
