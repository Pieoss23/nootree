# Domain Model

Schema definito in `src/db/schema/*`, migrazioni generate in `src/db/migrations/`. Tutti gli id sono UUID (`gen_random_uuid()`), tutti i timestamp sono `timestamptz` (UTC).

## Identity (`src/db/schema/identity.ts`)

- **users** — `id, email (unique), emailVerifiedAt, name, image, createdAt, updatedAt`.
- **accounts** — collegamenti OAuth futuri; chiave primaria composita `(provider, providerAccountId)`, coerente con la convenzione dell'adapter Drizzle di Auth.js.
- **sessions** — `sessionToken (unique), userId, expiresAt`.
- **verificationTokens** — `(identifier, token)` come chiave composita; userà per il flusso magic-link.

## Tenancy (`tenancy.ts`)

- **tenants** — `id, name, slug (unique), createdAt, updatedAt, archivedAt`.
- **tenantProfiles** — dati "studio" (ragione sociale, indirizzo, fuso orario), 1:1 con `tenants`.

## Memberships (`memberships.ts`)

- **memberships** — relazione molti-a-molti tra `users` e `tenants`. `role` (`OWNER | NUTRITIONIST | ASSISTANT`), `status` (`ACTIVE | SUSPENDED | PENDING`), vincolo univoco `(tenantId, userId)`.
- **invitations** — inviti pendenti/accettati/scaduti/revocati; **non** univoci su `(tenantId, email)` perché la stessa email può essere reinvitata dopo revoca/scadenza (l'univocità sui pendenti è responsabilità applicativa, non ancora implementata).

## Billing (`billing.ts`)

- **plans** — `key (STARTER|PROFESSIONAL|STUDIO, unique), name`.
- **features** — chiave stabile (es. `patients.management`), nome, descrizione.
- **planFeatures** — associazione piano↔feature, univoca su `(planId, featureId)`.
- **tenantEntitlements** — entitlement risolti per tenant (feature abilitata o limite numerico), univoci su `(tenantId, key)`. Normalmente rispecchiano il piano, ma permettono override per singolo tenant senza inventare un piano nuovo. `limitValue` è `bigint` (non `integer`): un limite come `storageBytes` supera facilmente il range di un int a 32 bit.
- **billingCustomers** — un cliente di fatturazione per tenant (`tenantId` univoco), `providerCustomerId` univoco.
- **subscriptions** — stato abbonamento, periodo corrente, cancellazione programmata, `providerSubscriptionId` univoco.
- **subscriptionItems** — righe della subscription, importi in **minor unit** (mai float).
- **webhookEvents** — idempotenza sugli eventi webhook, univoci su `(provider, providerEventId)`; il payload completo non viene salvato.

## Patients (`patients.ts`)

- **patients** — anagrafica minima (`firstName, lastName, email?, phone?, birthDate?, fiscalCode?, status, internalNotes?`). Nessun dato clinico. `email` **non è univoca**, nemmeno per tenant: non è un identificativo affidabile. Indici su `tenantId` e `(tenantId, email)` per le query più comuni.

## Audit (`audit.ts`)

- **auditEvents** — `tenantId?, actorUserId?, action, entityType, entityId?, requestId?, metadata (jsonb, minimizzato), ipHash?, userAgent?, createdAt`. Append-only per convenzione applicativa (`recordAuditEvent` è l'unica funzione che scrive in questa tabella).

## Relazioni

Le relazioni Drizzle (`src/db/schema/relations.ts`) coprono i percorsi usati oggi dalla UI: tenant↔membership↔user, tenant↔patients, plan↔feature, subscription↔plan/billingCustomer. Non è stato definito ogni possibile join — solo quelli richiesti dalle pagine e dai repository implementati.
