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

  return sql;
}

async function setupApp(sql) {
  const app = express();
  app.use(bodyParser.json());

  app.post('/clientes/:id/transacoes', async (req, res) => {
    try {
      await sql.begin('TRANSACTION ISOLATION LEVEL REPEATABLE READ', async transaction => {
        const clientId = req.params.id;
        const { valor, tipo, descricao } = req.body;

        const response = await createTransacao.run(transaction, { clientId, valor, tipo, descricao });

        return res.json(response).status(200);
      });
    } catch (err) {
      if (err.message === 'client_not_found') {
        return res.status(404).end();
      }

      if (err.message === 'insufficient_limit') {
        return res.status(422).end();
      }
      console.log('=======================================', err.code, err.messsage);
      return res.json(err).status(500).end();
    }
  });

  app.get('/clientes/:id/extrato', async (req, res) => {
    sql.begin('TRANSACTION ISOLATION LEVEL REPEATABLE READ', async transaction => {
      const clientId = req.params.id;

      const response = await getExtrato.run(transaction, { clientId });

      return res.json(response).status(200).end();
    }).catch(err => {
      if (err.message === 'client_not_found') {
        return res.status(404).end();
      }
    })
  });

  return app;
}

async function init() {
  const port = process.env.PORT;

  const dbConnection = await setupDbConnection();
  const server = await setupApp(dbConnection);

  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });

  process.on('SIGINT', () => dbConnection.end());
  process.on('SIGTERM', () => dbConnection.end());
}

init();
