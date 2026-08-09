# Environment Variables

Validazione centralizzata con Zod: variabili server in `src/config/env.ts`, variabili pubbliche in `src/config/env.client.ts`. Un'app che parte con variabili mancanti o malformate fallisce subito, con un messaggio che elenca esattamente cosa non va — mai un errore incomprensibile a runtime più avanti.

## Variabili obbligatorie

| Nome                  | Dove              | Note                                                       |
| --------------------- | ----------------- | ---------------------------------------------------------- |
| `DATABASE_URL`        | server            | Stringa di connessione PostgreSQL valida                   |
| `NEXT_PUBLIC_APP_URL` | client (pubblica) | URL base dell'app                                          |
| `NODE_ENV`            | server            | `development \| test \| production`, default `development` |

## Obbligatoria solo in produzione

| Nome          | Note                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET` | Opzionale in sviluppo/test, **obbligatoria quando `NODE_ENV=production`** (l'app rifiuta di avviarsi senza). Minimo 32 caratteri. |

## Opzionali (necessarie solo quando il relativo modulo è abilitato)

| Nome                                                                               | Modulo                  | Comportamento se assente                                                                                                                                              |
| ---------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TEST_DATABASE_URL`                                                                | Test di integrazione DB | I test DB vengono saltati (`describe.skipIf`)                                                                                                                         |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`                                              | notifications           | `assertResendConfigured` lancia un errore esplicito solo se qualcosa prova a inviare email reali — in questa milestone non succede mai, si usa `ConsoleEmailProvider` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | billing                 | `assertStripeConfigured` lancia un errore esplicito solo se qualcosa prova a chiamare Stripe — in questa milestone non succede mai                                    |

## Regole

- Nessuna variabile server (`env.ts`) è mai importabile da un componente client: il file inizia con `import "server-only"`.
- Solo le variabili `NEXT_PUBLIC_*` sono definite in `env.client.ts` ed esposte al browser.
- `.env.example` documenta ogni variabile con un commento; non contiene segreti reali.
- `.env.local` (git-ignorato) contiene i valori reali per lo sviluppo locale.
