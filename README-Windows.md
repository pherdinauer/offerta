# È un'offerta? - Guida Windows 🪟

Guida specifica per Windows per avviare e sviluppare l'applicazione "È un'offerta?".

## 🚀 Quick Start Windows

### Prerequisiti
- **Docker Desktop** per Windows (vedi [docker-desktop-setup.md](docker-desktop-setup.md))
- **Node.js 18+** (per mobile)
- **Android Studio** (per mobile)
- **Python 3.8+** (per test)

### Setup Docker Desktop
1. **Installa Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Avvia Docker Desktop** e attendi che sia completamente avviato
3. **Verifica**: `docker --version` e `docker compose version`

### 1. Avvia il Backend

```cmd
# Avvia tutti i servizi
start.bat up

# Verifica che tutto funzioni
start.bat test
```

### 2. Sviluppa il Mobile

```cmd
# Installa dipendenze
start.bat mobile-install

# Build Android (richiede Android Studio)
start.bat mobile-build
```

### 3. Accedi ai Servizi

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

## 🛠️ Comandi Windows

### Backend
```cmd
start.bat up              # Avvia servizi
start.bat down            # Ferma servizi
start.bat logs            # Mostra logs
start.bat clean           # Pulisci tutto
start.bat test            # Test setup
```

### Mobile
```cmd
start.bat mobile-install   # Installa dipendenze
start.bat mobile-build     # Build Android
```

### Sviluppo
```cmd
start.bat dev             # Avvia ambiente completo
start.bat help            # Mostra aiuto
```

## 🔧 Troubleshooting Windows

### Docker non funziona
```cmd
# Verifica Docker
docker --version
docker-compose --version

# Se non funziona, installa Docker Desktop
# https://www.docker.com/products/docker-desktop/
```

### Node.js non trovato
```cmd
# Verifica Node.js
node --version
npm --version

# Se non funziona, installa da:
# https://nodejs.org/
```

### Android Studio
```cmd
# Verifica Android Studio
# Apri Android Studio e configura SDK
# Imposta ANDROID_HOME environment variable
```

### Porte occupate
```cmd
# Verifica porte
netstat -an | findstr :8000
netstat -an | findstr :9000
netstat -an | findstr :5432

# Se occupate, ferma servizi
start.bat down
```

## 📱 Mobile Development

### Setup Android Studio
1. Installa **Android Studio**
2. Configura **Android SDK**
3. Imposta **ANDROID_HOME** environment variable
4. Abilita **Developer Options** sul device/emulatore

### Nuove Funzionalità Mobile
- ✅ **Scatto foto** con fotocamera integrata
- ✅ **Selezione da galleria** per foto esistenti
- ✅ **Anteprima immagine** prima dell'invio
- ✅ **Conferma e invio** con controlli intuitivi

### Build APK
```cmd
# Sviluppo
start.bat mobile-build

# Produzione
cd mobile
npx react-native run-android --variant=release
```

## 🐳 Docker su Windows

### Verifica Docker
```cmd
docker --version
docker-compose --version
```

### Se Docker non funziona
1. Installa **Docker Desktop** per Windows
2. Abilita **WSL 2** se richiesto
3. Riavvia il computer
4. Verifica che Docker sia in esecuzione

## 🔍 Debug

### Logs dettagliati
```cmd
# Logs di tutti i servizi
start.bat logs

# Logs di un servizio specifico
docker-compose logs api
docker-compose logs worker
docker-compose logs paddleocr
```

### Test setup
```cmd
# Test automatico
start.bat test

# Test manuale
curl http://localhost:8000/healthz
```

## 📊 Monitoraggio

### Servizi attivi
```cmd
# Lista container
docker ps

# Statistiche
docker stats
```

### Database
```cmd
# Connessione PostgreSQL
docker exec -it offerta_postgres_1 psql -U offerta_user -d offerta_db
```

### MinIO
- Console: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin123`

## 🚨 Problemi Comuni

### "Port already in use"
```cmd
# Trova processo che usa la porta
netstat -ano | findstr :8000

# Termina processo
taskkill /PID <PID> /F
```

### "Docker daemon not running"
- Avvia **Docker Desktop**
- Attendi che sia completamente avviato
- Verifica con `docker ps`

### "Android SDK not found"
- Installa **Android Studio**
- Configura **Android SDK**
- Imposta **ANDROID_HOME**

### "Node modules not found"
```cmd
cd mobile
npm install
```

## 🎯 Prossimi Passi

1. **Avvia backend**: `start.bat up`
2. **Test setup**: `start.bat test`
3. **Installa mobile**: `start.bat mobile-install`
4. **Build app**: `start.bat mobile-build`
5. **Sviluppa**: Modifica codice e testa!

---

**È un'offerta?** - Perché pagare di più quando puoi risparmiare! 💰
