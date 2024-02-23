.PHONY: build up down restart logs test watch reset_env

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

reset_env:
	make down && docker image prune -f && docker volume prune -f && make build && make up