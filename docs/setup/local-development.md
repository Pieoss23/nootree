# Local Development

## Prerequisiti

- Node.js 20+ (sviluppato e verificato con Node 24)
- pnpm 10+
- Docker Desktop (per PostgreSQL locale via Docker Compose) — oppure un PostgreSQL locale già disponibile

## Setup da zero

```bash
pnpm install
cp .env.example .env.local        # poi compila i valori richiesti, vedi environment-variables.md
docker compose up -d               # avvia Postgres (dev + test db) su localhost:5439
pnpm db:migrate                    # applica le migrazioni al database di sviluppo
pnpm db:seed                       # popola i dati demo
pnpm dev                           # http://localhost:3000
```

## Perché la porta 5439 e non 5432

Il `docker-compose.yml` di questo progetto espone Postgres su `5439` invece del default `5432`, per evitare conflitti con altre istanze Postgres eventualmente già in esecuzione sulla stessa macchina di sviluppo (è successo durante il bootstrap di questo progetto — vedi `docs/audit/execution-log.md`). Se il tuo ambiente non ha questo conflitto, puoi comunque lasciare `5439`: è solo la porta esposta sull'host, non cambia nulla dentro il container.

## Script disponibili

| Script                              | Cosa fa                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                          | Avvia il server di sviluppo Next.js                                      |
| `pnpm build`                        | Build di produzione                                                      |
| `pnpm start`                        | Avvia la build di produzione                                             |
| `pnpm lint`                         | ESLint                                                                   |
| `pnpm typecheck`                    | `tsc --noEmit`                                                           |
| `pnpm format` / `pnpm format:check` | Prettier (scrive / verifica)                                             |
| `pnpm test`                         | Vitest (unit + integrazione DB, richiede `TEST_DATABASE_URL`)            |
| `pnpm test:watch`                   | Vitest in watch mode                                                     |
| `pnpm test:e2e`                     | Playwright (avvia `pnpm dev` automaticamente se non è già in esecuzione) |
| `pnpm db:generate`                  | Genera una nuova migrazione da `src/db/schema`                           |
| `pnpm db:migrate`                   | Applica le migrazioni pendenti                                           |
| `pnpm db:seed`                      | Esegue il seed di sviluppo (idempotente)                                 |
| `pnpm check`                        | `format:check && lint && typecheck && test`                              |

## Note

- Il seed **non** va mai eseguito con `NODE_ENV=production` — lo script rifiuta esplicitamente di procedere in quel caso.
- I test di integrazione database (`pnpm test`) richiedono `TEST_DATABASE_URL` configurato; se assente, quella parte della suite viene saltata automaticamente (`describe.skipIf`).
