# Multi-tenancy

## Modello: schema condiviso

Un solo database PostgreSQL, condiviso da tutti i tenant. Ogni tabella "tenant-owned" (patients, memberships, billingCustomers, subscriptions, tenantEntitlements, tenantProfiles, ...) contiene una colonna `tenantId` con foreign key verso `tenants.id`. Vedi [ADR 002](./decisions/002-shared-schema-multitenancy.md) per il perché rispetto a schema-per-tenant o database-per-tenant.

## Regola non negoziabile

**Un `tenantId` che arriva dal client (query param, stato del browser, cookie non verificato) non è mai un'autorizzazione.** Il flusso corretto, quando sarà implementato (Milestone 1.1), è:

```ts
const user = await identityService.requireUser();
const tenantContext = await tenantResolver.resolveActiveTenant(user); // server-verified
// solo ora tenantContext.tenantId è affidabile
```

`TenantContext` (`src/modules/tenancy/types.ts`) rappresenta esattamente questo: un tenant risolto e verificato lato server per l'utente corrente, non un valore "creduto sulla parola".

## Firma delle query tenant-owned

Ogni funzione che legge/scrive un'entità tenant-owned accetta il tenant esplicitamente:

```ts
getPatientById({ tenantId, patientId }); // corretto
getPatientById(patientId); // MAI: permetterebbe letture cross-tenant
```

Questo pattern è già applicato in `src/modules/patients/repository.ts`, `src/modules/memberships/repository.ts`, `src/modules/billing/repository.ts`, `src/modules/entitlements/service.ts`.

## Placeholder di questa milestone

Non esiste ancora una sessione utente, quindi non può esistere una vera `TenantResolver`. Le pagine sotto `/app` usano `getDemoTenant()` (`src/lib/demo-tenant.ts`), che risolve sempre il tenant demo per slug, esplicitamente marcato come temporaneo nel codice. Questo file **deve essere rimosso** quando la risoluzione tenant reale viene introdotta — non deve mai convivere con essa.

## Protezione dell'ultimo owner

Il DB impone solo l'unicità `(tenantId, userId)` su `memberships`. La regola "non si può rimuovere/retrocedere l'ultimo OWNER attivo di un tenant" è applicativa e **non è ancora implementata** (nessuna mutazione di membership esiste in questa milestone).
