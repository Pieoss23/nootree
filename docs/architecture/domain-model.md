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

- **patients** — anagrafica minima (`firstName, lastName, email?, phone?, birthDate?, sex?, fiscalCode?, status, internalNotes?`). Nessun dato clinico. `email` **non è univoca**, nemmeno per tenant: non è un identificativo affidabile. Indici su `tenantId` e `(tenantId, email)` per le query più comuni. `sex` (enum `patient_sex`, nullable) è usato solo per stimare il fabbisogno calorico (formula Mifflin-St Jeor) quando manca un BMR misurato — vedi `recipes.ts`/`docs/audit/decisions.md`. Campi clinici/anamnesi (allergie, patologie, farmaci, obiettivo, attività, **intensità dieta** — enum `diet_intensity`, nullable) restano tutti opzionali, entrati nel tempo.

## Prodotti (`products.ts`)

- **foodItems** — catalogo alimenti **condiviso tra tutti i tenant**: unica tabella "business" dello schema senza colonna `tenantId`, perché è dato di riferimento nutrizionale, non proprietà di uno studio. `name` univoco, `category` (enum `food_category`), valori nutrizionali sempre per 100g (`kcalPer100g`, `proteinGPer100g`, `carbsGPer100g`, `fatGPer100g`, `fiberGPer100g?`). `source` traccia la provenienza (oggi solo `CURATED_SEED`: un seed curato a mano, non un import ufficiale CREA/BDA — vedi `docs/audit/decisions.md`).
- **tenantProducts** — prodotti/ricette creati dallo studio stesso, stessa forma nutrizionale di `foodItems` ma sempre scoped a `tenantId`. `status` (`ACTIVE|ARCHIVED`), archiviati non cancellati fisicamente — stesso pattern di `patients`.

## Ricette (`recipes.ts`)

- **recipes** — ricette dello studio (`name, instructions?, status, tenantId`), tenant-scoped a differenza di `foodItems`. Archiviate non cancellate fisicamente.
- **recipeIngredients** — una riga per ingrediente, `quantityGrams` sempre in grammi. L'ingrediente è o `foodItemId` (catalogo condiviso) o `tenantProductId` (prodotto del tenant), **mai entrambi né nessuno dei due** — vincolo imposto con un `CHECK` a livello DB (`recipe_ingredients_single_source`), non solo applicativo, perché Postgres non ha un vero FK polimorfico. `tenantId` denormalizzato come FK diretta (Regola 2 di `docs/security/tenant-isolation-rules.md`).
- **patientRecipes** — assegnazione di una ricetta a un paziente: `portionGrams` (valore effettivo, sempre presente) e `suggestedPortionGrams?` (snapshot del calcolo di `src/modules/recipes/dosage.ts` al momento dell'assegnazione, mai vincolante). Aggiunta/eliminazione, non modifica — stesso ragionamento di `patient_measurements`.

## Audit (`audit.ts`)

- **auditEvents** — `tenantId?, actorUserId?, action, entityType, entityId?, requestId?, metadata (jsonb, minimizzato), ipHash?, userAgent?, createdAt`. Append-only per convenzione applicativa (`recordAuditEvent` è l'unica funzione che scrive in questa tabella).

## Relazioni

Le relazioni Drizzle (`src/db/schema/relations.ts`) coprono i percorsi usati oggi dalla UI: tenant↔membership↔user, tenant↔patients, plan↔feature, subscription↔plan/billingCustomer. Non è stato definito ogni possibile join — solo quelli richiesti dalle pagine e dai repository implementati.
