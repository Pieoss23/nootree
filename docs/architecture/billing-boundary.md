# Billing Boundary

## Contratto

```ts
export interface BillingProvider {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult>;
  createCustomerPortalSession(input: CreateCustomerPortalInput): Promise<CustomerPortalResult>;
}
```

Definito in `src/modules/billing/provider.ts`. Nessun modulo di dominio importa l'SDK di Stripe direttamente — solo un'eventuale `StripeBillingProvider` infrastrutturale lo farebbe.

## Cosa è realmente implementato in questa milestone

- Schema DB completo per piani, feature, entitlement, cliente di fatturazione, subscription, righe subscription, eventi webhook (vedi [domain-model.md](./domain-model.md)).
- `getActiveSubscriptionForTenant` (`src/modules/billing/repository.ts`): lettura reale dell'ultima subscription di un tenant, usata dalla pagina Abbonamento.
- Utility monetarie (`src/modules/billing/money.ts`): `toMinorUnits`/`formatMinorUnits` — gli importi sono sempre interi in minor unit, mai float.
- Seed di una subscription demo con `providerCustomerId`/`providerSubscriptionId` esplicitamente fittizi (`cus_demo_seed_0001`, `sub_demo_seed_0001`).

## Cosa è solo un placeholder

- `createCheckoutSession`/`createCustomerPortalSession` non hanno un'implementazione concreta — nessun `StripeBillingProvider` esiste ancora.
- Il pulsante "Apri Customer Portal" nella pagina Abbonamento è disabilitato con un tooltip esplicativo.
- Non esiste alcun endpoint webhook Stripe. La tabella `webhookEvents` esiste (con vincolo di idempotenza `(provider, providerEventId)`, verificato da test) ma non è ancora scritta da nessun handler.

## Regola sui soldi

Non salvare mai importi come floating point. `subscriptionItems.unitAmount` è un intero in minor unit (es. centesimi) con `currency` a fianco. Le conversioni verso/da una stringa leggibile passano sempre da `src/modules/billing/money.ts`.
