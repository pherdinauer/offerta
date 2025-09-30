@echo off
REM Windows batch file for "È un'offerta?" project

if "%1"=="up" goto start_services
if "%1"=="down" goto stop_services
if "%1"=="logs" goto show_logs
if "%1"=="clean" goto clean_all
if "%1"=="dev" goto dev_environment
if "%1"=="test" goto test_setup
if "%1"=="help" goto show_help
if "%1"=="" goto show_help

:show_help
echo È un'offerta? - Available commands:
echo.
echo Backend:
echo   start.bat up              Start all services with Docker Compose
echo   start.bat down            Stop all services
echo   start.bat logs            Show logs from all services
echo   start.bat clean           Remove all containers and volumes
echo   start.bat test            Test setup
echo.
echo Mobile:
echo   start.bat mobile-install  Install dependencies for mobile app
echo   start.bat mobile-build    Build React Native Android app
echo.
echo Development:
echo   start.bat dev             Start development environment
echo   start.bat help           Show this help
goto end

:start_services
echo Starting all services...

REM Try docker compose first (newer Docker Desktop), then docker-compose
docker compose up -d >nul 2>&1
if %errorlevel% neq 0 (
    echo Trying docker-compose...
    docker-compose up -d
    if %errorlevel% neq 0 (
        echo Failed to start services!
        echo Make sure Docker Desktop is running and try again.
        goto end
    )
)

echo.
echo Services started. API available at http://localhost:8000
echo API docs at http://localhost:8000/docs
echo MinIO console at http://localhost:9001
goto end

:stop_services
echo Stopping all services...

REM Try docker compose first, then docker-compose
docker compose down >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose down
)
goto end

:show_logs
echo Showing logs from all services...

REM Try docker compose first, then docker-compose
docker compose logs -f >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose logs -f
)
goto end

:clean_all
echo Cleaning up containers and volumes...

REM Try docker compose first, then docker-compose
docker compose down -v --remove-orphans >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose down -v --remove-orphans
)

docker system prune -f
goto end

:dev_environment
call :start_services
echo.
echo Development environment ready!
echo Backend API: http://localhost:8000
echo API docs: http://localhost:8000/docs
echo MinIO: http://localhost:9001
goto end

:test_setup
echo Testing setup...
python test-setup-windows.py
goto end

:mobile_install
echo Installing mobile dependencies...
cd mobile
npm install
cd ..
goto end

:mobile_build
echo Building mobile app...
cd mobile
npx react-native run-android
cd ..
goto end

:end
