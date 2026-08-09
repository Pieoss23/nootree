# Open Risks — Milestone 1

Consolidato al termine della milestone (2026-07-31). Vedi `docs/product/milestone-01-scope.md` per l'elenco completo di ciò che è predisposto vs implementato.

## Rischi di sicurezza

- **Nessuna autenticazione reale**: tutte le rotte `/app/*` sono pubblicamente raggiungibili, nessuna sessione esiste. Accettabile solo perché non ci sono dati reali (solo seed di sviluppo). **Deve essere chiuso prima di qualsiasi deploy pubblico.**
- **Nessuna autorizzazione basata su ruolo** applicata a un'azione reale (i mapping esistono in `src/modules/memberships/roles.ts` ma non sono ancora collegati a un enforcement).
- **Nessun rate limiting** su alcun endpoint (rilevante soprattutto per il futuro flusso magic-link).

## Debito tecnico

- `src/lib/demo-tenant.ts` è un placeholder esplicito che bypassa la risoluzione tenant reale — va rimosso in Milestone 1.1, non deve convivere con `TenantResolver`.
- Il pulsante "Nuovo paziente" e "Apri Customer Portal" sono disabilitati con tooltip: nessuna azione reale dietro.
- `assertWithinLimit` (entitlements) richiede che il chiamante fornisca `currentUsage` — non esiste ancora un punto di enforcement automatico prima di una scrittura, perché non esistono ancora scritture su `patients` lato applicazione.

## Funzionalità solo predisposte (interfaccia definita, implementazione reale assente)

- `IdentityService` — nessuna implementazione (Auth.js non collegato).
- `TenantResolver` / `MembershipChecker` — nessuna implementazione.
- `BillingProvider` — nessuna implementazione (Stripe non collegato); nessun endpoint webhook.
- Invio email reale — solo `ConsoleEmailProvider` (logga, non invia).

## Verifiche ancora necessarie

- Test di carico/performance: non eseguiti, non richiesti in questa milestone.
- Revisione accessibilità approfondita (oltre a focus visibile, navigazione da tastiera e label esplicite già applicati nei componenti condivisi): non eseguita con strumenti automatici (es. axe) in questa milestone.
- Verifica del comportamento in produzione reale (`pnpm build && pnpm start` con un database gestito, non Docker locale): non eseguita, solo build locale verificata.
- `pnpm db:generate`/`db:migrate` sono stati eseguiti ed eseguono correttamente in locale; non sono stati verificati contro un servizio Postgres gestito (RDS, Neon, Supabase, ...).

## Rischi accettati per decisione architetturale (non bug)

- Isolamento multi-tenant a schema condiviso invece di database-per-tenant: rischio di un bug applicativo che rompe l'isolamento è più alto che con database separati, mitigato da test di integrazione dedicati (vedi ADR 002).
