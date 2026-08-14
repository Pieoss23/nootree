# ADR 005 — Ruolo platform-level `SUPERUSER` per l'amministrazione cross-tenant

## Stato

Accettata.

## Contesto

Serve un account in grado di amministrare tutti i tenant della piattaforma (richiesto dall'utente il 2026-08-09, vedi `docs/audit/open-risks.md`). Non può essere modellato come un valore aggiuntivo di `memberships.role` (`OWNER`/`NUTRITIONIST`/`ASSISTANT`): quei ruoli sono per-tenant per costruzione (una riga `memberships` lega un utente a **un** tenant specifico), mentre questa capacità deve valere su **tutti** i tenant contemporaneamente, cioè bypassare di proposito il confine di sicurezza principale dell'app — l'isolamento a schema condiviso (ADR 002, `docs/architecture/multi-tenancy.md`).

## Decisione

- **Colonna separata**: `users.platformRole` (enum `USER` / `SUPERUSER`, default `USER`), indipendente da `memberships.role`. Un utente può essere `SUPERUSER` senza avere nessuna membership in nessun tenant.
- **Accesso diretto, non impersonazione**: le query di amministrazione (`src/modules/platform/admin-repository.ts`) leggono direttamente su più tenant (es. `listAllTenants()`), senza il concetto di "entrare" in un tenant e agire come se si avesse una membership al suo interno. Decisione di prodotto esplicita (2026-08-14): più semplice da ragionare e da auditare di un modello di impersonazione, al prezzo di dover costruire viste di amministrazione dedicate invece di riusare le pagine tenant-scoped esistenti.
- **Verifica server-side ad ogni richiesta, mai un claim di sessione**: `requireSuperuser()` (`src/modules/platform/service.ts`) rilegge `platformRole` dal DB a ogni chiamata (avvolta in `React.cache()` per deduplicare nello stesso render, mai tra richieste diverse), stesso pattern di `getActiveTenant()`. Revocare un superuser ha effetto immediato, senza attendere la scadenza/refresh di una sessione.
- **Autorizzazione a livello di modulo**: `assertPlatformRole(role, minimum)` / `PlatformAccessDeniedError` (`src/modules/platform/authorization.ts`) rispecchia esattamente `assertRole`/`InsufficientRoleError` di `src/modules/memberships/authorization.ts`.
- **Route dedicata, non annidata**: `/admin` è sorella di `(app)/app`, non figlia — non dipende mai da `getActiveTenant()`/tenant attivo. `src/proxy.ts` la protegge solo a livello di "utente loggato" (nessun accesso al DB nel gate a livello edge); il controllo `SUPERUSER` reale avviene in `src/app/admin/layout.tsx` via `requireSuperuser()`.
- **Audit obbligatorio**: ogni query in `admin-repository.ts` chiama `recordAuditEvent` (tabella esistente `audit_events`, già pensata per eventi platform-level: `tenantId` nullable). Convenzione di naming: `admin.<risorsa>.<azione>` (es. `admin.tenants.list`).
- **Assegnazione manuale**: nessuna UI di promozione/retrocessione in questa milestone — si imposta `platformRole` a mano via DB o seed di sviluppo. Riduce la superficie d'attacco finché non serve davvero una UI dedicata.
- **Perimetro di questo primo taglio**: solo una vista di sola lettura su tenant/utenti (dati non sanitari). Una vista cross-tenant su dati clinici (es. tutti i pazienti di tutti gli studi) è rimandata esplicitamente — stesso pattern architetturale, ma comporta esposizione di dati sanitari reali (GDPR) e merita un via libera a sé, non implicito in questo step. Vedi `docs/audit/open-risks.md`.

## Alternative considerate

- **Impersonazione** (il superuser "entra" in un tenant e agisce come se avesse una membership): scartata — l'utente ha scelto esplicitamente l'accesso diretto (2026-08-14). L'impersonazione avrebbe riusato le pagine/azioni tenant-scoped esistenti a costo di un modello di autorizzazione più complesso (un `TenantContext` "preso in prestito" da un altro percorso rispetto a `resolveActiveTenant`).
- **Ruolo aggiuntivo su `memberships`** (es. un quarto valore `PLATFORM_ADMIN` nell'enum `membership_role`): scartata — `memberships` lega intrinsecamente un utente a un tenant; un ruolo "vale per tutti i tenant" dentro quella tabella richiederebbe una riga per tenant o un valore speciale di `tenantId`, entrambe soluzioni forzate rispetto a una colonna dedicata su `users`.
- **Claim di sessione/JWT per il controllo del ruolo**: scartata — richiederebbe propagare `platformRole` nel token Auth.js e gestirne l'invalidazione, aggiungendo latenza di revoca (il claim resta valido fino al refresh) proprio sul permesso più sensibile del sistema. La verifica DB per-richiesta è già il pattern esistente (`getActiveTenant`) ed è economicamente equivalente (una query in più, con `React.cache()` a deduplicare nello stesso render).

## Conseguenze

- `src/modules/platform/admin-repository.ts` è l'unica superficie rivista dove l'invariante di isolamento tenant di ADR 002 viene volutamente bypassato — future query cross-tenant vanno aggiunte lì, non sparse altrove (vedi `docs/security/tenant-isolation-rules.md`, Regola 3).
- Ogni pagina/azione sotto `/admin` deve chiamare `requireSuperuser()` esplicitamente: non c'è un equivalente del controllo automatico a livello di edge che esiste per `/app` (quello resta solo "utente loggato").
- Nessuna UI self-service per promuovere un superuser è un rischio accettato temporaneo, non una scelta permanente: da rivedere se il numero di operatori piattaforma cresce oltre la gestione manuale via DB/seed.
