# ADR 004 — Adapter per i provider esterni

## Stato

Accettata.

## Contesto

Auth.js, Resend e Stripe sono servizi esterni che verranno integrati progressivamente. Se il dominio li importasse direttamente, ogni modulo diventerebbe accoppiato a un SDK specifico, difficile da testare e da sostituire.

## Decisione

Ogni provider esterno è rappresentato da un'interfaccia definita nel modulo di dominio corrispondente:

- `IdentityService` (`src/modules/identity`) — davanti ad Auth.js.
- `EmailProvider` (`src/modules/notifications`) — davanti a Resend. Implementazione di sviluppo già presente: `ConsoleEmailProvider`.
- `BillingProvider` (`src/modules/billing`) — davanti a Stripe.

Il dominio dipende solo dall'interfaccia. L'implementazione concreta (quando scritta) vive in un layer infrastrutturale e viene iniettata, non importata direttamente da un componente o da un'altra route.

## Alternative considerate

- **Import diretto dell'SDK nei componenti/route**: più veloce da scrivere all'inizio, ma rende impossibile testare senza credenziali reali e lega la UI a un provider specifico che potrebbe cambiare (es. sostituire Resend).

## Conseguenze

- In questa milestone solo `ConsoleEmailProvider` ha un'implementazione (esplicitamente di sviluppo). `IdentityService` e `BillingProvider` sono solo contratti: nessuna classe li implementa ancora.
- Quando le implementazioni reali arriveranno (Milestone 1.1 per identity/notifications, milestone successiva per billing), il codice che le usa non dovrebbe cambiare, solo l'iniezione.
