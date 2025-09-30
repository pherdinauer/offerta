# È un'offerta? 📱💰

Un'applicazione mobile che analizza gli scontrini per determinare se i prodotti sono davvero delle offerte, confrontando i prezzi con lo storico personale dell'utente.

## 🎯 Funzionalità

- **Scatto scontrini**: Fotografa lo scontrino con la fotocamera
- **Analisi OCR**: Estrazione automatica dei prodotti e prezzi
- **Confronto prezzi**: Confronto con lo storico personale
- **Semaforo offerte**: Verde (ottima), Giallo (normale), Rosso (cara)
- **Storico personale**: Tracciamento dei prezzi nel tempo
- **GDPR compliant**: Export e cancellazione dati

## 🏗️ Architettura

### Backend
- **FastAPI** - API REST
- **PostgreSQL** - Database
- **Redis** - Cache e code
- **Celery** - Worker asincroni
- **PaddleOCR** - OCR engine
- **MinIO** - Object storage
- **Docker Compose** - Orchestrazione

### Frontend
- **React Native** - App mobile (Android-first)
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Navigation** - Navigazione

## 🚀 Quick Start

### Prerequisiti
- Docker e Docker Compose
- Node.js 18+ (per mobile)
- Android Studio (per mobile)

### 1. Avvia il backend

#### Linux/Mac
```bash
# Clona il repository
git clone <repository-url>
cd offerta

# Avvia tutti i servizi
make up

# Verifica che tutto funzioni
curl http://localhost:8000/healthz
```

#### Windows
```cmd
# Clona il repository
git clone <repository-url>
cd offerta

# Avvia tutti i servizi
start.bat up

# Verifica che tutto funzioni
start.bat test
```

#### PowerShell
```powershell
# Avvia tutti i servizi
.\start.ps1 up

# Verifica che tutto funzioni
.\start.ps1 test
```

### 2. Sviluppa il mobile

#### Linux/Mac
```bash
# Installa dipendenze
make install-mobile

# Avvia l'app (richiede Android Studio)
make build-mobile
```

#### Windows
```cmd
# Installa dipendenze
start.bat mobile-install

# Avvia l'app (richiede Android Studio)
start.bat mobile-build
```

#### PowerShell
```powershell
# Installa dipendenze
.\start.ps1 mobile-install

# Avvia l'app (richiede Android Studio)
.\start.ps1 mobile-build
```

### 3. Accedi ai servizi

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## 📱 Mobile App

### Struttura
```
mobile/
├── src/
│   ├── screens/          # Schermate
│   ├── services/         # API client
│   ├── store/           # State management
│   └── types/           # TypeScript types
├── android/             # Configurazione Android
└── package.json
```

### Schermate
1. **Home** - Dashboard principale
2. **Camera** - Scatto scontrino
3. **Result** - Risultati analisi
4. **History** - Storico scontrini

## 🔧 Backend API

### Endpoints principali

```bash
# Upload immagine
POST /api/v1/uploads
{
  "client_upload_id": "unique_id"
}

# Crea ricevuta
POST /api/v1/receipts
{
  "file_key": "receipts/uuid.jpg",
  "store_hint": "Coop",
  "purchased_at": "2024-01-15T10:30:00Z"
}

# Stato ricevuta
GET /api/v1/receipts/{id}

# Check offerta (barcode)
GET /api/v1/offer-check?ean=123&price=2.50&size=300&uom=g
```

## 🧠 OCR Pipeline

1. **Preprocessing**: Rotazione, deskew, binarizzazione
2. **PaddleOCR**: Estrazione testo e bounding boxes
3. **Parsing**: Mappatura in prodotti e prezzi
4. **Normalizzazione**: Unità standard (€/100g, €/L)
5. **Decision Engine**: Confronto con storico

## 📊 Decision Engine

### Regole di decisione
- **Verde**: Prezzo < p20 (percentile 20%)
- **Giallo**: Prezzo entro ±5% di p50 (mediana)
- **Rosso**: Prezzo > p50

### Storico
- Finestra: 6-9 mesi
- Filtri: Outlier removal
- Unità: Normalizzate (€/100g, €/L)

## 🛠️ Sviluppo

### Comandi utili

#### Linux/Mac
```bash
# Sviluppo
make dev              # Avvia ambiente completo
make logs             # Logs in tempo reale
make clean            # Pulisci tutto

# Database
make migrate          # Applica migrazioni
make migrate-create   # Crea nuova migrazione

# Mobile
make install-mobile   # Installa dipendenze
make build-mobile     # Build Android
make test-mobile      # Test mobile
```

#### Windows
```cmd
# Sviluppo
start.bat dev         # Avvia ambiente completo
start.bat logs        # Logs in tempo reale
start.bat clean       # Pulisci tutto

# Mobile
start.bat mobile-install   # Installa dipendenze
start.bat mobile-build     # Build Android
```

#### PowerShell
```powershell
# Sviluppo
.\start.ps1 dev       # Avvia ambiente completo
.\start.ps1 logs      # Logs in tempo reale
.\start.ps1 clean     # Pulisci tutto

# Mobile
.\start.ps1 mobile-install   # Installa dipendenze
.\start.ps1 mobile-build     # Build Android
```

### Struttura progetto
```
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── models/   # Database models
│   │   ├── services/ # Business logic
│   │   └── worker.py # Celery tasks
│   └── ocr/         # PaddleOCR service
├── mobile/           # React Native app
├── nginx/            # Reverse proxy
└── docker-compose.yml
```

## 🔒 Sicurezza e Privacy

- **Minimizzazione dati**: Cancellazione automatica immagini
- **Crittografia**: SSE su storage
- **GDPR**: Export/cancellazione dati
- **Access control**: User-based queries
- **Audit**: Log accessi

## 📈 Monitoring

- **Health checks**: `/healthz`, `/readyz`
- **Metrics**: Prometheus + Grafana
- **Logs**: Structured logging
- **Tracing**: OpenTelemetry

## 🚀 Deploy

### Sviluppo
```bash
make up
```

### Produzione
```bash
make build-prod
make deploy-prod
```

## 🤝 Contribuire

1. Fork del repository
2. Crea feature branch
3. Commit delle modifiche
4. Push al branch
5. Crea Pull Request

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli.

## 🆘 Supporto

- **Issues**: GitHub Issues
- **Documentation**: `/docs` endpoint
- **API**: http://localhost:8000/docs

---

**È un'offerta?** - Perché pagare di più quando puoi risparmiare! 💰
