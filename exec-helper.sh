#!/bin/bash

docker-compose down;
docker-compose up --wait;

export GATLING_HOME="/home/vagrant/projects/src/pessoal/gatling-charts-highcharts-bundle-3.10.3" && ./executar-teste-local.sh;

docker-compose down;
