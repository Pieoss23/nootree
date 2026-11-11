# Decision Log — Milestone 1

Elenco delle decisioni architetturali e operative prese durante la Milestone 1, con motivazione sintetica. Le decisioni estese sono documentate come ADR in `docs/architecture/decisions/`.

---

## 2026-07-31 — Bootstrap da repository vuota

**Decisione**: procedere con inizializzazione completa (Next.js + TypeScript strict + pnpm) poiché la directory di lavoro non conteneva alcun file preesistente.

**Motivazione**: nessun rischio di conflitto o perdita di lavoro pregresso.

**Alternative scartate**: nessuna, non applicabile.

---

## 2026-07-31 — Modular monolith con cartelle a dominio

**Decisione**: adottare la struttura `src/modules/*` per i domini di business (identity, tenancy, memberships, billing, entitlements, patients, audit, notifications), separata da `src/app` (routing) e `src/db` (persistenza).

**Motivazione**: richiesta esplicita della milestone; evita la complessità di microservizi non necessaria in questa fase, mantenendo confini di dominio chiari tramite contratti TypeScript. Vedi ADR 001.

---

## 2026-07-31 — Multi-tenancy a schema condiviso

**Decisione**: un solo schema PostgreSQL condiviso tra tutti i tenant, con colonna `tenantId` su ogni tabella tenant-owned, invece di schema-per-tenant o database-per-tenant.

**Motivazione**: minor complessità operativa per una fase iniziale, compatibile con la scala attesa; l'isolamento è garantito a livello applicativo tramite firma delle query (`{ tenantId, ... }`). Vedi ADR 002.

---

## 2026-07-31 — Drizzle ORM + PostgreSQL

**Decisione**: Drizzle ORM con Drizzle Kit per le migrazioni versionate, driver `postgres` (postgres-js).

**Motivazione**: tipizzazione end-to-end, migrazioni SQL esplicite e ispezionabili, nessun magic sync distruttivo in produzione. Vedi ADR 003.

---

## 2026-07-31 — Adapter pattern per provider esterni

**Decisione**: Auth.js, Resend e Stripe non sono referenziati direttamente dai moduli di dominio; ogni modulo espone un'interfaccia (`IdentityService`, `EmailProvider`, `BillingProvider`) con implementazione concreta iniettata nell'infrastruttura.

**Motivazione**: consente di predisporre i confini senza implementare integralmente i flussi reali (fuori scope Milestone 1), e mantiene il dominio testabile e indipendente dal provider. Vedi ADR 004.

---

## 2026-08-09 — Auth.js v5 (beta) con sessioni database-backed, solo provider email

**Decisione**: implementare `IdentityService` con `next-auth@5.0.0-beta.32` + `@auth/drizzle-adapter`, sessioni `strategy: "database"`, unico provider `Nodemailer` (id `"email"`) per il magic-link. Il file di configurazione vive in `src/lib/auth.ts` (infrastruttura, non modulo di dominio), seguendo lo stesso pattern di `src/db/client.ts`.

**Motivazione**: `next-auth@4` (dist-tag `latest`) non supporta bene l'App Router; la v5 beta dichiara esplicitamente supporto per `next ^16.0.0` ed è l'API pensata per Route Handler/Server Function/Proxy di questa versione di Next.js. Le tabelle `users`/`sessions`/`verification_tokens` erano già shape-compatibili (serviva solo rinominare alcune proprietà JS, non le colonne — vedi execution-log). La tabella `accounts` resta invariata perché il flusso solo-email di Auth.js non la usa mai (nessuna chiamata a `linkAccount`/`getUserByAccount` per `type: "email"`); verrà riallineata alla convenzione OAuth di Auth.js quando servirà un vero provider OAuth.

**Alternative scartate**:

- `next-auth@4` (stabile): API pre-App-Router, richiederebbe un `SessionProvider` client-side e non si integra con la nuova convenzione `proxy.ts`.
- Sessioni JWT: avrebbero permesso l'uso di Proxy in Edge runtime, ma questa versione di Next.js fa girare Proxy su Node.js runtime di default, quindi l'accesso al database in `proxy.ts` è già disponibile — le sessioni database-backed restano più semplici da revocare (sign-out reale, non solo scadenza del cookie).

