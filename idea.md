Perfetto. Qui hai un **brief unico e operativo** da dare a Cursor, già aggiornato con **PaddleOCR** come motore OCR (self-host). È scritto per essere incollato e tradotto in task/ticket. Niente codice, solo istruzioni eseguibili.

---

# 0) Contesto sintetico (vision)

“È un’offerta?”: app mobile Android (poi iOS) che scatta la foto dello scontrino → backend elabora (OCR con **PaddleOCR**), estrae righe prodotto, normalizza unità/formati, calcola **prezzo unitario** e confronta con lo **storico personale** → restituisce un **semaforo** (verde/giallo/rosso) con **motivo**.

---

# 1) Stack & architettura di riferimento

* **Frontend mobile**: Android-first (RN/Flutter/nativo — *non rilevante per questo brief*). L’app fa: scatto, upload, polling risultato.
* **API**: **FastAPI (Python)**.
* **Worker async**: **Celery + Redis**.
* **DB**: **PostgreSQL**.
* **Object storage**: **S3/MinIO** (upload con URL firmati).
* **OCR**: **PaddleOCR** (container dedicato; driver astratto lato worker).
* **Observability**: Sentry (errori), Prometheus/Grafana (metriche), OpenTelemetry (tracing).
* **Infra dev**: Docker Compose (api, worker, redis, postgres, minio, nginx, paddleocr).

---

# 2) User stories MVP (con criteri di accettazione)

1. **Scatto & upload**

   * L’utente scatta una foto e la invia.
   * **Accettazione**: compressione lato client ≤ 2 MB; upload via URL firmato; retry idempotente.

2. **Esito “È un’offerta?”**

   * L’utente vede semaforo + prezzo unitario + ultimo prezzo + media personale + motivi.
   * **Accettazione**: latenza p50 ≤ 7s dal tap “Invia” (rete permettendo).

3. **Storico personale**

   * L’utente vede ultimi prezzi e media per articolo.
   * **Accettazione**: valori in **€/100g** o **€/L**, coerenti tra acquisti.

4. **GDPR base**

   * L’utente può **esportare** o **cancellare** i dati.
   * **Accettazione**: export CSV/JSON via link firmato; erase confermato.

---

# 3) Contratto API v1 (definitivo per l’MVP)

* `POST /uploads` → genera **presigned PUT** S3/MinIO
  **Body**: `{ client_upload_id }`
  **200**: `{ upload_url, file_key, expires_in }`

* `POST /receipts` → registra ricevuta e accoda job OCR
  **Body**: `{ file_key, store_hint?, purchased_at?, client_upload_id }`
  **202**: `{ id, status: "queued" }`

* `GET /receipts/{id}` → stato ed esito
  **200 (ready)**:

  ```json
  {
    "id": "r_123",
    "status": "ready",
    "items": [
      {
        "product_id": "p_456",
        "name": "Pan di Stelle",
        "brand": "Mulino Bianco",
        "size_value": 300,
        "size_uom": "g",
        "qty": 1,
        "price_total": 2.86,
        "unit_price": 0.9533,
        "unit_price_uom": "€/100g",
        "last_price": 2.60,
        "avg_price": 2.72,
        "decision": "red",
        "reasons": [
          "Sopra la tua mediana (p50)",
          "Peggiore €/100g rispetto all'ultimo acquisto"
        ]
      }
    ]
  }
  ```

  **200 (processing)**: `{ id, status: "processing" }`

* `GET /offer-check?ean=&price=&size=&uom=` → semaforo **al volo** per barcode in corsia
  **200**: `{ product_id, unit_price, unit_price_uom, decision, reasons }`

* **GDPR**: `GET /me/export` (link firmato), `DELETE /me/data` (erase).

---

# 4) Modello dati (DB) per l’MVP

* `users(id, email, created_at, locale)`
* `stores(id, name, chain?, address?)`
* `products(id, ean?, brand?, name_norm, package_size_value, package_size_uom)`
* `aliases(product_id, raw_name_pattern)`  // sinonimi tipo “PNDST → Pan di Stelle”
* `receipts(id, user_id, store_id?, purchased_at, file_key, status)`
* `line_items(id, receipt_id, product_id?, raw_desc, qty, price_total, unit_price?, size_value?, size_uom?)`
* `price_events(user_id, product_id, store_id?, unit_price, unit_price_uom, price_per_100g_or_L, ts)`

Indici:

* `price_events(user_id, product_id, ts)`
* `products(ean)`
* `aliases(product_id, raw_name_pattern)` (GIN/trigram se serve).

---

# 5) Regole di calcolo (server-side, deterministiche)

