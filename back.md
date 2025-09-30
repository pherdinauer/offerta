perfetto: backend “cervello”, mobile super-leggero.
Ecco una **roadmap di sviluppo backend** completa (senza codice), con fasi, deliverable e criteri di accettazione.

# Roadmap Backend (“È un’offerta?”)

## Fase 0 — Fondamenta e standard

**Obiettivo:** base solida e ripetibile.

* **Scelte tech:** FastAPI (API), Celery + Redis (code/worker), PostgreSQL (DB), S3/MinIO (object storage), Nginx (reverse proxy), Alembic (migrazioni), OpenAPI (contratto), Sentry/Prometheus/Grafana (osservabilità).
* **Repo & CI/CD:** mono-repo o due repo (api, workers); pipeline con build immagini Docker, lint/type-check, test, migrazioni DB automatiche in staging.
* **Ambienti:** `dev` (locale/Compose), `staging`, `prod`. Variabili d’ambiente segregate, secret manager, rotazione chiavi.
  **Deliverable:** progetto Docker Compose avviabile in locale con healthcheck.
  **DoD:** `GET /healthz` e `GET /readyz` verdi; OpenAPI servita a `/docs`.

---

## Fase 1 — Contratto API & schema dati

**Obiettivo:** allineamento definitivo con il mobile.

* **OpenAPI v1** con gli endpoint minimi:

  * `POST /uploads` → presigned URL + `file_key`
  * `POST /receipts` → `{id, status}`
  * `GET /receipts/{id}` → `{status, items[], decision, reasons[]}`
  * `GET /offer-check?ean=&price=&size=&uom=`
  * `GET /products/{id}/history`
  * `GET /me/export` · `DELETE /me/data`
* **Schema DB (Alembic)**

  * `users`
  * `stores`
  * `products` (con `ean`, `brand`, `name_norm`, `package_size_value`, `package_size_uom`)
  * `aliases` (pattern raw → product_id)
  * `receipts` (user, store, timestamp, `file_key`, status)
  * `line_items` (link a receipt, eventuale `product_id`, prezzi/quantità/formato)
  * `price_events` (user, product, store, `unit_price`, `price_per_100g_or_L`, ts)
    **Deliverable:** file OpenAPI versionato + migrazione DB iniziale.
    **DoD:** schema applicato in `staging`; mock server generato dall’OpenAPI gira e risponde.

---

## Fase 2 — Upload sicuro immagini

**Obiettivo:** ricevere immagini senza appesantire l’API.

* **Presigned upload:** `POST /uploads` genera URL PUT S3/MinIO con scadenza breve; limiti MIME e dimensione; antivirus opzionale.
* **Retention policy:** lifecycle bucket (es. cancellazione automatica originale dopo l’elaborazione).
* **Idempotenza:** `client_upload_id` per evitare duplicati in retry.
  **Deliverable:** bucket configurato, regole CORS, SSE (server-side encryption) abilitate.
  **DoD:** upload da client demo → oggetto visibile nel bucket; audit log tracciato.

---

## Fase 3 — Pipeline OCR & parsing (workers)

**Obiettivo:** trasformare un’immagine in righe scontrino strutturate.

* **Coda Celery:** code `ocr` e `postprocess`; retry/backoff; dead-letter.
* **OCR provider:** integrazione SaaS iniziale (affidabilità alta) + driver astratto (facile sostituzione con Tesseract/PaddleOCR).
* **Parsing deterministico:** estrazione riga (descrizione, qty, prezzo, eventuale sconto), detezione `store`/`timestamp`.
* **Normalizzazione unità:** peso/volume → `g`/`ml`; calcolo `€/100g` o `€/L`.
* **Alias & matching:** regole regex/dizionari; `aliases` per sinonimi; flag “ambiguous” se serve conferma barcode in futuro.
  **Deliverable:** job `process_receipt` end-to-end (S3 → OCR → parse → DB).
  **DoD:** un set di scontrini reali di test produce `line_items` coerenti (≥ X% righe correttamente estratte—target interno).

---

## Fase 4 — Motore decisionale “È un’offerta?”

**Obiettivo:** verdetto chiaro, spiegabile.

* **Storico per utente×prodotto:** alimentato da `price_events`.
* **Percentili:** p20/p50/p80 su finestra 6–9 mesi (esclusi outlier grossolani).
* **Regole:**

  * **Verde:** prezzo unitario < p20
  * **Giallo:** entro ±5% di p50
  * **Rosso:** > p50 (o “offerta” ma storico migliore)
* **Shrinkflation guard:** confronto automatico su prezzo unitario se cambia `package_size`.
* **Reason codes:** elenco breve e leggibile (“sotto tuo p20”, “peggiore €/100g rispetto a 2 acquisti fa”).
  **Deliverable:** modulo “decision engine” con test unitari sulle regole.
  **DoD:** `GET /receipts/{id}` ritorna `decision` e `reasons` corretti sui dataset di prova.

---

## Fase 5 — Endpoints GDPR & account

**Obiettivo:** compliance UE + frizione bassa per l’utente.

