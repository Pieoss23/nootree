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

Nessun modulo al di fuori di `identity` deve importare Auth.js direttamente. Quando l'implementazione reale sarà scritta (Milestone 1.1), sarà un adapter che implementa questa interfaccia, iniettato dall'infrastruttura.

## Stato attuale

- Non esiste ancora un'implementazione di `IdentityService`.
- La pagina `/login` (`src/app/(auth)/login/`) mostra solo la UI del flusso passwordless: un form email che invoca una server action (`requestMagicLink`, in `actions.ts`), la quale usa `ConsoleEmailProvider` (vedi `notifications-provider-boundary` più sotto) per **loggare** il messaggio invece di inviarlo. Nessuna sessione viene creata, nessun token viene verificato.
- Le tabelle `users`, `accounts`, `sessions`, `verification_tokens` esistono già e sono modellate per essere compatibili con l'adapter Drizzle di Auth.js, così la Milestone 1.1 non richiederà una migrazione di schema per iniziare.

## Provider email (notifications)

Stesso principio applicato a `EmailProvider` (`src/modules/notifications/provider.ts`): il dominio non importa Resend direttamente. `ConsoleEmailProvider` (`src/modules/notifications/console-email-provider.ts`) è esplicitamente un adapter di sviluppo — logga su console con un prefisso `DEV MODE` e non deve mai essere usato in un percorso di produzione.

## Cosa manca (Milestone 1.1)

- Implementazione reale di `IdentityService` sopra Auth.js.
- Generazione/verifica del vero magic-link token (tabella `verification_tokens` già pronta).
- Adapter Resend reale dietro `EmailProvider`.
- Middleware/guardia che protegge effettivamente le rotte `/app/*` (oggi sono pubblicamente raggiungibili).