* **Normalizza unità**: solidi → **€/100g**; liquidi → **€/L**.
* **Percentili (storico 6–9 mesi)**: p20 / p50 / p80 (filtra outlier grossolani).
* **Semaforo**:

  * **verde**: unit_price < p20
  * **giallo**: |unit_price − p50| ≤ 5%
  * **rosso**: unit_price > p50
* **Shrinkflation guard**: se `size` cambia, confronta **prezzo unitario** (se peggiora → reason dedicata).
* **Sconti globali** (MVP): **non ripartire**; mostra “promo totale” (flag per attivarne la ripartizione in seguito).

---

# 6) OCR con **PaddleOCR** (definizione)

## 6.1 Output atteso dal driver OCR (JSON)

```json
{
  "header": {
    "merchant_name": "...",
    "merchant_address": "...",
    "datetime": "2025-09-30T10:35:00",
    "receipt_number": "...",
    "vat_id": "...",
    "currency": "EUR",
    "confidence": 0.86,
    "bbox": [0.05, 0.02, 0.90, 0.10]
  },
  "items": [
    {
      "raw_desc": "PNDST 300G",
      "qty": 1,
      "unit_price_printed": 2.86,
      "line_total": 2.86,
      "size_value_raw": "300",
      "size_uom_raw": "G",
      "ean": null,
      "department_raw": null,
      "bbox": [0.07, 0.18, 0.86, 0.03],
      "conf_desc": 0.82,
      "conf_price": 0.93
    }
  ],
  "totals": {
    "discounts_global": [
      { "label": "SCONTO CARTA", "amount": -1.50, "bbox": [0.60, 0.78, 0.30, 0.02], "confidence": 0.9 }
    ],
    "subtotal": 15.70,
    "tax_total": 0.0,
    "total_paid": 14.20,
    "payment_method_raw": "BANCOMAT",
    "bbox_total": [0.55, 0.84, 0.35, 0.03],
    "confidence": 0.95
  }
}
```

> Nota: **PaddleOCR** fornisce testo + bounding boxes. Il **parser** (nostro) mappa gli elementi nelle sezioni `header/items/totals`.

## 6.2 Pre-processing immagine (server-side)

* **EXIF rotate** → allinea verticale.
* **Deskew** (correzione prospettiva leggera).
* **Binarizzazione adattiva**.
* **Riduzione rumore** (denoise lieve).
* **Clamp dimensioni**: se > 2500 px lato lungo, ridimensiona (qualità > velocità).

## 6.3 Parametri PaddleOCR iniziali (indicazioni)

* Modello **OCR general** + **layout detection** (per aiutare sulla colonna prezzi).
* Lingua: `it` + fallback `en`.
* Confidenza minima per testo/numero: **0.50** (sotto → scarta campo).
* Rilevazione colonne: post-process con clustering a destra (pattern prezzo).

## 6.4 Parsing post-OCR (regole chiave)

* **Colonna prezzi**: abbina linee testo al numero più vicino a destra nello stesso asse Y (tolleranza).
* **Quantità**: estrai `xN` o numeri a sinistra; default `1`.
* **Unità**: regex su `G|GR|KG|ML|CL|L` (case-insensitive).
* **Sconti riga**: riconosci parole chiave `SCONTO|OFFERTA` → riga negativa; **lega** alla riga precedente per posizione.
* **Totali**: parole chiave `TOTALE|SUBTOTALE|PAGATO`.

## 6.5 Confidenze & validazioni

* **Accetta** campi con conf ≥ **0.80**.
* **Verifica coerenza**: somma linee ± sconti ≈ `total_paid` (tolleranza 0,02 €).
* Se fallisce → `status="needs_review"` + `reasons=["totale incoerente"]` (ma restituisci comunque l’output).

## 6.6 Lettura EAN

* Pass separato di **barcode detection** (es. ZXing) sul bitmap.
* Se EAN presente vicino alla riga → associa; altrimenti `ean=null`.

---

# 7) Metriche & KPI OCR (da loggare)

* Latenza **PaddleOCR** (ms) p50/p90.
* % righe con `desc` conf ≥ 0.8.
* % righe con `price` conf ≥ 0.8.
* % ricevute con **somma righe ≈ totale**.
* % righe con `ean` risolto (se stampato).
* Tasso `needs_review`.

---

# 8) Dataset interno di validazione (obbligatorio)

* 50–100 scontrini (Coop, Conad, Esselunga, MD, Eurospin, Lidl, Carrefour…).
* Casi: sconti riga, sconti globali, prodotti a peso, EAN stampato, foto scarsa/ombra.
* Per ciascuno: CSV “verità” con `desc, qty, line_total, size_value, size_uom, total_paid`.
* Report settimanale KPI (vedi §7).

---

# 9) Sicurezza, privacy, compliance

