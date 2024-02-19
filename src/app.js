const express = require('express');
const bodyParser = require('body-parser');
const postgres = require('postgres');

const getExtrato = require('./extrato-get');
const createTransacao = require('./trasacoes-create');

async function setupDbConnection() {
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbMaxPoolSize = process.env.DB_MAX_POOL_SIZE;
  const dbInitialPoolSize = process.env.DB_INITIAL_POOL_SIZE;

  const sql = postgres({
    host: 'db',
    port: 5432,
    database: dbName,
    username: dbUser,
    password: dbPassword,
    max: dbMaxPoolSize
  });

  const poolWarmup = [];
  for (let i = 0; i < dbInitialPoolSize; i++) {
    poolWarmup.push(sql`SELECT 1+1`);
  }
  await Promise.all([poolWarmup]);

  return sql;
}

function setupApp(sql) {
  const app = express();
  app.use(bodyParser.json());

  app.post('/clientes/:id/transacoes', async (req, res) => {
    const clientId = +req.params.id;
    const { valor, tipo, descricao } = req.body;

    const [statusCode, payload] = await createTransacao.run(sql, CLIENTS_DATA, { clientId, valor, tipo, descricao });

    if (payload) {
      return res.status(statusCode).json(payload);
    }

    return res.status(statusCode).end();
  });

  app.get('/clientes/:id/extrato', async (req, res) => {
    const clientId = +req.params.id;

    const [statusCode, payload] = await getExtrato.run(sql, CLIENTS_DATA, { clientId });

    if (payload) {
      return res.status(statusCode).json(payload);
    }

    return res.status(statusCode).end();
  });

  return app;
}

async function init() {
  const port = process.env.PORT;

  const dbConnection = await setupDbConnection();
  const server = setupApp(dbConnection);

  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });

  process.on('SIGINT', async () => await dbConnection.end());
  process.on('SIGTERM', async () => await dbConnection.end());
}

init();
