# Multi-tenancy

## Modello: schema condiviso

Un solo database PostgreSQL, condiviso da tutti i tenant. Ogni tabella "tenant-owned" (patients, memberships, billingCustomers, subscriptions, tenantEntitlements, tenantProfiles, ...) contiene una colonna `tenantId` con foreign key verso `tenants.id`. Vedi [ADR 002](./decisions/002-shared-schema-multitenancy.md) per il perché rispetto a schema-per-tenant o database-per-tenant.

## Regola non negoziabile

**Un `tenantId` che arriva dal client (query param, stato del browser, cookie non verificato) non è mai un'autorizzazione.** Il flusso reale, implementato dal 2026-08-09:

```ts
const user = await authIdentityService.requireUser();
const tenantContext = await tenantResolver.resolveActiveTenant(user); // server-verified
// solo ora tenantContext.tenantId è affidabile
```

`TenantContext` (`src/modules/tenancy/types.ts`) rappresenta esattamente questo: un tenant risolto e verificato lato server per l'utente corrente, non un valore "creduto sulla parola". `tenantResolver`/`membershipChecker` (`src/modules/tenancy/resolver.ts`) sono l'implementazione reale, basata su `memberships` (query `WHERE userId = ? AND status = 'ACTIVE'`).

In pratica, pagine e server action non chiamano `tenantResolver` direttamente: usano `getActiveTenant()` (`src/lib/active-tenant.ts`), una Data Access Layer che combina `requireUser()` + `resolveActiveTenant()` + i dati del tenant per l'UI (nome studio, ragione sociale), avvolta in `React.cache()` così le chiamate ripetute nello stesso render (layout + pagina) non duplicano le query. Ogni Server Action richiama comunque `getActiveTenant()` da capo — la cache non attraversa richieste diverse, e non dovrebbe.

### Un utente con più tenant

Un utente può avere più `memberships` attive (più studi). Questa milestone non ha ancora un'interfaccia per cambiare tenant attivo, quindi `resolveActiveTenant` sceglie deterministicamente la membership più vecchia (`ORDER BY createdAt ASC LIMIT 1`). Da rivedere quando verrà introdotto lo switch tra tenant.

## Firma delle query tenant-owned

Ogni funzione che legge/scrive un'entità tenant-owned accetta il tenant esplicitamente:

```ts
getPatientById({ tenantId, patientId }); // corretto
getPatientById(patientId); // MAI: permetterebbe letture cross-tenant
```

Questo pattern è già applicato in `src/modules/patients/repository.ts`, `src/modules/memberships/repository.ts`, `src/modules/billing/repository.ts`, `src/modules/entitlements/service.ts`.

## ~~Placeholder di questa milestone~~ (rimosso il 2026-08-09)

`src/lib/demo-tenant.ts` è stato rimosso: tutte le pagine sotto `/app` e le server action di scrittura usano ora `getActiveTenant()` (risoluzione reale, vedi sopra).

## Protezione dell'ultimo owner

Il DB impone solo l'unicità `(tenantId, userId)` su `memberships`. La regola "non si può rimuovere/retrocedere l'ultimo OWNER attivo di un tenant" è applicativa e **non è ancora implementata** (nessuna mutazione di membership esiste in questa milestone).
