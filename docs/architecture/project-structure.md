# Project Structure

```
src/
├── app/                        # Routing (App Router)
│   ├── (marketing)/            # Landing page pubblica
│   ├── (auth)/login/           # UI login passwordless (placeholder)
│   ├── (app)/app/              # Shell gestionale + pagine protette (non ancora autenticate)
│   ├── api/health/             # Health check
│   ├── error.tsx, global-error.tsx, not-found.tsx
│   └── layout.tsx              # Root layout
├── modules/                    # Domini di business
│   ├── identity/                 # Contratto IdentityService (Auth.js non ancora collegato)
│   ├── tenancy/                  # TenantContext, TenantResolver, MembershipChecker
│   ├── memberships/               # Repository + mapping ruoli (implementato)
│   ├── billing/                   # BillingProvider, money utils, repository subscription (implementato in lettura)
│   ├── entitlements/               # hasFeature/assertFeature/getResourceLimit/assertWithinLimit (implementato)
│   ├── patients/                   # Repository di sola lettura, firma { tenantId, patientId } (implementato)
│   ├── audit/                      # recordAuditEvent, append-only (implementato)
│   └── notifications/              # EmailProvider + ConsoleEmailProvider (dev-only)
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
│   ├── utils.ts (cn), normalize.ts, logger.ts, demo-tenant.ts (temporaneo, vedi sotto)
├── tests/                       # Setup Vitest + test di integrazione database
└── styles/ (globals.css è in src/app)

tests-e2e/                       # Smoke test Playwright
```

## Note

- `src/lib/demo-tenant.ts` è un **placeholder temporaneo**: risolve sempre il tenant demo seedato, bypassando sessione e membership. Va rimosso quando la Milestone 1.1 introduce la risoluzione tenant reale (`TenantResolver`).
- Un modulo in `src/modules/*` può evolvere verso `domain/ application/ infrastructure/ presentation/ index.ts` quando la complessità lo giustifica; in questa milestone la maggior parte resta piatta perché non ce n'è ancora bisogno.
- Non sono state create cartelle vuote: ogni cartella presente contiene codice, un'interfaccia o un barrel export.
