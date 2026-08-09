# Open Risks — Milestone 1

Consolidato al termine della milestone (2026-07-31). Vedi `docs/product/milestone-01-scope.md` per l'elenco completo di ciò che è predisposto vs implementato.

## Rischi di sicurezza

- ~~**Nessuna autenticazione reale**~~ — chiuso il 2026-08-09: Auth.js è collegato (sessioni database-backed, magic-link reale, `/app/*` protette da `src/proxy.ts`). Vedi `docs/architecture/authentication-boundary.md`.
- ~~**Nessuna autorizzazione a livello di tenant**~~ — chiuso il 2026-08-09: `tenantResolver.resolveActiveTenant()` (`src/modules/tenancy/resolver.ts`) verifica una vera membership `ACTIVE` prima di risolvere un `tenantId`, invocato da `getActiveTenant()` (`src/lib/active-tenant.ts`) su ogni pagina `(app)` e ogni server action di scrittura. `src/lib/demo-tenant.ts` è stato rimosso.
- ~~**Nessuna autorizzazione basata su ruolo** applicata a un'azione reale~~ — chiuso il 2026-08-09: `createPatientAction`/`updatePatientAction`/`setPatientStatusAction` chiamano `assertRole(tenant.role, "ASSISTANT")` (`src/modules/memberships/authorization.ts`) prima di ogni scrittura. Decisione di prodotto: tutti e tre i ruoli (`OWNER`/`NUTRITIONIST`/`ASSISTANT`) hanno lo stesso accesso in scrittura sui pazienti — l'enforcement è quindi oggi un no-op per chiunque abbia membership attiva, ma stabilisce il punto e il pattern (`assertRole`/`InsufficientRoleError`, stesso stile di `assertFeature`/`assertWithinLimit`) per azioni future che dovranno differenziare per ruolo (es. gestione team).
- **Superuser cross-tenant non progettato**: richiesta dall'utente il 2026-08-09 la possibilità di amministrare tutti i tenant da un unico account. Non è un ruolo di `memberships` (quelli sono per-tenant): andrebbe modellato come un flag/enum a livello piattaforma su `users` (es. `platformRole`), separato dai ruoli di membership, con audit trail rinforzato e UI dedicata, perché per costruzione deve bypassare l'isolamento multi-tenant che oggi è il confine di sicurezza principale (`docs/architecture/multi-tenancy.md`). Da progettare come step a sé (proprio ADR), non ancora nello scope implementato.
- **Nessun rate limiting** su alcun endpoint (rilevante soprattutto per il flusso magic-link, ora reale — e ora che può inviare email reali via Resend, anche un vettore di costo/abuso, non solo di sicurezza).
- ~~In sviluppo l'invio email del magic-link passa ancora da `ConsoleEmailProvider`... va sostituito con l'adapter Resend reale prima della produzione.~~ Chiuso il 2026-08-09: `ResendEmailProvider` esiste ed è selezionato automaticamente quando `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sono configurate; in produzione la loro assenza è un errore esplicito, non un fallback silenzioso a Console. **Resta**: nessuna verifica di dominio Resend/deliverability è stata fatta in questa milestone (nessuna chiave reale disponibile per testarlo dal vivo) — da verificare con una chiave reale prima del deploy.

## Debito tecnico

- ~~`src/lib/demo-tenant.ts` è un placeholder esplicito...~~ Rimosso il 2026-08-09.
- Il pulsante "Apri Customer Portal" è disabilitato con tooltip: nessuna azione reale dietro (Stripe non collegato).
- ~~`assertWithinLimit` (entitlements) richiede che il chiamante fornisca `currentUsage`... nessun punto di enforcement automatico.~~ Chiuso il 2026-08-09: `createPatientAction` chiama `assertFeature`/`assertWithinLimit` prima di ogni creazione paziente.
- ~~Nessuna autorizzazione per ruolo sulle scritture pazienti~~ — chiuso il 2026-08-09 (vedi sopra, sezione sicurezza).
- `resolveActiveTenant` sceglie la membership più vecchia come "tenant attivo" quando un utente ne ha più di una — non c'è ancora un'interfaccia per cambiare tenant attivo. Vedi `docs/architecture/multi-tenancy.md`.

## Funzionalità solo predisposte (interfaccia definita, implementazione reale assente)

- ~~`IdentityService` — nessuna implementazione (Auth.js non collegato).~~ Implementato il 2026-08-09 (`authIdentityService`, backed by Auth.js).
- ~~`TenantResolver` / `MembershipChecker` — nessuna implementazione.~~ Implementati il 2026-08-09 (`src/modules/tenancy/resolver.ts`). `membershipChecker.verifyMembership` non ha ancora un chiamante reale (nessuna UI di switch tenant in questa milestone), ma è testato.
- `BillingProvider` — nessuna implementazione (Stripe non collegato); nessun endpoint webhook.
- ~~Invio email reale — solo `ConsoleEmailProvider` (logga, non invia).~~ Implementato il 2026-08-09 (`ResendEmailProvider`), ma non testato con una chiave Resend reale — vedi sezione "Rischi di sicurezza".

## Verifiche ancora necessarie

- Test di carico/performance: non eseguiti, non richiesti in questa milestone.
- Revisione accessibilità approfondita (oltre a focus visibile, navigazione da tastiera e label esplicite già applicati nei componenti condivisi): non eseguita con strumenti automatici (es. axe) in questa milestone.
- Verifica del comportamento in produzione reale (`pnpm build && pnpm start` con un database gestito, non Docker locale): non eseguita, solo build locale verificata.
- `pnpm db:generate`/`db:migrate` sono stati eseguiti ed eseguono correttamente in locale; non sono stati verificati contro un servizio Postgres gestito (RDS, Neon, Supabase, ...).

## Rischi accettati per decisione architetturale (non bug)

- Isolamento multi-tenant a schema condiviso invece di database-per-tenant: rischio di un bug applicativo che rompe l'isolamento è più alto che con database separati, mitigato da test di integrazione dedicati (vedi ADR 002).
