module.exports = {
  run: async (sql, { clientId, valor, tipo, descricao }) => {
    Number(1.2*100).toFixed(2)
    valor = valor*100

    if (!['c', 'd'].includes(tipo)) {
      throw new Error('invalid_transaction_type');
    }
    if (descricao.length > 10) {
      throw new Error('description_too_long');
    }

    const [clientData,] = await sql`
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

    if (Math.abs(newBalance) > total_limit) {
      throw new Error('insufficient_limit');
    }

    const updateBalanceQuery = sql`
      UPDATE saldos AS s SET valor=${newBalance} WHERE s.id=${balance_id};
    `;
    const insertTransactionQuery = sql`
      INSERT INTO transacoes
      (cliente_id, valor, tipo, descricao, realizada_em)
      VALUES (${clientId}, ${valor}, ${tipo}, ${descricao}, ${new Date().toISOString()});
    `;

    await Promise.all([updateBalanceQuery, insertTransactionQuery]);

    return {
      limite: total_limit,
      saldo: newBalance
    }
  }
}