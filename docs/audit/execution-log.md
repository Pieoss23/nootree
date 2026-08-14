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

---

## 2026-08-09 — Milestone 1.1 — Invio email reale (Resend)

**Obiettivo**: sostituire `ConsoleEmailProvider` con un adapter Resend reale per il flusso magic-link, come indicato in `docs/audit/open-risks.md`.

**Modifiche**:

- Aggiunta la dipendenza `resend@6.18.1`.
- `src/modules/notifications/resend-email-provider.ts` (nuovo): `ResendEmailProvider`, implementa `EmailProvider` sopra l'SDK ufficiale Resend (`client.emails.send`).
- `src/modules/notifications/email-provider-factory.ts` (nuovo): `getEmailProvider(env)` sceglie `ResendEmailProvider` quando `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sono configurate, altrimenti `ConsoleEmailProvider` — tranne in produzione, dove l'assenza di configurazione Resend lancia un errore invece di ripiegare silenziosamente su Console (vedi `docs/audit/decisions.md`).
- `src/lib/auth.ts`: `sendVerificationRequest` ora chiama `getEmailProvider(env)` invece di istanziare `ConsoleEmailProvider` direttamente.
- `.env.example`: commento aggiornato per riflettere che Resend è ora davvero collegato (opzionale in sviluppo, obbligatorio in produzione).

**File coinvolti**: `package.json`, `pnpm-lock.yaml`, `src/modules/notifications/*`, `src/lib/auth.ts`, `.env.example`.

**Verifica**: `pnpm typecheck`/`lint`/`format:check` puliti. 59/59 Vitest (aggiunto `email-provider-factory.test.ts`: seleziona Resend/Console in base a env e `NODE_ENV`, lancia in produzione senza configurazione). `pnpm test:e2e` 28/28 verdi — confermato che il flusso magic-link continua a funzionare in sviluppo (nessuna chiave Resend impostata → fallback a Console, come prima).

**Non verificato**: invio reale tramite Resend con una chiave API vera — non disponibile in questo ambiente. Prima del primo deploy in produzione, verificare manualmente che un'email arrivi davvero. Vedi `docs/audit/open-risks.md`.

**Decisioni**: vedi `docs/audit/decisions.md` (voce 2026-08-09 — Selezione del provider email).

**Rischi aperti**: autorizzazione per ruolo, rate limiting (ora rilevante anche per costi Resend, non solo sicurezza), invio Resend non testato con chiave reale, billing Stripe, switch tra tenant. Vedi `docs/audit/open-risks.md`.

---

## 2026-08-09 — Milestone 1.1 — Autorizzazione basata su ruolo (scritture pazienti)

**Obiettivo**: chiudere il rischio "nessuna autorizzazione basata su ruolo applicata a un'azione reale", collegando `TenantContext.role` a un enforcement esplicito nelle server action pazienti, come indicato in `docs/audit/open-risks.md` e `docs/security/initial-threat-model.md`.

**Decisione di prodotto** (chiesta esplicitamente all'utente prima di implementare, non derivabile dal codice): tutti e tre i ruoli (`OWNER`/`NUTRITIONIST`/`ASSISTANT`) hanno lo stesso accesso in scrittura sui pazienti — nessuna differenziazione per questo tipo di azione in questa milestone.

**Modifiche**:

- `src/modules/memberships/authorization.ts` (nuovo): `assertRole(role, minimum)` lancia `InsufficientRoleError` se `roleAtLeast(role, minimum)` è falso — stesso pattern di `assertFeature`/`assertWithinLimit` in `src/modules/entitlements`. Esportato da `src/modules/memberships/index.ts`.
- `src/app/(app)/app/patients/actions.ts`: `createPatientAction`/`updatePatientAction`/`setPatientStatusAction` chiamano `assertRole(tenant.role, "ASSISTANT")` prima di ogni scrittura (`ASSISTANT` è il rank più basso, quindi oggi il controllo non blocca nessun membro con membership attiva — ma stabilisce il punto di enforcement esplicito e testato, pronto per azioni future con soglie più alte). I due action con stato di form (`create`/`update`) intercettano `InsufficientRoleError` e restituiscono un messaggio utente; `setPatientStatusAction` (void, nessun canale di messaggio) lascia propagare l'errore, coerente con il controllo di input già esistente in quella funzione.

**File coinvolti**: `src/modules/memberships/authorization.ts`, `src/modules/memberships/authorization.test.ts`, `src/modules/memberships/index.ts`, `src/app/(app)/app/patients/actions.ts`, `docs/audit/open-risks.md`, `docs/testing/milestone-01-test-strategy.md`.

**Verifica live**: `pnpm dev` + Playwright (`pnpm test:e2e`, 28/28 verdi — CRUD pazienti confermato invariato con l'enforcement attivo). `pnpm typecheck`/`lint`/`format:check`/`test` (61/61 Vitest, inclusi i 2 nuovi test di `authorization.test.ts`) tutti verdi.

**Nota**: durante la richiesta dei permessi, l'utente ha anche chiesto un ruolo "superuser" cross-tenant per amministrare tutti gli studi da un unico punto. Concettualmente distinto dai ruoli di `memberships` (che sono per-tenant) — registrato come voce a sé in `docs/audit/open-risks.md`, da progettare in uno step dedicato, non implementato in questo step.

**Decisioni**: vedi `docs/audit/decisions.md` (voce 2026-08-09 — Autorizzazione per ruolo).

**Rischi aperti**: rate limiting, invio Resend non testato con chiave reale, billing Stripe, switch tra tenant, superuser cross-tenant (nuovo, non progettato). Vedi `docs/audit/open-risks.md`.

---

## 2026-08-09 — Milestone 1.2 — Anagrafica clinica pazienti + misurazioni (peso/altezza/BIA)

**Obiettivo**: arricchire l'anagrafica paziente con dati di anamnesi (allergie/intolleranze, patologie, farmaci, obiettivo, attività fisica, consenso dati sanitari) e con uno storico misurazioni (peso, altezza, circonferenze, dati BIA da bioimpedenziometro), evidenziando prima e ultima pesata — richiesto esplicitamente dall'utente. Esplicitamente fuori scope in `docs/product/milestone-01-scope.md` fino a questo step.

**Schema** (`src/db/schema/patients.ts`): nuovi enum `patient_nutrition_goal` (`WEIGHT_LOSS|WEIGHT_GAIN|MAINTENANCE|CLINICAL|OTHER`) e `patient_activity_level` (`SEDENTARY|LIGHT|MODERATE|INTENSE`); nuove colonne nullable su `patients` (`allergiesIntolerances`, `pathologies`, `medications`, `nutritionGoal`, `activityLevel`, `healthDataConsentAt`); nuova tabella `patientMeasurements` (`tenantId`+`patientId` denormalizzati come FK dirette, stesso pattern di `audit_events` — richiesto da Regola 2 di `docs/security/tenant-isolation-rules.md`; `measuredAt: date` distinto da `createdAt`; colonne `numeric(precisione, scala, { mode: "number" })` per i valori antropometrici/BIA — nuovo pattern nel repo, diverso dal "centesimi interi" usato per i soldi in `billing.ts`, perché questi valori sono mostrati/graficati, mai sommati). `src/db/schema/relations.ts` aggiornato. Migrazione generata (`0001_powerful_surge.sql`) e applicata al DB Docker locale.

**Modulo dominio** (`src/modules/patients/`): `repository.ts` — nuova `updatePatientClinicalInfo` (separata da `createPatient`/`updatePatient`, che restano invariate — zero rischio sul flusso CRUD già testato); `measurements-repository.ts` (nuovo) — `listMeasurementsByPatient`/`createMeasurement`/`deleteMeasurement`; `clinical-info-validation.ts` e `measurements-validation.ts` (nuovi, schema Zod); `bmi.ts` (nuovo) — `calculateBmi`, mai persistito, sempre calcolato a runtime; `labels.ts` (nuovo) — etichette italiane ed elenco opzioni per i due enum.

**UI** (`src/app/(app)/app/patients/[id]/`): prima dynamic route dell'app (`params: Promise<{ id: string }>`, confermato in `node_modules/next/dist/docs/.../dynamic-routes.md`). `page.tsx` (server) → `edit-patient-button.tsx` (riusa `PatientFormDialog` esistente per l'anagrafica core), `clinical-info-section.tsx` + `clinical-info-form-dialog.tsx` (anamnesi), `measurements-section.tsx` + `measurement-form-dialog.tsx` + `measurements-table.tsx` (misurazioni, evidenzia prima/ultima pesata per `measuredAt`), `actions.ts` a parte (route-scoped, non nel file esistente `patients/actions.ts`). `patients-table.tsx`: il nome paziente è ora un link verso `/app/patients/[id]` (unica modifica a un file esistente). Aggiunte le primitive shadcn `select`/`checkbox` (`pnpm dlx shadcn@latest add select checkbox`), stesso meccanismo già usato per `textarea.tsx`.

**Ruolo minimo e audit**: stesso `assertRole(tenant.role, "ASSISTANT")` già stabilito per i pazienti; nuove action string `patient.clinical_info_updated`, `patient.measurement_added`, `patient.measurement_deleted` via `recordAuditEvent`.

**Decisioni**: vedi `docs/audit/decisions.md` (voce 2026-08-09 — Anagrafica clinica pazienti + misurazioni) per: tipo `numeric` per le misurazioni, gestione del timestamp di consenso GDPR (preservato su hidden field, non ricalcolato ad ogni save), misurazioni con aggiunta/eliminazione ma non modifica.

**Bug scoperto e corretto durante la verifica live**: due componenti client (`clinical-info-section.tsx`, `clinical-info-form-dialog.tsx`) importavano valori (non solo tipi) dal barrel `@/modules/patients`, che re-esporta anche `repository.ts`/`measurements-repository.ts` (marcati `"server-only"`) — il bundle client falliva con un 500 su **tutte** le pagine `(app)`, non solo su quella nuova (l'import del barrel trascina l'intero grafo, incluso il modulo che lancia l'errore `server-only` a runtime browser). Corretto importando gli helper universali (`calculateBmi`, `getNutritionGoalLabel`/`getActivityLevelLabel`, `NUTRITION_GOAL_OPTIONS`/`ACTIVITY_LEVEL_OPTIONS`) dai file concreti (`@/modules/patients/bmi`, `@/modules/patients/labels`) invece che dal barrel, nei soli componenti client. Registrato come debito tecnico strutturale in `docs/audit/open-risks.md` (il barrel resta misto, il rischio si può ripresentare con componenti client futuri).

**Verifica live**: `pnpm dev` + Playwright (`pnpm test:e2e`, 30/30 verdi — aggiunto `tests-e2e/patient-detail.spec.ts`: apre il dettaglio dalla lista, modifica anamnesi con consenso, aggiunge due misurazioni, verifica l'evidenziazione prima/ultima pesata). `pnpm check` (`format:check`/`lint`/`typecheck`/`test`, 77/77 Vitest inclusi i nuovi test di `bmi`/`clinical-info-validation`/`measurements-validation` e i nuovi casi di isolamento tenant in `db.integration.test.ts` per `updatePatientClinicalInfo` e le misurazioni) tutti verdi.

**Rischi aperti**: nessuna verifica di modifica misurazioni (solo aggiunta/eliminazione, scelta esplicita), barrel `@/modules/patients` misto server/universale (debito tecnico), allegati/file non implementati (nessun provider di storage scelto), catalogo prodotti/ingredienti non implementato (ricerca fatta su CREA/Open Food Facts/USDA/Edamam/FatSecret, nessuna decisione presa). Vedi `docs/audit/open-risks.md`.

---

## 2026-08-10 — Milestone 1.2 — Catalogo prodotti/ingredienti (catalogo condiviso + prodotti custom per tenant)

**Obiettivo**: implementare il catalogo prodotti/ingredienti lasciato in sospeso a fine step precedente. Scope scelto esplicitamente dall'utente tra 4 alternative proposte: catalogo minimo di sola consultazione + possibilità per ogni studio di aggiungere propri prodotti/ricette personalizzati, **senza** integrazione a pagamento né lookup live su Open Food Facts in questa milestone (vedi `docs/audit/decisions.md`, voce "Catalogo prodotti: nessuna API di terze parti a pagamento").

**Schema** (`src/db/schema/products.ts`, nuovo file): `foodItems` — catalogo condiviso, **unica tabella "business" senza `tenantId`** (dato di riferimento, non di un singolo tenant), `name` univoco, enum `food_category` (11 valori), valori nutrizionali per 100g (`kcalPer100g`, `proteinGPer100g`, `carbsGPer100g`, `fatGPer100g`, `fiberGPer100g?`), `source` (oggi solo `CURATED_SEED`). `tenantProducts` — stessa forma nutrizionale ma scoped a `tenantId`, enum `tenant_product_status` (`ACTIVE|ARCHIVED`, stesso pattern di `patients`). `src/db/schema/relations.ts` e `index.ts` aggiornati. Migrazione generata (`0002_dark_microbe.sql`) e applicata al DB Docker locale.

**Config** (`src/config/plans.ts`): nuova feature `products.catalog` (inclusa in tutti e tre i piani) e nuovo limite `customProducts` (50/300/illimitato per STARTER/PROFESSIONAL/STUDIO) — vedi `docs/audit/decisions.md` per la motivazione.

**Modulo dominio** (`src/modules/products/`, nuovo): `types.ts`, `labels.ts` (etichette italiane categoria alimenti), `validation.ts` (Zod, stesso pattern virgola-decimale di `measurements-validation.ts`), `repository.ts` (`listFoodItems` senza filtro tenant — unica query del repo senza `tenantId`; CRUD `tenantProducts` sempre scoped), `index.ts` (barrel, stesso mix server/universale già noto per `@/modules/patients` — vedi `docs/audit/open-risks.md`).

**Seed** (`src/db/seed-core.ts`): `FOOD_ITEMS_SEED`, ~60 alimenti comuni con valori nutrizionali rappresentativi (non la tabella CREA/BDA verbatim — nessun import bulk disponibile), inseriti con `onConflictDoUpdate` su `name` (univoco), indipendente dal tenant demo. Verificato idempotente (già coperto dal test esistente "seeds development data idempotently" più un nuovo test dedicato).

**UI** (`src/app/(app)/app/products/`, nuova route, aggiunta a `NAV_ITEMS`): `page.tsx` (server) → `products-page-client.tsx` con due sezioni — "Prodotti dello studio" (`ProductsTable` + `ProductFormDialog`, stesso pattern create/edit/archivia di `PatientsTable`, con `UsageMeter` sul limite `customProducts`) e "Catalogo alimenti" (`FoodCatalogTable`, sola consultazione, filtro client-side sull'elenco completo — il catalogo è piccolo, nessuna query di ricerca server-side necessaria). `actions.ts` a parte (route-scoped): `createTenantProductAction`/`updateTenantProductAction`/`setTenantProductStatusAction`, stessa soglia `assertRole(tenant.role, "ASSISTANT")` dei pazienti, `assertFeature`/`assertWithinLimit` su `products.catalog`/`customProducts`, `recordAuditEvent` (`product.created`/`product.updated`/`product.archived`/`product.reactivated`).

**Prevenzione del bug barrel/server-only già noto**: i Client Component (`product-form-dialog.tsx`, `products-table.tsx`, `food-catalog-table.tsx`) importano fin da subito dai file concreti (`@/modules/products/types`, `@/modules/products/labels`), non dal barrel — applicato preventivamente il fix già trovato per `@/modules/patients` (vedi entry precedente), non un nuovo bug scoperto questa volta.

**Test**: nuovo `src/modules/products/validation.test.ts` (6 casi); `src/tests/db.integration.test.ts` aggiornato — l'assert esistente sulle feature del piano PROFESSIONAL ora include `products.catalog`, più due nuovi test (seed catalogo condiviso non scoped a tenant; isolamento cross-tenant su `tenantProducts`, sia in lettura che in scrittura). `pnpm test`: 85/85 verdi. Nuovo `tests-e2e/products-crud.spec.ts` (mostra il catalogo condiviso seedato, crea/archivia un prodotto personalizzato, blocca la creazione senza kcal).

**Verifica live**: `pnpm dev` + `pnpm db:migrate` + `pnpm db:seed` (idempotente, verificato senza duplicati) sul DB Docker locale. `pnpm check` (`format:check`/`lint`/`typecheck`/`test`) verde. Il nuovo file Playwright, eseguito in isolamento (`--workers=1`, nessun altro file in esecuzione), passa in modo affidabile (9.5s + 3.4s) — confermando che la feature funziona correttamente end-to-end.

**Flakiness osservata (non un difetto introdotto qui)**: eseguendo l'intera suite Playwright con più worker/progetti in parallelo (comportamento di default di `pnpm test:e2e`), sia il nuovo test sia il preesistente `patients-crud.spec.ts` (invariato in questo step) falliscono in modo intermittente per timeout di 5s in attesa della riga creata — il dialog resta in "Salvataggio…" oltre il timeout, sintomo di latenza del dev server/Postgres Docker sotto carico concorrente su questa macchina, non di un bug applicativo. Registrato in `docs/audit/open-risks.md`.

**Rischi aperti**: import bulk CREA/BDA reale non disponibile (seed rappresentativo, non ufficiale); lookup live Open Food Facts deliberatamente fuori scope; barrel `@/modules/products` misto server/universale (stesso debito tecnico di `@/modules/patients`); flakiness Playwright sotto carico concorrente. Vedi `docs/audit/open-risks.md`.

---

## 2026-08-10 — Milestone 1.2 — Ricette + dosaggio consigliato per paziente

**Obiettivo**: sezione ricette composte da ingredienti (catalogo alimenti + prodotti tenant), con dosaggio consigliato per paziente in base a dieta e caratteristiche fisiche — richiesto esplicitamente dall'utente, con un pannello ricette generale e una tab dedicata nella pagina paziente. Formula di dosaggio chiarita con l'utente prima di implementare (vedi `docs/audit/decisions.md`): priorità al BMR misurato, stima Mifflin-St Jeor come fallback, tre livelli di intensità dieta.

**Schema**: `src/db/schema/patients.ts` — nuove colonne nullable `sex` (enum `patient_sex`) e `dietIntensity` (enum `diet_intensity`), usate solo dal calcolo del dosaggio. Nuovo file `src/db/schema/recipes.ts` — `recipes` (tenant-scoped), `recipeIngredients` (FK duale `foodItemId`/`tenantProductId` con vincolo `CHECK` a livello DB per "esattamente una fonte" — vedi decisions.md), `patientRecipes` (`portionGrams` + `suggestedPortionGrams?` snapshot, aggiunta/eliminazione non modifica). Migrazione generata (`0003_tiny_squadron_sinister.sql`) e applicata al DB Docker locale.

**Config** (`src/config/plans.ts`): nuova feature `recipes.management`; attivato il placeholder preesistente `future.nutritionPlans` → `nutrition.plans` (era già descritto come "Creazione piani alimentari (in arrivo)" — riutilizzato invece di duplicare, vedi decisions.md), entrambe incluse in tutti i piani.

**Modulo dominio** (`src/modules/recipes/`, nuovo): `types.ts`; `nutrition.ts` (puro, `computeRecipeNutrition` — somma pesata per quantità dei valori "per 100g", macro nulli trattati come zero); `dosage.ts` (puro, nessun accesso a DB, importa i tipi paziente dal file concreto `@/modules/patients/types` non dal barrel — pensato per essere usato anche da un Client Component); `validation.ts` (`recipeFormSchema`, `recipeIngredientFormSchema` — codifica `"food:<id>"`/`"product:<id>"` in un solo campo per un singolo `<select>`, `patientRecipeFormSchema`); `repository.ts` (server-only — CRUD ricette/ingredienti con join verso `foodItems`/`tenantProducts` per unificare la vista, `listActiveRecipeSummariesByTenant` con densità calorica calcolata via N+1 query, accettabile alla scala attesa).

**Modulo patients esteso**: `types.ts`/`labels.ts` (label italiane sesso/intensità dieta) aggiornati; `validation.ts` (form core) e `clinical-info-validation.ts` (anamnesi) estesi con i due nuovi campi; `repository.ts` — `PatientWriteFields`/`ClinicalWriteFields` aggiornati, tutte le query esistenti già passavano per questi tipi quindi nessuna nuova query.

**UI**: `Tabs` aggiunto come primitiva shadcn (`pnpm dlx shadcn@latest add tabs`, stesso meccanismo di `select`/`checkbox` in Milestone 1.2 precedente). Pagina paziente (`src/app/(app)/app/patients/[id]/page.tsx`) ristrutturata in due tab — "Anamnesi e misurazioni" (contenuto esistente, invariato) e "Ricette" (nuovo: `patient-recipes-section.tsx` + `patient-recipes-table.tsx` + `assign-recipe-dialog.tsx`, mostra il fabbisogno stimato e precompila la porzione suggerita al cambio ricetta selezionata). Nuovo pannello generale `src/app/(app)/app/recipes/` (lista + creazione) e `[id]/` (dettaglio: aggiunta/rimozione ingredienti da un `<select>` raggruppato catalogo/prodotti, riepilogo nutrizionale calcolato al volo, mai salvato). Voce "Ricette" aggiunta a `NAV_ITEMS`. Campo "Sesso" aggiunto al form paziente core, "Intensità dieta" all'anamnesi.

**Bug lint scoperto e corretto durante la verifica**: `react-hooks/set-state-in-effect` (regola ESLint recente) blocca la chiamata diretta a un setter `useState` dentro un `useEffect` bare, anche se innescata da un cambio di stato di `useActionState` — rilevato in `assign-recipe-dialog.tsx` dove il reset della selezione locale dopo un'assegnazione riuscita chiamava `setSelectedRecipeId`/`setPortionGrams` nello stesso effect che chiude il dialog. Risolto spostando il reset nella funzione `handleOpenChange` (invocata dagli eventi reali di chiusura del Dialog — annulla/escape/overlay), lasciando l'effect di successo chiamare solo la prop `onOpenChange`. Compromesso accettato: il reset non scatta più dopo un'assegnazione riuscita (solo alla chiusura manuale) — cosmetico, registrato in `docs/audit/open-risks.md`.

**Test**: nuovi `src/modules/recipes/{nutrition,dosage,validation}.test.ts` (23 casi — inclusi i casi limite del calcolo fabbisogno: dati insufficienti, priorità BMR misurato, differenza per sesso, deficit/surplus per intensità dieta). `src/tests/db.integration.test.ts` aggiornato: assert piano PROFESSIONAL ora include `recipes.management`/`nutrition.plans`; nuovi test per isolamento tenant su `recipes`/`patientRecipes`, join ingredienti con nutrizione calcolata, vincolo `CHECK` "esattamente una fonte" (inserimento con entrambe le colonne o nessuna delle due, in entrambi i casi la query fallisce). `pnpm test`: 115/115 verdi.

**Verifica live**: `pnpm db:migrate`/`pnpm db:seed` (nuovo: due ricette demo seedate dal catalogo alimenti, es. "Pollo con riso e zucchine", stesso pattern guard-idempotente di `demoPatients`). `pnpm check` (`format:check`/`lint`/`typecheck`/`test`) verde. Nuovi `tests-e2e/recipes-crud.spec.ts` e un nuovo caso in `tests-e2e/patient-detail.spec.ts` ("assegna una ricetta con dosaggio suggerito dalla tab Ricette", esercita l'intero flusso: crea paziente con sesso, imposta attività fisica, aggiunge una misurazione peso/altezza, verifica il fabbisogno stimato mostrato, seleziona una ricetta e verifica il testo "Porzione suggerita", assegna e verifica la riga in tabella) — passano entrambi in isolamento. `pnpm build` (produzione) verificato: tutte le nuove rotte (`/app/recipes`, `/app/recipes/[id]`) registrate correttamente. Suite Playwright completa (`pnpm test:e2e`, 38 test, 2 progetti) verde in un run; osservata di nuovo la flakiness intermittente sotto carico concorrente già nota (vedi open-risks.md), non riprodotta in modo deterministico questa volta.

**Rischi aperti**: nessun concetto di "slot pasto" (il dosaggio assume una quota fissa del 30% del fabbisogno giornaliero per ricetta assegnata); formula di dosaggio con costanti indicative non cliniche (deficit/surplus per intensità, fattori di attività standard) — vedi decisions.md; reset cosmetico incompleto in `assign-recipe-dialog.tsx`; nessuna modifica in-place per un'assegnazione ricetta-paziente (solo aggiunta/eliminazione). Vedi `docs/audit/open-risks.md`.

---

## 2026-08-10 — Fix: warning "uncontrolled Select/Checkbox" di Base UI

**Obiettivo**: eliminare due warning in console del browser segnalati dall'utente, su `patient-form-dialog.tsx` (Select sesso) e `clinical-info-form-dialog.tsx` (Select obiettivo/attività/intensità dieta, Checkbox consenso GDPR) — entrambi i dialog restano montati in permanenza e ricevono un `patient` aggiornato dopo ogni salvataggio, cambiando `defaultValue`/`defaultChecked` su un'istanza già inizializzata.

**Modifiche**: aggiunto `key={patient.updatedAt.toISOString()}` (`?? "create"`/`"new"` quando `patient` è assente) al `<form>` di entrambi i dialog, forzando un remount con valori di default corretti ad ogni reale aggiornamento della riga paziente, invece di convertire i campi in componenti controllati. Vedi `docs/audit/decisions.md` per il ragionamento completo (coerenza con la scelta esistente di form non controllati).

**Verifica**: `tests-e2e/patient-detail.spec.ts` (modifica sia il checkbox di consenso sia il campo attività fisica) rieseguito in isolamento — nessun warning "Base UI" nel log del browser, prima presente. `pnpm check`: 115/115 test verdi.
