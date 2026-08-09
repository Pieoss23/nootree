# Authentication Boundary

## Contratto

Il resto dell'applicazione dipende solo da `IdentityService` (`src/modules/identity/service.ts`):

```ts
export interface IdentityService {
  getCurrentUser(): Promise<CurrentUser | null>;
  requireUser(): Promise<CurrentUser>;
  signOut(): Promise<void>;
}
```

Nessun modulo di dominio al di fuori di `identity` importa Auth.js direttamente. L'implementazione reale (`authIdentityService`, in `src/modules/identity/identity-service.ts`) è un adapter che avvolge Auth.js e implementa questo contratto.

## Stato attuale (Milestone 1.1)

- Auth.js (`next-auth@5` beta) è collegato tramite `src/lib/auth.ts`, considerato infrastruttura (non un modulo di dominio), sullo stesso piano di `src/db/client.ts`.
- Sessioni database-backed (`session.strategy: "database"`), persistite tramite `@auth/drizzle-adapter` sulle tabelle `users`/`sessions`/`verification_tokens` già presenti in `src/db/schema/identity.ts`.
- Flusso magic-link reale: `/login` invoca la server action `requestMagicLink` (`src/app/(auth)/login/actions.ts`), che chiama `signIn("email", …)`. Auth.js genera un token, lo persiste in `verification_tokens` e chiama `sendVerificationRequest`.
- `sendVerificationRequest` chiama `getEmailProvider(env)` (vedi sezione "Provider email" più sotto): invia davvero via Resend se `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sono configurate, altrimenti (tipicamente in sviluppo) logga su console. Cliccando il link (ricevuto per email o letto dal log) si crea una sessione reale e si viene reindirizzati a `/app`.
- Le rotte `/app/*` sono protette da `src/proxy.ts` (il file `middleware.ts` è deprecato in questa versione di Next.js — vedi `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). La guardia usa `callbacks.authorized` in `src/lib/auth.ts`: un utente senza sessione che richiede `/app/*` viene reindirizzato a `/login`.
- `Sign out` (`UserMenu` → `signOutAction`, in `src/components/shared/user-menu-actions.ts`) invoca `authIdentityService.signOut()`, che cancella la sessione database e reindirizza a `/login`.
- La tabella `accounts` (pensata per un futuro provider OAuth) non è ancora usata: Auth.js non la tocca nel flusso solo-email (non chiama mai `linkAccount`/`getUserByAccount` per `type: "email"`). Le sue colonne non seguono ancora esattamente la convenzione OAuth di Auth.js (es. `expires_at` dovrebbe essere un intero epoch, non un timestamp) — andrà rivista quando si aggiungerà un vero provider OAuth. Per questo motivo lo schema passato a `DrizzleAdapter` viene castato esplicitamente in `src/lib/auth.ts`.

## Provider email (notifications)

Stesso principio applicato a `EmailProvider` (`src/modules/notifications/provider.ts`): il dominio non importa Resend direttamente. `ConsoleEmailProvider` (`src/modules/notifications/console-email-provider.ts`) resta un adapter di sviluppo — logga su console con un prefisso `DEV MODE`, incluso il corpo HTML (quindi il link del magic-link è recuperabile dal log). `ResendEmailProvider` (`src/modules/notifications/resend-email-provider.ts`) è l'implementazione reale.

`getEmailProvider(env)` (`src/modules/notifications/email-provider-factory.ts`) sceglie tra i due: Resend se `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sono entrambe configurate, altrimenti Console — **tranne in produzione**, dove l'assenza di configurazione Resend è un errore immediato (fail loud, non un no-op silenzioso). La funzione accetta `env` come parametro invece di importare il singleton, così è testabile senza un ambiente reale (vedi `email-provider-factory.test.ts`).

## Cosa manca ancora

- Autorizzazione basata su ruolo: `TenantContext.role` è risolto (vedi `docs/architecture/multi-tenancy.md`), ma nessuna server action lo controlla ancora prima di scrivere.
- Reshape della tabella `accounts` per un vero provider OAuth, quando ne verrà aggiunto uno.
- `AUTH_SECRET` è obbligatorio perché il flusso funzioni (Auth.js lancia `MissingSecret` altrimenti), anche se lo schema `src/config/env.ts` lo rende obbligatorio solo in produzione — vedi `.env.example`.
