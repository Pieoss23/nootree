# Milestone 1 — Scope

## Obiettivo

Costruire le fondamenta tecniche e architetturali del SaaS per nutrizionisti: repository avviabile, database con migrazioni, moduli di dominio con i confini predisposti, shell UI iniziale, quality gate automatici. Non un gestionale completo.

## Cosa è stato implementato

- Bootstrap Next.js (App Router, `src/`, alias `@/*`, TypeScript strict, pnpm, ESLint, Prettier, Tailwind, shadcn/ui).
- Struttura a domini (`src/modules/*`) con contratti/interfacce per identity, tenancy, billing, entitlements, notifications.
- PostgreSQL + Drizzle ORM, 18 tabelle, migrazioni versionate, applicate a database di sviluppo e di test.
- Configurazione centralizzata di piani/feature/limiti (`src/config/plans.ts`).
- Seed di sviluppo idempotente (piani, feature, tenant demo, owner demo, pazienti demo, subscription demo).
- Shell applicativa responsive (sidebar desktop, menu mobile a sheet, header, breadcrumb, menu utente).
- Pagine iniziali: landing, login (UI passwordless con adapter email fittizio), Oggi, Pazienti, Team, Abbonamento, Impostazioni.
- Health check (`/api/health`) con verifica di connettività al database.
- Gestione errori (`error.tsx`, `global-error.tsx`, `not-found.tsx`) e logging strutturato minimo.
- Test automatici: 37 test Vitest (unit + integrazione database) e 14 test Playwright (smoke + navigazione desktop/mobile).

## Cosa è stato predisposto ma non implementato

Le seguenti aree hanno solo l'interfaccia/contratto e, dove utile, dati o letture reali basate su seed — non i flussi applicativi completi:

- **Autenticazione**: `IdentityService` predisposto; login mostra solo l'UI, nessuna sessione reale viene creata.
- **Tenant resolution**: `TenantContext`/`TenantResolver` predisposti; le pagine usano temporaneamente `getDemoTenant()` (vedi `src/lib/demo-tenant.ts`), da rimuovere in Milestone 1.1.
- **Billing/Stripe**: `BillingProvider` predisposto; le pagine leggono dati di subscription reali dal seed, ma checkout e Customer Portal sono placeholder disabilitati.
- **Entitlements**: `hasFeature`/`assertFeature`/`getResourceLimit`/`assertWithinLimit` sono implementati e leggono da `tenant_entitlements` popolata dal seed, ma non sono ancora collegati a un enforcement applicativo diffuso (solo alla UI del piano attivo).
- **Pazienti**: solo lettura (`getPatientById`, `listPatientsByTenant`, `countActivePatients`); nessuna creazione/modifica/cancellazione.
- **Notifications**: `EmailProvider` predisposto con un solo adapter di sviluppo (`ConsoleEmailProvider`) che logga invece di inviare.
- **Audit**: `recordAuditEvent` implementato (insert append-only) ma non ancora invocato sistematicamente da altri moduli.

## Esplicitamente fuori scope

Invio reale di magic link, autenticazione completa, checkout Stripe reale, Customer Portal, webhook Stripe completi, CRUD pazienti completo, inviti del team, agenda, appuntamenti, visite, misurazioni, anamnesi, patologie, piani alimentari, alimenti, ricette, documenti clinici, portale paziente, contabilità, fatturazione elettronica, Sistema Tessera Sanitaria, intelligenza artificiale.
