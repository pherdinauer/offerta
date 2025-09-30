# PowerShell script for "È un'offerta?" project

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host "È un'offerta? - Available commands:" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1 up              Start all services with Docker Compose"
    Write-Host "  .\start.ps1 down            Stop all services"
    Write-Host "  .\start.ps1 logs             Show logs from all services"
    Write-Host "  .\start.ps1 clean            Remove all containers and volumes"
    Write-Host "  .\start.ps1 test             Test setup"
    Write-Host ""
    Write-Host "Mobile:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1 mobile-install   Install dependencies for mobile app"
    Write-Host "  .\start.ps1 mobile-build     Build React Native Android app"
    Write-Host ""
    Write-Host "Development:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1 dev              Start development environment"
    Write-Host "  .\start.ps1 help              Show this help"
}

function Start-Services {
    Write-Host "Starting all services..." -ForegroundColor Green
    
    # Try docker compose first (newer Docker Desktop), then docker-compose
    $dockerCmd = "docker compose"
    $result = & $dockerCmd up -d 2>$null
    if ($LASTEXITCODE -ne 0) {
        $dockerCmd = "docker-compose"
        $result = & $dockerCmd up -d 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Services started successfully!" -ForegroundColor Green
        Write-Host "API available at: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "API docs at: http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host "MinIO console at: http://localhost:9001" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to start services!" -ForegroundColor Red
        Write-Host "Make sure Docker Desktop is running and try again." -ForegroundColor Yellow
    }
}

function Stop-Services {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    
    # Try docker compose first, then docker-compose
    $dockerCmd = "docker compose"
    $result = & $dockerCmd down 2>$null
    if ($LASTEXITCODE -ne 0) {
        $dockerCmd = "docker-compose"
        & $dockerCmd down
    }
}

function Show-Logs {
    Write-Host "Showing logs from all services..." -ForegroundColor Green
    
    # Try docker compose first, then docker-compose
    $dockerCmd = "docker compose"
    $result = & $dockerCmd logs -f 2>$null
    if ($LASTEXITCODE -ne 0) {
        $dockerCmd = "docker-compose"
        & $dockerCmd logs -f
    }
}

function Clean-All {
    Write-Host "Cleaning up containers and volumes..." -ForegroundColor Yellow
    
    # Try docker compose first, then docker-compose
    $dockerCmd = "docker compose"
    $result = & $dockerCmd down -v --remove-orphans 2>$null
    if ($LASTEXITCODE -ne 0) {
        $dockerCmd = "docker-compose"
        & $dockerCmd down -v --remove-orphans
    }
    
    docker system prune -f
}

function Start-DevEnvironment {
    Start-Services
    Write-Host ""
    Write-Host "Development environment ready!" -ForegroundColor Green
    Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "API docs: http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "MinIO: http://localhost:9001" -ForegroundColor Cyan
}

function Test-Setup {
    Write-Host "Testing setup..." -ForegroundColor Green
    python test-setup-windows.py
}

function Install-Mobile {
    Write-Host "Installing mobile dependencies..." -ForegroundColor Green
    Set-Location mobile
    npm install
    Set-Location ..
}

function Build-Mobile {
    Write-Host "Building mobile app..." -ForegroundColor Green
    Set-Location mobile
    npx react-native run-android
    Set-Location ..
}

# Main script logic
switch ($Command.ToLower()) {
    "up" { Start-Services }
    "down" { Stop-Services }
    "logs" { Show-Logs }
    "clean" { Clean-All }
    "dev" { Start-DevEnvironment }
    "test" { Test-Setup }
    "mobile-install" { Install-Mobile }
    "mobile-build" { Build-Mobile }
    "help" { Show-Help }
    default { 
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help 
    }
}
