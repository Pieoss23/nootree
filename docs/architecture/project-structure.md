# Project Structure

```
src/
├── app/                        # Routing (App Router)
│   ├── (marketing)/            # Landing page pubblica
│   ├── (auth)/login/           # Login passwordless (Auth.js reale)
│   ├── (app)/app/              # Shell gestionale, protetta da src/proxy.ts
│   │   └── patients/             # actions.ts, patient-form-dialog.tsx, patients-page-client.tsx,
│   │                              # patients-table.tsx — UI + server action del CRUD pazienti
│   ├── api/health/             # Health check
│   ├── api/auth/[...nextauth]/ # Handler Auth.js (GET/POST re-esportati da src/lib/auth.ts)
│   ├── error.tsx, global-error.tsx, not-found.tsx
│   └── layout.tsx              # Root layout
├── proxy.ts                    # Protegge /app/* (rotta "middleware", rinominata in questa versione di Next.js)
├── modules/                    # Domini di business
│   ├── identity/                 # IdentityService + authIdentityService (Auth.js, vedi src/lib/auth.ts)
│   ├── tenancy/                   # TenantContext, TenantResolver, MembershipChecker (non implementati)
│   ├── memberships/                # Repository + mapping ruoli (implementato)
│   ├── billing/                    # BillingProvider, money utils, repository subscription (implementato in lettura)
│   ├── entitlements/                # hasFeature/assertFeature/getResourceLimit/assertWithinLimit (implementato)
│   ├── patients/                     # Repository CRUD (tipi/scritture; l'UI vive in src/app/(app)/app/patients/)
│   ├── audit/                        # recordAuditEvent, append-only (implementato)
│   └── notifications/                # EmailProvider + ConsoleEmailProvider (dev-only)
├── components/
│   ├── ui/                     # shadcn/ui (generati, non modificare a mano se evitabile)
│   └── shared/                 # PageHeader, EmptyState, ErrorState, LoadingState, StatusBadge,
│                                # UsageMeter, FeatureLocked, AppSidebar, AppHeader, UserMenu, NavLinks
├── db/
│   ├── schema/                 # Tabelle Drizzle, una per area (identity, tenancy, memberships, billing, patients, audit)
│   ├── migrations/             # SQL generato da drizzle-kit — non modificare a mano
│   ├── client.ts                # Connessione pooled (DATABASE_URL, o TEST_DATABASE_URL sotto NODE_ENV=test)
│   ├── index.ts                 # Barrel: db + schema
│   ├── migrate.ts               # Script CLI: applica le migrazioni
│   ├── seed.ts                  # Script CLI: seed di sviluppo
│   └── seed-core.ts             # Logica di seed riusata da seed.ts e dai test di integrazione
├── config/
│   ├── env.ts                   # Validazione Zod delle variabili server
│   ├── env.client.ts            # Validazione Zod delle variabili NEXT_PUBLIC_*
│   └── plans.ts                 # Piani, feature, limiti — fonte unica di verità
├── lib/
│   ├── auth.ts                  # Configurazione Auth.js (adapter, provider email, callback authorized)
│   ├── auth-authorization.ts    # Guardia /app/* pura, senza import di next-auth (testabile in isolamento)
│   └── utils.ts (cn), normalize.ts, logger.ts, demo-tenant.ts (temporaneo, vedi sotto)
├── tests/                       # Setup Vitest + test di integrazione database
└── styles/ (globals.css è in src/app)

tests-e2e/                       # Playwright (smoke, auth, CRUD pazienti) + helpers/auth.ts (login via sessione iniettata)
```

## Note

- `src/lib/demo-tenant.ts` è un **placeholder temporaneo**: risolve sempre il tenant demo seedato, bypassando sessione e membership. Va rimosso quando la Milestone 1.1 introduce la risoluzione tenant reale (`TenantResolver`). Le server action di scrittura (es. `src/app/(app)/app/patients/actions.ts`) dipendono ancora da questo bypass per il `tenantId`.
- Un modulo in `src/modules/*` può evolvere verso `domain/ application/ infrastructure/ presentation/ index.ts` quando la complessità lo giustifica; in questa milestone la maggior parte resta piatta perché non ce n'è ancora bisogno.
- I componenti UI/server action specifici di una pagina (es. il dialog e la tabella pazienti) vivono nella cartella della route sotto `src/app/`, non nel modulo di dominio corrispondente, per non far dipendere `src/modules/*` da `src/app/*`. Il modulo espone solo tipi, repository e validazione.
- Non sono state create cartelle vuote: ogni cartella presente contiene codice, un'interfaccia o un barrel export.
