# ADR 001 — Modular monolith

## Stato

Accettata.

## Contesto

Il prodotto è agli inizi: un solo team, un solo deployment, requisiti che cambieranno molto nei prossimi mesi (autenticazione, tenant, billing, pazienti, poi agenda/piani alimentari/documenti). Serve una struttura che eviti sia il "big ball of mud" sia la complessità operativa prematura di microservizi.

## Decisione

Un'unica applicazione Next.js, organizzata internamente per domini di business in `src/modules/*` (identity, tenancy, memberships, billing, entitlements, patients, audit, notifications), separata da `src/app` (routing/presentazione) e `src/db` (persistenza). Ogni modulo espone un barrel `index.ts` con il proprio contratto pubblico; il resto dell'app dipende da quel contratto, non dai dettagli interni del modulo.

## Alternative considerate

- **Microservizi**: scartati. Aggiungono complessità di rete, deployment e osservabilità non giustificata dalla scala attuale, e renderebbero più lenta l'iterazione su un dominio ancora instabile.
- **Struttura piatta senza confini di dominio**: scartata. Con l'ampiezza prevista del prodotto (pazienti, billing, team, in futuro clinica), un'organizzazione puramente tecnica (`controllers/`, `services/`, `models/`) tende a far collassare i confini nel tempo.

## Conseguenze

- I moduli possono evolvere singolarmente verso `domain/ application/ infrastructure/ presentation/` quando la complessità lo giustifica, senza dover riorganizzare l'intero repository.
- Serve disciplina per non violare i confini (es. importare Stripe direttamente in un componente React) — mitigato dagli adapter descritti in [ADR 004](./004-provider-adapters.md).
