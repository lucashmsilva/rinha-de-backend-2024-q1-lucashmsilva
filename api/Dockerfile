FROM node:20-alpine

ENV PATH="/application/node_modules/.bin:${PATH}"
WORKDIR /application

CMD npm install && npx nodemon ./src/app.js