* **Auth:** passwordless (magic link) o OAuth (Apple/Google) con sessione JWT corta + refresh.
* **Esportazione:** `GET /me/export` (CSV/JSON scaricabile, link firmato).
* **Cancellazione:** `DELETE /me/data` (soft delete + purge immagini).
* **Consensi & registri:** flag consensi, log accessi dati.
  **Deliverable:** policy privacy, DPIA di base, endpoint attivi.
  **DoD:** esportazione e cancellazione funzionano su account di staging.

---

## Fase 6 — Osservabilità & qualità del dato

**Obiettivo:** vedere, capire, correggere.

* **Metriche:**

  * tempo “upload→decisione” (p50/p90)
  * % righe con `product_id` risolto
  * tasso errori OCR per brand/modello telefono (campo `device_hint` opzionale nel `POST /receipts`)
  * costo medio per scontrino (se SaaS OCR) — anche come log aggregabile
* **Traces:** OpenTelemetry su API→coda→worker→DB.
* **Alerting:** SLO di latenza e tassi errore; pagine di runbook.
  **Deliverable:** dashboard Grafana + alert base.
  **DoD:** allarmi scattano su errori simulati; tracce visibili end-to-end.

---

## Fase 7 — Hardening sicurezza

**Obiettivo:** pronto per store review e produzione iniziale.

* **Rate limiting** per IP/user; CORS lock-down; headers di sicurezza; audit log.
* **Validazione contenuti** (MIME sniffing, max megapixel).
* **Encryption:** SSE su bucket; TLS ovunque; rotazione chiavi; backup DB + restore testato.
* **RBAC interno** per strumenti admin (se previsti).
  **Deliverable:** checklist sicurezza compilata; test ripristino backup.
  **DoD:** penetration-style checks base superati; restore DB riuscito.

---

## Fase 8 — Performance & scalabilità

**Obiettivo:** sostenere picchi e crescere.

* **Autoscale workers** in base alla lunghezza coda.
* **Cache Redis** per `offer-check` (barcode “a caldo”).
* **Indice DB:** per `price_events` (user, product, ts), `products.ean`, `aliases`.
* **Batch OCR** per import massivi; limiti di QPS al provider.
  **Deliverable:** profilo risorse per “N scontrini/min”.
  **DoD:** carico sintetico regge gli obiettivi interni senza errori.

---

## Fase 9 — Staging pubblico & checklist release

**Obiettivo:** collaudo con mobile beta.

* **Dati fittizi + reali** (consenso) in staging.
* **Log redaction** (mai PII/raw scontrini in chiaro).
* **Contratto API congelato (v1)**; versionamento semantico.
  **Deliverable:** ambiente `staging` usato dai tester Android; note di rilascio.
  **DoD:** flusso mobile completo funziona su 10–20 tester.

---

## Fase 10 — Cutover produzione & operatività

**Obiettivo:** andare live con serenità.

* **Prod readiness:** domini, TLS, WAF (se disponibile), rotazione credenziali, backup/restore programmati.
* **Runbooks:** incident, throttling OCR, fallback (es. solo `offer-check` barcode se OCR down).
* **Monitoring:** oncall leggero, notifiche canale dedicato.
  **Deliverable:** “operating manual” di 2–3 pagine.
  **DoD:** simulazione incidente superata (OCR provider down → servizio degrada ma resta utile).

---

## Requisiti non-funzionali chiave (riassunto)

* **Latenza utente (target):** foto→verdetto p50 < ~5–7s, p90 < ~10–12s (dipende da rete/OCR).
* **Affidabilità:** retry idempotente, esiti deterministici (niente LLM per i conti).
* **Privacy:** minimizzazione (cancella originale post-OCR o conserva thumbnail offuscata), export/erase 1-click, registri consensi.
* **Portabilità:** API stabile (OpenAPI), feature flags lato server per cambiare logiche senza aggiornare app.

---

## Rischi tipici & contromisure

* **OCR fallisce su scontrini stropicciati:** filtri immagine lato client + guida UI (“riempi quadro”, “luce”) + fallback barcode linking.
* **Descrizioni tronche/criptonimi:** tabella `aliases`, conferma barcode post-hoc, arricchimento con dataset esterni (es. EAN).
* **Sconti a piè di scontrino non mappabili:** marca come “promo totale” o ripartizione pro-quota configurabile; spiega al’utente.
* **Costi OCR SaaS:** soglia volumi → valutare passaggio a PaddleOCR self-host con GPU; togglable via feature flag.
* **Review iOS futura:** privacy labels pronte, niente tracking pubblicitario → niente ATT prompt.

---

## Cosa ti serve dal mobile (contratto minimo)

* `device_hint` (marca/modello opzionale), `client_upload_id` univoco, `store_hint` se nota, `purchased_at` se l’utente lo inserisce.
* Upload via presigned URL (PUT), poi `POST /receipts { file_key, ... }`.
* Polling `GET /receipts/{id}` fino a `ready|failed`.
* Visualizza: `decision`, `reasons`, `current_price`, `last_price`, `avg_price`, `unit_price`, `unit`.

---

Se vuoi, posso trasformare questa roadmap in un **documento di progetto** (indice + sezioni compilate: requisiti funzionali, NFR, API v1, modello dati, SLA interni, sicurezza, DPIA scheletro) così lo condividi subito con chi lavora al mobile o con eventuali partner.
