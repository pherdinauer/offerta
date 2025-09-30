# Docker Desktop Setup per Windows 🐳

## Prerequisiti

### 1. Installa Docker Desktop
- Scarica da: https://www.docker.com/products/docker-desktop/
- Installa Docker Desktop per Windows
- Riavvia il computer

### 2. Verifica Installazione
```cmd
docker --version
docker compose version
```

## Configurazione Docker Desktop

### 1. Avvia Docker Desktop
- Cerca "Docker Desktop" nel menu Start
- Avvia l'applicazione
- Attendi che sia completamente avviato (icona verde)

### 2. Configurazione Consigliata
- **Memory**: 4GB+ (Settings > Resources > Memory)
- **CPU**: 2+ cores (Settings > Resources > CPU)
- **WSL 2**: Abilita se richiesto

### 3. Verifica Funzionamento
```cmd
# Test Docker
docker run hello-world

# Test Docker Compose
docker compose version
```

## Troubleshooting

### "Docker daemon not running"
1. Avvia Docker Desktop
2. Attendi che sia completamente avviato
3. Verifica con `docker ps`

### "docker-compose not found"
- Docker Desktop più recente usa `docker compose` (senza trattino)
- I nostri script supportano entrambe le versioni

### "Port already in use"
```cmd
# Trova processo che usa la porta
netstat -ano | findstr :8000

# Termina processo
taskkill /PID <PID> /F
```

### "WSL 2 required"
1. Installa WSL 2: `wsl --install`
2. Riavvia il computer
3. Avvia Docker Desktop

## Comandi Utili

### Verifica Stato
```cmd
# Stato Docker
docker info

# Container attivi
docker ps

# Logs
docker compose logs
```

### Pulizia
```cmd
# Ferma tutti i container
docker compose down

# Pulisci tutto
docker system prune -a
```

## Avvio Progetto

### 1. Avvia Servizi
```cmd
# Usa il nostro script
start.bat up

# Oppure manualmente
docker compose up -d
```

### 2. Verifica
```cmd
# Test setup
start.bat test

# Oppure manualmente
curl http://localhost:8000/healthz
```

### 3. Accedi ai Servizi
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO**: http://localhost:9001

## Problemi Comuni

### Docker non si avvia
1. Riavvia Docker Desktop
2. Verifica che Hyper-V sia abilitato
3. Controlla i log di Docker Desktop

### Porte occupate
1. Ferma altri servizi che usano le porte
2. Usa `netstat -ano` per trovare i processi
3. Termina i processi con `taskkill`

### Performance lente
1. Aumenta memoria Docker (Settings > Resources)
2. Abilita WSL 2 se disponibile
3. Chiudi altre applicazioni

## Supporto

Se hai problemi:
1. Controlla i log: `start.bat logs`
2. Riavvia Docker Desktop
3. Verifica la configurazione
4. Consulta la documentazione Docker
