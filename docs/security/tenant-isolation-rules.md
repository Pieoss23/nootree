# Tenant Isolation Rules

Regole vincolanti per qualsiasi codice che legge o scrive un'entità tenant-owned (patients, memberships, invitations, billingCustomers, subscriptions, tenantEntitlements, tenantProfiles, ...).

## Regola 1 — Mai fidarsi di un `tenantId` client-side

Un `tenantId` che arriva da query param, body della richiesta, stato del browser o cookie non verificato **non è un'autorizzazione**. L'unico `tenantId` affidabile è quello dentro un `TenantContext` risolto lato server (`src/modules/tenancy`).

## Regola 2 — Firma esplicita delle query tenant-owned

```ts
// corretto
getPatientById({ tenantId, patientId });
listMembershipsByTenant(tenantId);

// vietato
getPatientById(patientId); // nessun modo di verificare l'appartenenza al tenant
```

Applicato oggi in `src/modules/patients/repository.ts`, `src/modules/memberships/repository.ts`, `src/modules/billing/repository.ts`, `src/modules/entitlements/service.ts`.

## Regola 3 — Nessuna query "globale" su tabelle tenant-owned senza un motivo esplicito

Una query senza filtro `tenantId` su `patients`, `memberships`, ecc. è accettabile solo in contesti espliciti di amministrazione della piattaforma (non esistenti in questa milestone) o negli script di seed/migrazione, mai in un percorso raggiungibile da una richiesta utente.

## Regola 4 — Verifica sempre con un test di integrazione quando possibile

`src/tests/db.integration.test.ts` verifica concretamente:

- che due tenant diversi possano avere pazienti con la stessa email (l'email non è un identificativo cross-tenant);
- che `listPatientsByTenant`/`getPatientById` non restituiscano mai righe di un altro tenant;
- che i vincoli di unicità (`memberships (tenantId, userId)`, `webhook_events (provider, providerEventId)`) siano realmente imposti dal database, non solo assunti dall'applicazione.

Qualsiasi nuova query tenant-owned dovrebbe aggiungere un caso equivalente.

## Regola 5 — L'audit log non sostituisce l'autorizzazione

`recordAuditEvent` registra cosa è successo; non decide se un'azione era permessa. La decisione di autorizzazione deve avvenire prima, nel modulo di dominio competente.
