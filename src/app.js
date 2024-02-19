const { createServer } = require('node:http');
const postgres = require('postgres');

const getExtrato = require('./extrato-get');
const createTransacao = require('./transacoes-create');

let sql;
async function setupDbConnection() {
  const dbHost = process.env.DB_HOSTNAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbMaxPoolSize = process.env.DB_MAX_POOL_SIZE;
  const dbInitialPoolSize = process.env.DB_INITIAL_POOL_SIZE;

  sql = postgres({
    host: dbHost,
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
}

async function handleRequest(req, res) {
  const { method, url } = req;

  const urlString = url.split('/');
  const clientId = +urlString[2];
  const pathname = urlString[3];

  if (clientId > 5) {
    return res.writeHead(404).end();
  }

  if (method === 'POST' && pathname === 'transacoes') {
    let body = '';
    for await (const chunk of req) body += chunk;

    const { valor, tipo, descricao } = JSON.parse(body);
    const [statusCode, payload] = await createTransacao.run(sql, { clientId, valor: +valor, tipo, descricao });

    return res.writeHead(statusCode, { 'Content-type': 'application/json' }).end(payload ? JSON.stringify(payload) : null);
  }

  if (method === 'GET' && pathname === 'extrato') {
    const [statusCode, payload] = await getExtrato.run(sql, { clientId });

    return res.writeHead(statusCode, { 'Content-type': 'application/json' }).end(payload ? JSON.stringify(payload) : null);
  }

  return res.writeHead(404).end();
}

async function init() {
  const port = process.env.PORT;

  await setupDbConnection();
  const server = createServer(handleRequest);

  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });

  process.on('SIGINT', async () => await dbConnection.end());
  process.on('SIGTERM', async () => await dbConnection.end());
}

init();
