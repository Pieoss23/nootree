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

---

## 2026-08-09 — Auth.js v5 (beta) con sessioni database-backed, solo provider email

**Decisione**: implementare `IdentityService` con `next-auth@5.0.0-beta.32` + `@auth/drizzle-adapter`, sessioni `strategy: "database"`, unico provider `Nodemailer` (id `"email"`) per il magic-link. Il file di configurazione vive in `src/lib/auth.ts` (infrastruttura, non modulo di dominio), seguendo lo stesso pattern di `src/db/client.ts`.

**Motivazione**: `next-auth@4` (dist-tag `latest`) non supporta bene l'App Router; la v5 beta dichiara esplicitamente supporto per `next ^16.0.0` ed è l'API pensata per Route Handler/Server Function/Proxy di questa versione di Next.js. Le tabelle `users`/`sessions`/`verification_tokens` erano già shape-compatibili (serviva solo rinominare alcune proprietà JS, non le colonne — vedi execution-log). La tabella `accounts` resta invariata perché il flusso solo-email di Auth.js non la usa mai (nessuna chiamata a `linkAccount`/`getUserByAccount` per `type: "email"`); verrà riallineata alla convenzione OAuth di Auth.js quando servirà un vero provider OAuth.

**Alternative scartate**:

- `next-auth@4` (stabile): API pre-App-Router, richiederebbe un `SessionProvider` client-side e non si integra con la nuova convenzione `proxy.ts`.
- Sessioni JWT: avrebbero permesso l'uso di Proxy in Edge runtime, ma questa versione di Next.js fa girare Proxy su Node.js runtime di default, quindi l'accesso al database in `proxy.ts` è già disponibile — le sessioni database-backed restano più semplici da revocare (sign-out reale, non solo scadenza del cookie).

---

## 2026-08-09 — Protezione delle rotte `/app/*` tramite `proxy.ts`, non `middleware.ts`

**Decisione**: usare la nuova convenzione `proxy.ts` (root di `src/`) con `export { auth as proxy }` e la callback `authorized` di Auth.js per proteggere `/app/*`.

**Motivazione**: `middleware.ts` è deprecato in questa versione di Next.js e rinominato `proxy.ts` (vedi `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`); usare il nome deprecato avrebbe significato codice morto (Next.js non lo eseguirebbe più).

---

## 2026-08-09 — CRUD pazienti: archiviazione invece di cancellazione fisica

**Decisione**: "cancellazione" paziente è implementata come cambio di stato (`ACTIVE` → `ARCHIVED`, con `archivedAt` valorizzato), reversibile, non come `DELETE` SQL.

**Motivazione**: lo schema (`src/db/schema/patients.ts`) prevedeva già `patient_status` enum e `archivedAt` proprio per questo; dati anagrafici/clinici non vanno mai persi per un click accidentale, e l'audit trail (`recordAuditEvent`) ha senso solo se la riga a cui si riferisce continua a esistere. Una vera cancellazione fisica non è mai stata nello scope discusso.

**Alternative scartate**: `DELETE` reale con soft-delete via colonna `deletedAt` separata — ridondante, lo schema aveva già uno stato pensato per questo (`ARCHIVED`).

---

## 2026-08-09 — UI dei pazienti spostata da `src/modules/patients/` a `src/app/(app)/app/patients/`

**Decisione**: `patients-table.tsx` (esistente, sola lettura) è stato spostato dal modulo alla route, insieme ai nuovi `patient-form-dialog.tsx` e `patients-page-client.tsx`.

**Motivazione**: la tabella ora richiama direttamente le server action della pagina (`./actions`) per aprire il dialog di modifica e per archiviare/riattivare; tenerla dentro `src/modules/patients/` avrebbe fatto dipendere il modulo di dominio da `src/app/*`, invertendo la separazione dichiarata in `docs/architecture/project-structure.md` (`src/modules/*` = dominio, `src/app` = routing). Il modulo resta con solo tipi, repository e validazione.

---

## 2026-08-09 — Validazione con `noValidate` sul form + Zod lato server come unica fonte di verità

**Decisione**: il form paziente ha l'attributo `noValidate`; tutta la validazione (incluso il formato email) passa da `patientFormSchema` (Zod) eseguito nella server action, con gli errori per campo rimandati al client e mostrati inline.

**Motivazione**: senza `noValidate`, la validazione nativa del browser su `<input type="email">` impediva l'invio del form per email non valide, quindi il percorso di errore lato server non era mai raggiungibile (scoperto scrivendo il test Playwright corrispondente — vedi `docs/audit/execution-log.md`). Con un'unica fonte di verità gli errori mostrati sono sempre coerenti con quanto verrà effettivamente salvato.
