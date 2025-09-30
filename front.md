perfetto — partiamo dalla **roadmap frontend (Android-first)**, senza codice ma con deliverable e criteri di accettazione chiari. L’obiettivo è avere un’APK installabile che scatta la foto, invia e mostra l’esito “è un’offerta?”.

# Roadmap Frontend (Android-first, cross-platform-ready)

## Fase 0 — Scelte & setup (1–2 giorni)

**Obiettivo:** base solida per crescere anche su iOS in seguito.

* **Stack**: scegli una sola opzione:

  * **React Native** (consigliato se vuoi riuso JS/TS).
  * **Flutter** (consigliato se punti a performance UI top).
* **Progetto**: naming, bundleId, minSdk/targetSdk, icona provvisoria, splash.
* **Gestione ambienti**: dev/staging/prod con variabili (endpoint finti per ora).
* **Linting/format + commit hooks**.
  **DoD:** app vuota che si avvia su un device Android reale.

---

## Fase 1 — UX & flussi base (2–3 giorni)

**Obiettivo:** definire l’esperienza minimale.

* **Wireframe 5 schermate**: Onboarding → Fotocamera → Ritaglio/Anteprima → Invio → Risultato (semaforo + dettagli).
* **Permessi**: richiesta *just-in-time* per Camera/Storage.
* **Design tokens**: colori, tipografia, spacing, states (error/success/pending).
  **DoD:** prototipo cliccabile (mock dati locali), nessuna chiamata rete.

---

## Fase 2 — Fotocamera & gestione immagine (3–4 giorni)

**Obiettivo:** scatto robusto su Android.

* **Accesso camera**: autofocus, flash toggle, grid opzionale.
* **Post-scatto**: ritaglio, rotazione, correzione prospettiva semplice.
* **Compressione locale**: target ~1–2 MB, lato lungo max ~1600–2000px.
* **Coda di upload locale**: salva in storage locale “in attesa di invio”.
  **DoD:** scatto → preview → file compresso persistito localmente; test su 2–3 device Android diversi.

---

## Fase 3 — Stato & navigazione (1–2 giorni)

**Obiettivo:** UX reattiva e prevedibile.

* **State management**: store globale (es. Redux/Zustand/Provider).
* **Schermata “Attività”**: elenco ultimi invii (pending/success/failed).
* **Gestione errori**: banner non invasivo + retry.
  **DoD:** navigazione stabile, stati visibili e riproducibili.

---

## Fase 4 — Integrazione API “simulata” (2 giorni)

**Obiettivo:** slegare il client dal backend reale.

* **Client HTTP** astratto + **feature flags** (mock vs real).
* **Contratto**: implementa *placeholder* per:

  * `POST /uploads` (ritorna URL finto)
  * `POST /receipts` (ritorna id/stato finto)
  * `GET /receipts/{id}` (ritorna JSON finto con semaforo e righe)
* **Polling**: intervallo esponenziale, stop a success/timeout.
  **DoD:** flusso end-to-end con mock, tempi e stati realistici.

---

## Fase 5 — UX risultato & accessibilità (2–3 giorni)

**Obiettivo:** chiarezza nel verdetto “offerta?”.

* **Schermata esito**: semaforo (verde/giallo/rosso), prezzo attuale, tuo ultimo prezzo, prezzo medio personale, prezzo per 100 g/1 L.
* **Spiegazioni**: “Perché è rosso?” in 1 riga (evita gergo).
* **Accessibilità**: dimensioni tap ≥ 48dp, labels per screen reader, contrasto AA.
  **DoD:** test di comprensibilità con 2–3 persone non tecniche.

---

## Fase 6 — Performance & resilienza (2 giorni)

**Obiettivo:** esperienza fluida su device medi.

* **Budget**: time-to-interactive < 1s dopo cold start; memoria stabile.
* **Lista storici**: virtualizzazione/flatlist ottimizzata.
* **Gestione rete**: retry con backoff, mappa errori (timeout, 4xx, 5xx).
  **DoD:** profiling su almeno 2 device economici; nessun jank evidente.

---

## Fase 7 — Telemetria & metriche minime (1 giorno)

**Obiettivo:** capire dove migliorare.

* **Eventi**: `photo_taken`, `upload_started`, `upload_succeeded|failed`, `ocr_result_received`, `offer_decision_shown`.
* **Timing**: foto→risultato, upload duration, failure rate.
  **DoD:** eventi visibili in console/log locale o servizio scelto.

---

## Fase 8 — Integrazione backend reale (2–4 giorni)

**Obiettivo:** chiudere il loop vivo.

* **Upload a URL firmato** (`/uploads`) → PUT immagine.
* **Creazione ricevuta** (`/receipts`) → id.
* **Polling stato** (`/receipts/{id}`) fino a `ready|failed`.
* **Gestione auth** (se presente): token/device id.
  **DoD:** APK che funziona contro l’ambiente **staging** reale.

---

## Fase 9 — QA dispositivo & privacy (1–2 giorni)

**Obiettivo:** evitare blocchi in Play Store e problemi su iOS in futuro.

* **Permessi**: testi chiari, negazione gestita (flow alternativo).
* **Privacy screen**: blocca preview in app switcher (se disponibile nello stack scelto).
* **Cache/cleanup**: immagini rimosse dopo invio riuscito (se da policy).
  **DoD:** checklist privacy/permessi spuntata; prova con permessi negati.

---

## Fase 10 — Preparazione rilascio interno (1 giorno)

**Obiettivo:** far testare a pochi utenti reali.

* **Build firmata (Android/internal)**, icone/splash definitive, nome app.
* **Note di test**: scenari da provare, feedback form.
  **DoD:** APK installabile + istruzioni ai tester.

---

## Deliverable chiave (frontend)

* APK **internal testing**.
* **Guida tester** (1 pagina): come usare, cosa aspettarsi, come segnalare bug.
* **Matrice device** usati in test (marca/modello/Android ver.).
* **Elenco eventi analytics** tracciati (nome, payload).

---

## Rischi & contromisure (frontend)

* **Foto troppo pesanti** → compressione lato client + indicazioni in UI (“inquadra bene, luce”).
* **Permesso camera negato** → flow alternativo (seleziona da galleria) + CTA per ri-abilitarlo.
* **Rete scarsa** → coda locale + retry; messaggi chiari di stato.
* **Latenza backend >10s** → UI non blocca; suggerisci “ti notifichiamo appena pronto” (anche solo polling silenzioso sulla schermata Attività).

---

## Prossimi step richiesti al backend (per sbloccarti)

* Endpoint `POST /uploads` per URL firmati (con scadenza).
* Endpoint `POST /receipts` (accoda job) e `GET /receipts/{id}` (stati: `queued|processing|ready|failed`).
* Contratto **stabile** dei campi mostrati a UI: `decision` {`green|yellow|red`}, `current_price`, `last_price`, `avg_price`, `unit_price`, `unit` e una `reason` breve.

---

Se ti va, nel messaggio dopo ti preparo la **roadmap backend** speculare (fasi, deliverable, DoD, rischi) così le due parti si incastrano perfettamente.
