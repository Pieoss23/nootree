# Database

PostgreSQL + Drizzle ORM. Schema in `src/db/schema/*`, migrazioni SQL versionate in `src/db/migrations/`.

## Avviare PostgreSQL in locale

```bash
docker compose up -d
```

Questo avvia un container Postgres 16 con due database: `nootree` (sviluppo) e `nootree_test` (creato automaticamente al primo avvio da `docker/postgres-init/01-create-test-db.sql`), esposti su `localhost:5439`.

## Inizializzare un database nuovo

```bash
pnpm db:migrate    # applica tutte le migrazioni in src/db/migrations, in ordine
pnpm db:seed       # popola i dati di sviluppo (idempotente)
```

`pnpm db:migrate` usa `DATABASE_URL`. Per applicare le stesse migrazioni al database di test, sovrascrivi la variabile:

```bash
DATABASE_URL="$TEST_DATABASE_URL" pnpm exec tsx src/db/migrate.ts
```

## Generare una nuova migrazione

Dopo aver modificato uno schema in `src/db/schema/*`:

```bash
pnpm db:generate
```

Drizzle Kit confronta lo schema TypeScript con lo stato tracciato e genera un nuovo file SQL in `src/db/migrations/`. **Il file generato va rivisto prima di applicarlo** (specialmente per modifiche distruttive: rinominare/eliminare colonne, cambiare tipo). Non modificare mai a mano una migrazione già applicata altrove — generane una nuova.

## Verificare lo stato

```bash
pnpm exec drizzle-kit check     # verifica coerenza tra schema e migrazioni
docker exec nootree-postgres psql -U nootree -d nootree -c "\dt"   # elenca le tabelle
```

## Regole

- Nessuno schema-sync distruttivo in produzione: solo migrazioni SQL esplicite, mai `drizzle-kit push` contro un database con dati reali.
- Il seed (`pnpm db:seed`) rifiuta di eseguire se `NODE_ENV=production`.
- I test automatici (`pnpm test`) non usano mai `nootree` (sviluppo): usano `nootree_test` tramite `TEST_DATABASE_URL`, e la suite di integrazione ricrea lo schema da zero a ogni esecuzione.