* **Minimizzazione**: cancella originale post-OCR (o conserva thumbnail offuscata solo per debug).
* **S3/MinIO** con **SSE** abilitata; link presigned scadenza breve (5 min).
* **Access control** per `user_id` su tutte le query.
* **Export/Erase** pronti per GDPR.
* **Log redaction**: mai PII o raw scontrino in chiaro nei log.

---

# 10) Roadmap backend (milestone sintetiche)

* **M1 – Infrastruttura & contratti**: OpenAPI v1, Compose up, healthz/readyz.
* **M2 – Upload & job**: presigned URL, `POST /receipts`, job `process_receipt`.
* **M3 – PaddleOCR + parsing**: pipeline end-to-end con output JSON schema §6.1.
* **M4 – Normalizzazione & decision engine**: unità, percentili, shrinkflation, reasons.
* **M5 – GDPR & osservabilità**: export/erase, metriche, tracing, alert base.
* **M6 – Hardening**: rate-limit, CORS, backup/restore, security checklist.
* **M7 – Staging pubblico**: test con app Android, freeze API v1.

---

# 11) Ticket/Task per Cursor (prompt sequenziali)

**T0 — Bootstrap repo & Compose**
“Setup monorepo Docker con: FastAPI (api), Celery workers, Redis, Postgres, MinIO, Nginx reverse proxy, container **PaddleOCR**. Healthcheck `/healthz`, `/readyz`. Alembic, Sentry stub, OpenAPI servita a `/docs`. Makefile con `up/down/migrate`.”

**T1 — OpenAPI v1 + migrazione DB**
“Definisci OpenAPI v1 per endpoints (upload, receipts, offer-check, export, erase). Crea migrazioni Alembic per tabelle DB (§4).”

**T2 — Presigned Uploads**
“Implementa `POST /uploads`: valida `client_upload_id`, genera URL PUT presigned (MinIO/S3) con scadenza 5′, limita MIME/size, ritorna `{upload_url,file_key,expires_in}`. Configura CORS/SSE sul bucket.”

**T3 — Ingest & job**
“Implementa `POST /receipts`: crea record (status `queued`) + pubblica job Celery `process_receipt(file_key, user_id, …)` con idempotenza `client_upload_id`.”

**T4 — Driver **PaddleOCR** + pre-processing**
“Nel worker, crea modulo `ocr_driver_paddle`: input `image_bytes` → output JSON conforme a §6.1. Pre-processing immagine: EXIF rotate, deskew leggero, binarizzazione adattiva, clamp dimensione. Parametri: lingua it+en, conf min 0.5.”

**T5 — Parser righe & totals**
“Costruisci parser che, a partire da bboxes e testi di PaddleOCR, ricava `items` e `totals` (pattern colonne prezzo, qty `xN`, unità G/KG/ML/L, sconti riga/ globali). Aggiungi verifica coerenza somme; se fallisce, `status=needs_review` + reasons.”

**T6 — Normalizzazione & price events**
“Implementa normalizzazione unità (€/100g/€/L) e popolamento `price_events` per ogni riga. Indici su `(user_id,product_id,ts)`. Mappe sinonimi via `aliases`.”

**T7 — Decision engine**
“Implementa percentili p20/p50/p80 su finestra 6–9 mesi (outlier filter), semaforo e `reasons`. Integra in `GET /receipts/{id}` e `GET /offer-check`.”

**T8 — GDPR & admin**
“Implementa `GET /me/export` (zip CSV/JSON su S3 con link firmato) e `DELETE /me/data` (soft delete + purge immagini). Log consensi; audit accessi.”

**T9 — Metriche & alert**
“Esporre metriche Prometheus: latenza PaddleOCR p50/p90, % righe ok, % coerenza totale, tasso needs_review, queue depth. Alert basici. Tracing end-to-end.”

**T10 — Hardening & staging**
“Rate limit IP/user, CORS stretti, security headers. Backup/restore DB testati. Dati fittizi in staging per test end-to-end con app Android.”

---

# 12) Definizioni di “Done” (MVP backend)

* Presigned upload funzionante + sicurezza bucket (SSE, CORS).
* Pipeline **PaddleOCR → parse → normalize → decision** stabile su corpus interno.
* `GET /receipts/{id}` ritorna `ready` con `items[]`, `decision`, `reasons`.
* Latenza media (foto 1–2 MB) **entro target** (OCR p50 ≤ 3s).
* KPI/metriche in Grafana; export/erase attivi; backup/restore verificati.

---

Questo è tutto quello che serve a Cursor per partire **subito** sapendo che l’OCR è **PaddleOCR**. Se vuoi, posso preparare un **set di 10 casi di test descritti** (tipi di scontrino/edge case) da tradurre in test automatici nel worker.
