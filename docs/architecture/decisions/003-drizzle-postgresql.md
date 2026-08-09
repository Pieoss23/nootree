# ADR 003 — Drizzle ORM + PostgreSQL

## Stato

Accettata.

## Contesto

Serve un database relazionale con vincoli forti (foreign key, unique, enum) per un dominio con molte relazioni (tenant↔membership↔user, piano↔feature, subscription↔item) e un ORM/query builder TypeScript-first che non nasconda l'SQL generato.

## Decisione

PostgreSQL come database, Drizzle ORM + Drizzle Kit per schema, query e migrazioni. Driver `postgres` (postgres-js).

## Alternative considerate

- **Prisma**: ottima developer experience, ma il motore di migrazione è più opaco e la generazione di client separata aggiunge un passaggio di build; Drizzle produce SQL ispezionabile e si integra più direttamente con TypeScript senza codegen a parte lo schema stesso.
- **Query SQL raw senza ORM**: massimo controllo, ma perde la sicurezza dei tipi end-to-end che serve con un dominio di questa ampiezza.
- **MySQL/altri RDBMS**: PostgreSQL scelto per `jsonb` (usato in `audit_events.metadata`), enum nativi, ed è lo standard de facto per questo tipo di stack.

## Conseguenze

- Le migrazioni sono file SQL versionati in `src/db/migrations/`, generati da `drizzle-kit generate` e mai scritti a mano; nessuno schema-sync distruttivo in produzione (vedi `docs/setup/database.md`).
- Lo schema TypeScript in `src/db/schema/*` è la fonte di verità; drizzle-kit genera la migrazione a partire da lì.