---

## 2026-08-09 — Protezione delle rotte `/app/*` tramite `proxy.ts`, non `middleware.ts`

**Decisione**: usare la nuova convenzione `proxy.ts` (root di `src/`) con `export { auth as proxy }` e la callback `authorized` di Auth.js per proteggere `/app/*`.

**Motivazione**: `middleware.ts` è deprecato in questa versione di Next.js e rinominato `proxy.ts` (vedi `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`); usare il nome deprecato avrebbe significato codice morto (Next.js non lo eseguirebbe più).

---

## 2026-08-09 — CRUD pazienti: archiviazione invece di cancellazione fisica

**Decisione**: "cancellazione" paziente è implementata come cambio di stato (`ACTIVE` → `ARCHIVED`, con `archivedAt` valorizzato), reversibile, non come `DELETE` SQL.

**Motivazione**: lo schema (`src/db/schema/patients.ts`) prevedeva già `patient_status` enum e `archivedAt` proprio per questo; dati anagrafici/clinici non vanno mai persi per un click accidentale, e l'audit trail (`recordAuditEvent`) ha senso solo se la riga a cui si riferisce continua a esistere. Una vera cancellazione fisica non è mai stata nello scope discusso.

**Alternative scartate**: `DELETE` reale con soft-delete via colonna `deletedAt` separata — ridondante, lo schema aveva già uno stato pensato per questo (`ARCHIVED`).

---

## 2026-08-09 — UI dei pazienti spostata da `src/modules/patients/` a `src/app/(app)/app/patients/`

**Decisione**: `patients-table.tsx` (esistente, sola lettura) è stato spostato dal modulo alla route, insieme ai nuovi `patient-form-dialog.tsx` e `patients-page-client.tsx`.

**Motivazione**: la tabella ora richiama direttamente le server action della pagina (`./actions`) per aprire il dialog di modifica e per archiviare/riattivare; tenerla dentro `src/modules/patients/` avrebbe fatto dipendere il modulo di dominio da `src/app/*`, invertendo la separazione dichiarata in `docs/architecture/project-structure.md` (`src/modules/*` = dominio, `src/app` = routing). Il modulo resta con solo tipi, repository e validazione.

---

## 2026-08-09 — Validazione con `noValidate` sul form + Zod lato server come unica fonte di verità

**Decisione**: il form paziente ha l'attributo `noValidate`; tutta la validazione (incluso il formato email) passa da `patientFormSchema` (Zod) eseguito nella server action, con gli errori per campo rimandati al client e mostrati inline.

**Motivazione**: senza `noValidate`, la validazione nativa del browser su `<input type="email">` impediva l'invio del form per email non valide, quindi il percorso di errore lato server non era mai raggiungibile (scoperto scrivendo il test Playwright corrispondente — vedi `docs/audit/execution-log.md`). Con un'unica fonte di verità gli errori mostrati sono sempre coerenti con quanto verrà effettivamente salvato.

---

## 2026-08-09 — "Tenant attivo" = membership più vecchia, nessuno switch tenant

**Decisione**: `tenantResolver.resolveActiveTenant(user)` sceglie la membership `ACTIVE` con `createdAt` minore, quando un utente ne ha più di una. Non esiste un cookie/parametro per scegliere quale tenant è "attivo".

**Motivazione**: questa milestone non ha (ed esplicitamente non include, vedi `docs/product/milestone-01-scope.md`) inviti al team o un'interfaccia di switch tenant, quindi ogni utente demo ha al più una membership. Una scelta deterministica e semplice è corretta finché non serve altro, ed è testata (`db.integration.test.ts`) così il comportamento è esplicito, non un effetto collaterale dell'ordine delle righe in DB.

**Alternative scartate**: cookie/query param per il tenant attivo — prematuro senza UI per impostarlo, e un `tenantId` lato client andrebbe comunque riverificato con `membershipChecker.verifyMembership` prima di fidarsene (vedi `docs/security/tenant-isolation-rules.md`).

---

## 2026-08-09 — `getActiveTenant()` come Data Access Layer condivisa, con `React.cache()`

