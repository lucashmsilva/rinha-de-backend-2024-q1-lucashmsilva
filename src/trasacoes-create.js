module.exports = {
  run: async function (sql, { clientId, valor, tipo, descricao }) {
    // return await sql.begin('TRANSACTION ISOLATION LEVEL REPEATABLE READ', async transaction => {
    // return await sql.begin('TRANSACTION ISOLATION LEVEL SERIALIZABLE', async transaction => {
    return await sql
      .begin('', async (transaction) => {
        // default é READ COMMITED
        if (!Number.isInteger(clientId)) {
          throw new Error('invalid_client_id');
        }

        if (!Number.isInteger(valor) || valor < 0) {
          throw new Error('invalid_transaction_value');
        }

        if (!['c', 'd'].includes(tipo)) {
          throw new Error('invalid_transaction_type');
        }

        if (!descricao || descricao === '' || descricao.length > 10) {
          throw new Error('invalid_description');
        }

        const [clientData] = await transaction`
        SELECT c.limite AS total_limit, s.valor AS balance, s.id AS balance_id
        FROM clientes c
        JOIN saldos s ON s.cliente_id=c.id
        WHERE c.id=${clientId}
        FOR UPDATE;
      `;

        if (!clientData) {
          throw new Error('client_not_found');
        }

        const { total_limit, balance, balance_id } = clientData;
        const newBalance = tipo === 'c' ? balance + valor : balance - valor;

        if (tipo === 'd' && Math.abs(newBalance) > total_limit) {
          throw new Error('insufficient_limit');
        }

        const updateBalanceQuery = transaction`
        UPDATE saldos AS s SET valor=${newBalance} WHERE s.id=${balance_id};
      `;

        const insertTransactionQuery = transaction`
        INSERT INTO transacoes
        (cliente_id, valor, tipo, descricao, realizada_em)
        VALUES (${clientId}, ${valor}, ${tipo}, ${descricao}, ${new Date().toISOString()});
      `;

        await Promise.all([updateBalanceQuery, insertTransactionQuery]);

        return {
          limite: total_limit,
          saldo: newBalance
        };
      })
      .catch(async (err) => {
        throw err;
      });
  }
};
