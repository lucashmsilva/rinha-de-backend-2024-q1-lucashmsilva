FROM node:20-alpine

ENV PATH="/application/node_modules/.bin:${PATH}"
WORKDIR /application

CMD npm install && sleep 10 && npx nodemon ./src/app.js