**Decisione**: invece di far chiamare `authIdentityService` + `tenantResolver` separatamente a ogni pagina/azione, `src/lib/active-tenant.ts` espone un'unica `getActiveTenant()` cached con `React.cache()`.

**Motivazione**: ogni pagina `(app)` e il layout devono risolvere lo stesso tenant per la stessa richiesta; senza `cache()`, ognuna rifarebbe la query di sessione e quella di membership. `React.cache()` deduplica entro lo stesso render pass senza bisogno di prop-drilling o Context (che comunque non funzionerebbe nei Server Component). Pattern raccomandato esplicitamente da questa versione di Next.js per la Data Access Layer di autenticazione/autorizzazione (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`). La cache non attraversa le Server Action: ogni scrittura riverifica sessione e membership da zero, come deve essere per un'operazione che muta dati.

---

## 2026-08-09 — Selezione del provider email a runtime (`getEmailProvider`), fail loud in produzione

**Decisione**: `getEmailProvider(env)` (`src/modules/notifications/email-provider-factory.ts`) sceglie `ResendEmailProvider` quando `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sono entrambe presenti, altrimenti `ConsoleEmailProvider` — tranne quando `NODE_ENV === "production"`, dove l'assenza di configurazione Resend lancia un errore invece di ripiegare silenziosamente su Console. La funzione prende `env` come parametro invece di importare il singleton `@/config/env`, seguendo lo stesso pattern di `validateServerEnv`.

**Motivazione**: `ConsoleEmailProvider` non deve mai essere usato in produzione (vedi il suo stesso commento e `docs/architecture/authentication-boundary.md`); un semplice `if (RESEND_API_KEY) ... else Console` senza il caso produzione avrebbe permesso a un deploy mal configurato di "funzionare" silenziosamente senza mai inviare email. Prendere `env` come parametro rende la logica di selezione testabile in isolamento (`email-provider-factory.test.ts`) senza dover impostare/mockare variabili d'ambiente reali.

**Verifica**: testato con una chiave Resend fittizia (selezione del provider corretto in dev/prod, errore in produzione senza configurazione) — **non testato con una chiave Resend reale**, non disponibile in questo ambiente. Vedi `docs/audit/open-risks.md`.

---

## 2026-08-09 — Anagrafica clinica pazienti + misurazioni: `numeric` invece del pattern "centesimi interi"

**Decisione**: le colonne antropometriche/BIA di `patient_measurements` (peso, altezza, circonferenze, massa grassa/magra, acqua corporea, angolo di fase) usano Postgres `numeric(precisione, scala, { mode: "number" })` — non il pattern "integer in unità minima" (es. grammi) usato per i soldi in `billing.ts`.

**Motivazione**: il pattern "centesimi interi" per i soldi esiste per fare aritmetica esatta (somme, moltiplicazioni) senza errori di arrotondamento float — ma le misurazioni non vengono mai sommate o moltiplicate in questa milestone, solo mostrate e (in futuro) graficate. `numeric` con `mode: "number"` (confermato nei type declaration di `drizzle-orm`) memorizza il valore decimale esatto in Postgres e lo restituisce come `number` JS nativo in lettura, senza dover inventare unità minime diverse per ogni campo (grammi per il peso, decimi di grado per l'angolo di fase, ecc.), che avrebbe reso il codice più complesso senza un reale beneficio in questo caso d'uso.

**Alternative scartate**: integer in unità minima (come i soldi) — scartato perché aggiunge complessità (conversioni per ogni campo) senza il vantaggio che ha per i soldi (nessuna somma/moltiplicazione da proteggere da errori di arrotondamento).

---

## 2026-08-09 — Consenso dati sanitari (GDPR art. 9): preservato, non ricalcolato ad ogni salvataggio

**Decisione**: `healthDataConsentAt` (timestamp nullable su `patients`) viene impostato a `new Date()` solo quando la checkbox passa da non spuntata a spuntata; se era già spuntata (consenso preesistente), il valore esistente viene preservato passandolo tramite un campo hidden nel form (`existingConsentAt`), letto dalla riga paziente già in memoria sulla pagina di dettaglio — nessuna query aggiuntiva. Se la checkbox viene tolta, il valore torna a `null` (revocato).

**Motivazione**: il timestamp deve significare "quando il paziente ha dato il consenso", non "quando questo form è stato salvato l'ultima volta". Ricalcolarlo a `now()` ad ogni save con la checkbox spuntata (alternativa più semplice da implementare, senza bisogno del campo hidden) avrebbe reso il dato fuorviante — ogni modifica non correlata alle allergie o all'obiettivo avrebbe silenziosamente spostato in avanti la data di un consenso mai rinnovato davvero.

**Alternative scartate**: rileggere la riga paziente nella server action prima di scrivere, invece di passare il valore preesistente via campo hidden — evitato per mantenere `updatePatientClinicalInfo` strutturalmente identica a `updatePatient` (nessuna query di lettura nel percorso di scrittura). Accettato il compromesso che un campo hidden è manipolabile lato client: l'attore qui è personale dello studio già autenticato e autorizzato (stesso confine di fiducia di ogni altro campo del form, es. `internalNotes`), non il paziente stesso — non un caso di tamper-proofing verso un attore non fidato.

---

## 2026-08-09 — Misurazioni pazienti: aggiunta ed eliminazione, non modifica

**Decisione**: `patient_measurements` espone `createMeasurement`/`deleteMeasurement` ma non un `updateMeasurement`. Una pesata inserita per errore si cancella (hard delete) e si reinserisce.

**Motivazione**: a differenza dei pazienti (dove l'archiviazione preserva un'anagrafica che ha valore anche disattivata), una misurazione è una riga di log inserita a mano — l'eliminazione e reinserimento è più semplice di un endpoint di modifica con la stessa validazione di quello di creazione, e non c'è un requisito di audit trail sul valore precedente in questa milestone (a differenza del consenso GDPR, dove la data conta).

**Alternative scartate**: endpoint di modifica in-place — scartato per ora come complessità non giustificata dal caso d'uso; annotato in `docs/audit/open-risks.md` come scelta esplicita, da rivedere se emerge un bisogno reale di preservare lo storico delle correzioni.

---

## 2026-08-09 — Autorizzazione per ruolo: stessa soglia (`ASSISTANT`) per tutte le scritture pazienti

**Decisione**: `createPatientAction`/`updatePatientAction`/`setPatientStatusAction` richiedono `assertRole(tenant.role, "ASSISTANT")` — poiché `ASSISTANT` è il rank minimo esistente, questo equivale in pratica a "qualunque membership attiva può scrivere sui pazienti", identico al comportamento precedente. La differenza è che ora è un controllo esplicito e testato (`src/modules/memberships/authorization.ts`), non un'assenza di controllo.

**Motivazione**: richiesta esplicitamente all'utente prima di implementare (non derivabile dal dominio: nessun documento di prodotto definiva permessi differenziati tra `OWNER`/`NUTRITIONIST`/`ASSISTANT`). L'utente ha confermato nessuna differenziazione per i pazienti in questa milestone. Il pattern (`assertRole`/`InsufficientRoleError`, stesso stile di `assertFeature`/`assertWithinLimit` in entitlements) resta pronto per azioni future che dovranno usare soglie più alte (es. gestione team, quando sarà implementata).

**Alternative scartate**: `ASSISTANT`+ solo su create/update e `NUTRITIONIST`+ su archive/reactivate — proposta come opzione ma non scelta; `NUTRITIONIST`+ per tutto (accesso di sola lettura per `ASSISTANT`) — proposta ma non scelta.

**Fuori scope, registrato come rischio**: un ruolo "superuser" cross-tenant per amministrare tutti gli studi da un unico account, richiesto dall'utente durante questa conversazione. Non è modellabile come `membership.role` (quelli sono per-tenant); richiede un flag/enum a livello piattaforma su `users`, separato, con proprio ADR — vedi `docs/audit/open-risks.md`.

---

## 2026-08-10 — Catalogo prodotti: nessuna API di terze parti a pagamento, scope minimo + prodotti custom per tenant

**Decisione**: il catalogo alimenti (`foodItems`) è una tabella seedata a mano con dati nutrizionali comuni/rappresentativi (~60 alimenti), non un import bulk della tabella ufficiale CREA/BDA né un'integrazione a pagamento (Edamam/FatSecret/Nutritionix). Scope scelto esplicitamente dall'utente tra 4 alternative proposte: catalogo minimo + prodotti personalizzati per tenant (`tenantProducts`), **senza** lookup live su Open Food Facts.

**Motivazione**: CREA/BDA (la tabella di riferimento per i nutrizionisti italiani) non ha un import bulk scaricabile — qualunque scelta in questa milestone doveva comunque partire da un seed curato, non dalla tabella ufficiale verbatim. Le API commerciali sono tarate su prodotti confezionati/branded USA, non sul dato di composizione professionale che serve a un nutrizionista, e comportano un costo ricorrente non giustificato prima che ci sia un cliente pagante che lo richieda esplicitamente. Vedi anche la ricerca del 2026-08-09 registrata in memoria di progetto (CREA/BDA senza API, Open Food Facts gratuita ma orientata al branded, USDA US-centrica, Edamam/FatSecret commerciali).

**Alternative scartate**: lookup live su Open Food Facts (gratuito, ma introduce gestione di rete/errori verso un servizio esterno non ancora necessaria); un'API commerciale a pagamento (costo ricorrente ingiustificato senza domanda validata); import bulk CREA reale (nessun dataset strutturato scaricabile disponibile in questa sessione).

**Da rivedere se**: emerge una richiesta validata da clienti paganti per capacità che il catalogo locale non copre (es. scanner barcode, copertura branded massiccia) — a quel punto una API a pagamento diventa una decisione di scala, non di bootstrap.

---

## 2026-08-10 — `foodItems` senza `tenantId`: unica tabella "business" a schema condiviso reale

**Decisione**: `food_items` non ha colonna `tenantId` — a differenza di ogni altra tabella tenant-owned dello schema (`patients`, `tenant_products`, ...), è dato di riferimento condiviso tra tutti gli studi, letto ma mai scritto da un singolo tenant.

**Motivazione**: un valore nutrizionale (es. "100g di pasta = 358 kcal") non varia per studio — duplicarlo per tenant avrebbe significato N copie identiche dello stesso dato, senza alcun beneficio di isolamento (non è un dato sensibile né specifico di un cliente). `tenant_products` resta invece scoped a `tenantId`, perché lì il contenuto (una ricetta interna dello studio) è realmente specifico del singolo tenant. Nessun rischio di isolamento multi-tenant qui: non essendoci scritture da parte dei tenant su questa tabella, non si applica `docs/security/tenant-isolation-rules.md` (che riguarda l'isolamento delle scritture/letture per-tenant).

---

## 2026-08-10 — `products.catalog` come feature/limite in tutti i piani, stessa soglia di ruolo dei pazienti

**Decisione**: `FEATURE_KEYS.PRODUCTS_CATALOG` (`"products.catalog"`) è incluso in tutti e tre i piani (`STARTER`/`PROFESSIONAL`/`STUDIO`), con un nuovo limite `customProducts` (50/300/illimitato). Le scritture su `tenantProducts` richiedono `assertRole(tenant.role, "ASSISTANT")`, identico a `patients`.

**Motivazione**: coerenza con la decisione già presa per i pazienti (nessuna differenziazione di ruolo ancora richiesta per questo dominio) e con il pattern `assertFeature`/`assertWithinLimit` già stabilito in `entitlements`. Il catalogo condiviso (`foodItems`) non ha invece alcun controllo di piano/limite, essendo sola lettura e non un consumo di risorsa per tenant.

---

## 2026-08-10 — Ricette + dosaggio consigliato per paziente: formula standard con priorità al BMR misurato, intensità dieta a tre livelli

**Decisione**: richiesta dall'utente una sezione ricette (composte da ingredienti del catalogo/prodotti tenant) con un dosaggio consigliato per paziente basato su dieta e caratteristiche fisiche. Alla domanda su come calcolarlo, sono state proposte 3 opzioni (solo se BMR misurato / stima sempre disponibile con formula standard / solo assistivo senza calcolo automatico); l'utente ha scelto un ibrido: **preferire sempre il BMR misurato da bilancia BIA quando presente, altrimenti stimarlo con la formula Mifflin-St Jeor** (richiede il nuovo campo `sex` su `patients`, non esistente prima), più **tre livelli di intensità dieta (LIGHT/MEDIUM/HARD)** che modulano il deficit/surplus calorico applicato quando l'obiettivo è dimagrimento/aumento massa.

**Implementazione** (`src/modules/recipes/dosage.ts`, puro, nessun accesso a DB):

1. BMR: usa `patient_measurements.basalMetabolicRateKcal` dell'ultima misurazione se presente; altrimenti stima con Mifflin-St Jeor (richiede `sex`, età da `birthDate`, peso/altezza dall'ultima misurazione) — se anche questi mancano, ritorna `insufficient_data` con l'elenco esatto di cosa manca, mai un valore indovinato.
2. TDEE = BMR × fattore di attività standard (`SEDENTARY 1.2 / LIGHT 1.375 / MODERATE 1.55 / INTENSE 1.725`) — richiede `activityLevel` impostato, altrimenti `insufficient_data`.
3. Target giornaliero = TDEE, salvo `nutritionGoal` `WEIGHT_LOSS`/`WEIGHT_GAIN`: in quel caso si applica un delta fisso in kcal in base a `dietIntensity` (`LIGHT 250 / MEDIUM 500 / HARD 750`, valori indicativi comuni in pratica nutrizionistica, non un parametro clinico validato — regolabili). Nessun obiettivo impostato = trattato come mantenimento; obiettivo di perdita/aumento senza intensità impostata = default `MEDIUM`.
4. Porzione consigliata per una ricetta = quota fissa del target giornaliero (`DEFAULT_MEAL_KCAL_FRACTION = 0.3`, assunzione "un pasto principale" — non esiste un concetto di slot pasto nel dominio) divisa per la densità calorica della ricetta.

**Motivazione**: l'utente ha esplicitamente richiesto la stima automatica anche in assenza di BMR misurato ("formula standard e in caso BMR, a scelta in base al paziente"), scartando l'opzione più conservativa (solo assistivo). Preferire sempre il BMR misurato quando disponibile perché più affidabile di qualunque formula. Restituire `insufficient_data` invece di un default silenzioso quando mancano dati clinici (sesso, età, peso, altezza, attività) evita di mostrare un numero clinicamente fuorviante spacciato per un calcolo reale.

**Non vincolante per design**: `suggestedPortionGrams` è solo uno snapshot mostrato/precompilato nel form di assegnazione (`assign-recipe-dialog.tsx`) — il valore effettivamente salvato (`portionGrams`) è sempre quello confermato dal nutrizionista, mai imposto automaticamente. Scelta guidata da prudenza clinica/di responsabilità, coerente con l'opzione "assistivo" anche se non quella scelta come unica modalità.

**Alternative scartate**: le altre due opzioni proposte (solo BMR misurato senza stima; nessun calcolo automatico) — l'utente ha scelto esplicitamente l'ibrido. Un concetto di "slot pasto" (colazione/pranzo/cena) con percentuali diverse per slot — non richiesto, avrebbe aggiunto un campo/decisione di prodotto in più senza indicazione dell'utente; il fattore fisso al 30% resta un'assunzione singola, documentata e facilmente parametrizzabile in futuro.

---

## 2026-08-10 — Vincolo "esattamente una fonte" su `recipe_ingredients` imposto a livello DB, non solo applicativo

**Decisione**: `recipe_ingredients` ha due colonne FK nullable (`foodItemId`, `tenantProductId`) invece di un vero riferimento polimorfico (che Postgres non supporta nativamente); un `CHECK` a livello database (`recipe_ingredients_single_source`) impone che sia valorizzata esattamente una delle due, mai entrambe né nessuna.

**Motivazione**: coerente con lo stile del resto dello schema (enum invece di stringhe libere, unique constraint invece di verifiche solo applicative — vedi patients.ts) di far imporre gli invarianti strutturali al database quando possibile, non solo alla validazione Zod lato server action. Verificato con un test di integrazione dedicato (inserimento con entrambe le colonne valorizzate o nessuna delle due, in entrambi i casi la query fallisce).

**Alternative scartate**: una tabella `ingredient_sources` di lookup con `sourceType`/`sourceId` senza FK reali (perderebbe l'integrità referenziale su entrambe le fonti); nessun vincolo DB, solo Zod (avrebbe permesso righe incoerenti da un accesso diretto al DB, es. script di migrazione futuri).

---

## 2026-08-10 — Attivata la feature placeholder `future.nutritionPlans` → `nutrition.plans`

**Decisione**: `FEATURE_KEYS.FUTURE_NUTRITION_PLANS` (`"future.nutritionPlans"`, mai incluso in alcun piano, descritto come "in arrivo") è stato rinominato `NUTRITION_PLANS` (`"nutrition.plans"`) e reso una feature reale inclusa in tutti e tre i piani, usata da `assignRecipeToPatientAction`. Aggiunta separatamente `recipes.management` per la gestione del catalogo ricette dello studio (CRUD ricette/ingredienti).

**Motivazione**: il placeholder esistente in `src/config/plans.ts` descriveva esattamente questa funzionalità ("Creazione piani alimentari — non ancora disponibile"); riutilizzarlo invece di introdurre una chiave ridondante mantiene `config/plans.ts` come fonte unica di verità coerente con l'intento originale. Rinominare la stringa chiave (non solo la costante TypeScript) è stato sicuro perché non esistono dati di produzione — solo il seed di sviluppo, rigenerato ad ogni `pnpm db:seed`.

---

## 2026-08-10 — Warning "uncontrolled Select/Checkbox" di Base UI: remount via `key={patient.updatedAt}`, non componenti controllati

**Decisione**: segnalato dall'utente in console del browser ("A component is changing the default value/checked state of an uncontrolled Select/Checkbox after being initialized"), su `patient-form-dialog.tsx` (Select sesso) e `clinical-info-form-dialog.tsx` (Select obiettivo/attività/intensità dieta, Checkbox consenso GDPR). Corretto aggiungendo `key={patient.updatedAt.toISOString()}` (o `?? "create"`/`"new"` quando `patient` è assente) al `<form>` di entrambi i dialog, invece di convertire i campi in componenti controllati come suggerito dal messaggio di Base UI.

**Causa**: questi dialog restano montati in permanenza (nascosti, non smontati, quando chiusi — vivono dentro `PatientRowActions`/`ClinicalInfoSection` che ricevono sempre il `patient` più recente dal Server Component). Dopo un salvataggio riuscito, `revalidatePath` fa rifluire un `patient` aggiornato (es. `healthDataConsentAt` ora valorizzato, o un nuovo `nutritionGoal`) nella stessa istanza già montata — Base UI intercetta questo come "il `defaultValue`/`defaultChecked` è cambiato su un componente già inizializzato" e avvisa in console, perché un valore di default per definizione dovrebbe contare solo al primo mount.

**Motivazione della scelta (remount vs controllato)**: la milestone precedente aveva già deciso esplicitamente per form non controllati con Zod lato server come unica fonte di verità (vedi voce "Validazione con `noValidate`..." sopra); convertire Select/Checkbox in componenti controllati avrebbe introdotto stato locale React proprio dove il progetto lo evita deliberatamente. `updatedAt` cambia esattamente quando (e solo quando) la riga paziente viene realmente aggiornata, quindi è un fingerprint naturale e già esistente per forzare un remount con `defaultValue`/`defaultChecked` corretti, senza introdurre alcun nuovo stato.

**Verifica**: nessun warning "Base UI" nel log del browser durante `tests-e2e/patient-detail.spec.ts` (che modifica sia il checkbox di consenso sia il campo attività fisica e salva), prima presente. `pnpm check` (115/115 test) verde.

---

## 2026-08-14 — Superuser cross-tenant: accesso diretto (no impersonazione), assegnazione solo manuale

**Decisione**: chiude il rischio "superuser cross-tenant non progettato" (vedi voce 2026-08-09 sopra). Implementato `users.platformRole` (`USER`/`SUPERUSER`, indipendente da `memberships.role`) + `src/modules/platform/` (`requireSuperuser()`, `assertPlatformRole`, `admin-repository.ts`) + rotta `/admin` (sorella di `(app)/app`, non annidata). Alla domanda diretta su due scelte di design, l'utente ha optato per: **accesso diretto** (le query admin bypassano il filtro `tenantId` direttamente, es. `listAllTenants()`) invece di un modello di **impersonazione** (il superuser "entra" in un tenant e agisce come se fosse membro); **assegnazione solo manuale via DB/seed**, nessuna UI self-service di promozione. Vedi [ADR 005](../architecture/decisions/005-platform-superuser-role.md) per il dettaglio completo, incluse le alternative scartate.

**Motivazione**: l'accesso diretto è più semplice da ragionare e da auditare (una query, un audit event) di un modello di impersonazione che richiederebbe un secondo percorso per costruire un `TenantContext` "preso in prestito". L'assegnazione manuale minimizza la superficie d'attacco di un ruolo che per definizione bypassa il confine di sicurezza principale dell'app, finché non emerge un bisogno reale di gestirla da UI.

**Perimetro di questo taglio**: solo una vista di sola lettura su tenant/utenti (dati non sanitari) — `listAllTenants()`/`listAllUsers()`. Una vista cross-tenant su dati clinici (es. tutti i pazienti di tutti gli studi), pur nell'esempio iniziale dell'utente di "accesso diretto", è stata deliberatamente rimandata: stesso pattern architetturale, ma comporta esposizione di dati sanitari reali (GDPR) e merita un via libera esplicito a sé — registrato in `docs/audit/open-risks.md`, non implementato silenziosamente come fuori scope.

---

## 2026-08-14/15 — Agenda/calendario appuntamenti: solo staff, nessun controllo automatico di sovrapposizione, navigazione via query param

**Decisione**: prossimo step scelto dall'utente dopo il superuser cross-tenant. Scope chiarito con domande dirette prima di progettare: (1) **solo lo staff dello studio crea/gestisce appuntamenti**, nessun self-booking pubblico in questo step; (2) **tre viste** — agenda/lista, griglia settimanale a ore, griglia mensile — l'utente ha confermato esplicitamente di volere anche la griglia settimanale pur sapendo che è la più complessa e senza precedenti nel codebase, scartando una versione ridotta a sole agenda+mese; (3) **nessun controllo automatico di sovrapposizione oraria** (lo studio si organizza da sé, il sistema registra comunque l'appuntamento), ma la griglia settimanale deve _affiancare visivamente_ due appuntamenti sovrapposti invece di sovrapporli graficamente; (4) **nessun promemoria email** in questo step, per evitare di introdurre job schedulati/cron non ancora esistenti nel progetto. Riproposto il placeholder preesistente `FUTURE_APPOINTMENTS` (`"future.appointments"`) → `APPOINTMENTS_MANAGEMENT` (`"appointments.management"`), stesso pattern già usato per `nutrition.plans` (2026-08-10).

**Motivazione**: nessuna nuova dipendenza esterna per la griglia settimanale — CSS grid/flex e math pura (`packAppointmentsIntoLanes` in `src/modules/appointments/calendar.ts`, funzione pura testata separatamente), coerente con lo stile "niente libreria quando la logica è circoscritta e testabile" già seguito nel resto del progetto. Navigazione tra viste via query param (`?view=&date=`) invece di fetch client-side, per restare coerenti con il resto dell'app (100% Server Component + Server Action + `revalidatePath`, nessun fetch client-side esistente altrove) — il costo è un round-trip per ogni cambio vista/data, accettabile alla scala di uno studio nutrizionale.

**Bug scoperto durante la verifica e2e (2026-08-15)**: `assertFeature` risolve le entitlement dalla tabella `tenant_entitlements` (popolata da `PLAN_DEFINITIONS` via upsert idempotente in `seed-core.ts`), non da `src/config/plans.ts` letto a runtime — dopo aver aggiunto `APPOINTMENTS_MANAGEMENT` a tutti i piani il tenant demo continuava a non avercela finché non si è rieseguito `pnpm db:seed`. Non un difetto del codice (il seed è corretto e idempotente), ma un passo mancante nel flusso "modifica un piano → riesegui il seed" — da tenere a mente per qualunque futura modifica a `plans.ts` su un DB dev già popolato.

**Rischi accettati**: nessun controllo di sovrapposizione, nessun promemoria email — entrambi scelte esplicite dell'utente per questo step, non debito tecnico. Vedi `docs/audit/open-risks.md`.
