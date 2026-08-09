# Initial Threat Model (Milestone 1)

Modello di minaccia iniziale, limitato a ciò che esiste in questa milestone. Non è un'analisi completa e non costituisce una dichiarazione di conformità (GDPR o altro).

## Asset

- Dati anagrafici pazienti (minimi in questa milestone: nome, cognome, email/telefono opzionali — nessun dato clinico).
- Credenziali/sessioni utente (non ancora implementate).
- Dati di fatturazione (in questa milestone: solo dati demo, nessun dato reale di pagamento).
- Variabili d'ambiente / segreti (`AUTH_SECRET`, chiavi Stripe/Resend quando configurate).

## Minacce considerate e mitigazioni attuali

| Minaccia                                                              | Stato in questa milestone                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accesso cross-tenant ai dati (un utente vede dati di un altro studio) | Mitigata a livello di query (`{ tenantId, ... }` sempre esplicito), verificata da test di integrazione. **Non ancora mitigata a livello applicativo di autorizzazione**, perché non esiste ancora sessione/tenant resolution reale — le pagine sono pubblicamente raggiungibili. |
| Injection SQL                                                         | Basso rischio: tutte le query passano da Drizzle (query builder parametrizzato), nessuna concatenazione di stringhe SQL con input utente.                                                                                                                                        |
| XSS                                                                   | Nessun uso di `dangerouslySetInnerHTML`; React esegue l'escaping di default.                                                                                                                                                                                                     |
| Esposizione di segreti nel bundle client                              | Mitigata da `env.ts` (`import "server-only"`) e da `env.client.ts` che espone solo variabili `NEXT_PUBLIC_*`.                                                                                                                                                                    |
| Esposizione di stack trace/dettagli interni all'utente                | `error.tsx`/`global-error.tsx` mostrano messaggi generici; `/api/health` non espone connection string, versioni o stack trace.                                                                                                                                                   |
| Log di segreti                                                        | `src/lib/logger.ts` documenta esplicitamente di non passare segreti come contesto; nessun logging di `DATABASE_URL` o chiavi.                                                                                                                                                    |
| Idempotenza webhook (replay/duplicati)                                | Vincolo di unicità `(provider, providerEventId)` su `webhook_events`, verificato da test — ma nessun handler webhook esiste ancora.                                                                                                                                              |

## Rischi aperti (non mitigati in questa milestone)

- **Nessuna autenticazione reale**: `/app/*` non è protetta. Accettabile solo perché non ci sono dati reali (solo seed di sviluppo) e il deployment non è pubblico. Da chiudere in Milestone 1.1 prima di qualsiasi esposizione pubblica.
- **Nessuna autorizzazione basata su ruolo**: `roleAtLeast`/`getRoleRank` esistono ma non sono ancora applicati a nessuna azione.
- **Rate limiting**: assente. Da considerare quando esisteranno endpoint di autenticazione reali (rischio di enumerazione/brute force sul flusso magic-link).
- **CSRF**: le server action di Next.js hanno protezioni built-in per le mutazioni da form; da rivalutare quando si aggiungeranno API route con side-effect.

Vedi anche [tenant-isolation-rules.md](./tenant-isolation-rules.md) per il dettaglio delle regole di isolamento tenant.
