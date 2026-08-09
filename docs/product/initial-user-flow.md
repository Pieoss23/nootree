# Flusso utente iniziale (Milestone 1)

Questo documento descrive cosa un visitatore può effettivamente fare oggi nell'applicazione. Non descrive il flusso finale previsto per il prodotto.

1. **Landing (`/`)** — il visitatore vede il nome del prodotto, una breve descrizione e un pulsante "Accedi".
2. **Login (`/login`)** — l'utente inserisce un'email e invia il form. Il server invoca l'adapter email di sviluppo (`ConsoleEmailProvider`), che logga il messaggio sulla console invece di inviarlo davvero, e la UI mostra un avviso esplicito ("modalità sviluppo"). Non viene creata alcuna sessione: non esiste ancora un percorso per "entrare" davvero nel gestionale via login.
3. **Gestionale (`/app/*`)** — le pagine sotto `/app` sono raggiungibili direttamente (non sono protette da autenticazione in questa milestone) e mostrano i dati dello studio demo popolato dal seed:
   - **Oggi** (`/app`): saluto, nome studio, stato configurazione, stato abbonamento, pazienti attivi con indicatore di utilizzo rispetto al limite di piano, ultimi pazienti inseriti, checklist di onboarding.
   - **Pazienti** (`/app/patients`): tabella dei pazienti demo con ricerca lato client, indicatore di utilizzo del limite. Il pulsante "Nuovo paziente" è disabilitato con tooltip esplicativo.
   - **Team** (`/app/team`): elenco membri (solo l'owner demo), ruolo, stato membership; nota che gli inviti non sono ancora disponibili.
   - **Abbonamento** (`/app/billing`): piano attivo, stato, utilizzo, funzionalità incluse; pulsante Customer Portal disabilitato con tooltip.
   - **Impostazioni** (`/app/settings`): campi di profilo/studio in sola lettura; sezioni preferenze e sicurezza mostrano un messaggio di indisponibilità.

## Cosa manca perché sia un flusso reale

- Nessuna sessione utente: chiunque conosca l'URL vede gli stessi dati demo.
- Nessuna verifica di appartenenza a un tenant (`TenantContext`) — le pagine risolvono sempre il tenant demo seedato.
- Nessuna mutazione: tutte le pagine sono di sola lettura rispetto ai dati di dominio.

Questi punti sono l'oggetto della Milestone 1.1.
