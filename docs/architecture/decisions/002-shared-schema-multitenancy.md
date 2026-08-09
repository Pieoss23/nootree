# ADR 002 — Multi-tenancy a schema condiviso

## Stato

Accettata.

## Contesto

Ogni entità dello studio (pazienti, membership, abbonamento, ...) deve essere isolata per tenant. Le opzioni tipiche sono: database per tenant, schema PostgreSQL per tenant, o schema condiviso con colonna `tenantId`.

## Decisione

Schema condiviso: un solo database, `tenantId` come colonna su ogni tabella tenant-owned, isolamento imposto dall'applicazione (ogni query di dominio richiede esplicitamente `tenantId` — vedi [multi-tenancy.md](../multi-tenancy.md)).

## Alternative considerate

- **Database per tenant**: isolamento più forte, ma complessità operativa (provisioning, migrazioni × N database, connection pooling) sproporzionata per uno studio nutrizionale medio-piccolo; inoltre complica pesantemente query cross-tenant per l'amministrazione della piattaforma.
- **Schema per tenant**: via di mezzo, ma Drizzle Kit e la gestione delle migrazioni diventano più complesse (N schema da tenere sincronizzati), senza un beneficio di isolamento decisivo rispetto a una colonna `tenantId` ben indicizzata e disciplinata a livello applicativo.

## Conseguenze

- Le performance a grande scala richiederanno indici accurati su `tenantId` (già presenti sulle tabelle più lette, es. `patients`).
- L'isolamento dipende dalla disciplina applicativa (mai fidarsi di un `tenantId` client-side, mai una query senza filtro esplicito) — vedi [tenant-isolation-rules.md](../../security/tenant-isolation-rules.md). Un bug applicativo può violare l'isolamento più facilmente che con database separati; il rischio è accettato in cambio della semplicità operativa, e viene mitigato con test di integrazione dedicati (`src/tests/db.integration.test.ts`).
