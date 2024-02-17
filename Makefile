.PHONY: build up down restart logs test watch

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart: down up

logs:
	docker-compose logs --tail=10 -f

test:
	./scripts/executar-teste-local.sh

watch:
	WATCH=1 docker-compose up -d