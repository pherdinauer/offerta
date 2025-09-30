# Makefile for "È un'offerta?" project

.PHONY: help up down logs clean build-mobile install-mobile test-backend test-mobile

# Default target
help:
	@echo "È un'offerta? - Available commands:"
	@echo ""
	@echo "Backend:"
	@echo "  up              Start all services with Docker Compose"
	@echo "  down            Stop all services"
	@echo "  logs            Show logs from all services"
	@echo "  clean           Remove all containers and volumes"
	@echo "  test-backend    Run backend tests"
	@echo ""
	@echo "Mobile:"
	@echo "  build-mobile    Build React Native Android app"
	@echo "  install-mobile  Install dependencies for mobile app"
	@echo "  test-mobile     Run mobile app tests"
	@echo ""
	@echo "Development:"
	@echo "  dev             Start development environment"
	@echo "  api-docs       Open API documentation"
	@echo "  minio-console   Open MinIO console"

# Backend commands
up:
	docker-compose up -d
	@echo "Services started. API available at http://localhost:8000"
	@echo "API docs at http://localhost:8000/docs"
	@echo "MinIO console at http://localhost:9001"

down:
	docker-compose down

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

test-backend:
	cd backend && python -m pytest tests/ -v

# Mobile commands
build-mobile:
	cd mobile && npx react-native run-android

install-mobile:
	cd mobile && npm install

test-mobile:
	cd mobile && npm test

# Development commands
dev: up
	@echo "Development environment ready!"
	@echo "Backend API: http://localhost:8000"
	@echo "API docs: http://localhost:8000/docs"
	@echo "MinIO: http://localhost:9001"

api-docs:
	@echo "Opening API documentation..."
	@if command -v open >/dev/null 2>&1; then open http://localhost:8000/docs; fi
	@if command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8000/docs; fi

minio-console:
	@echo "Opening MinIO console..."
	@if command -v open >/dev/null 2>&1; then open http://localhost:9001; fi
	@if command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:9001; fi

# Database commands
migrate:
	cd backend && alembic upgrade head

migrate-create:
	cd backend && alembic revision --autogenerate -m "$(message)"

# Production commands
build-prod:
	docker-compose -f docker-compose.prod.yml build

deploy-prod:
	docker-compose -f docker-compose.prod.yml up -d
