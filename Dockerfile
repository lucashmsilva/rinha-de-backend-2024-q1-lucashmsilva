FROM node:20-alpine

WORKDIR /api

COPY . .

RUN npm install

CMD if [ "$WATCH" == "1" ]; then npm run start-dev; else npm start; fi
