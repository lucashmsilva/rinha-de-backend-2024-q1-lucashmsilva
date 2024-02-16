module.exports = {
  run: async (sql, { clientId }) => {
    if (!Number.isInteger(clientId)) {
      throw new Error('invalid_client_id');
    }

    const clientQuery = sql`
      SELECT c.limite, s.valor AS total, NOW() AS data_extrato
      FROM clientes c
      LEFT JOIN transacoes t ON t.cliente_id=c.id
      JOIN saldos s ON s.cliente_id=c.id
      WHERE c.id=${clientId};
    `;

    const transactionsQuery = sql`
      SELECT t.valor, t.tipo, t.descricao, t.realizada_em
      FROM transacoes t
      WHERE t.cliente_id=${clientId}
      ORDER BY t.id DESC
      LIMIT 10;
    `;

    const [[client], trasactions] = await Promise.all([clientQuery, transactionsQuery]);

    if (!client) {
      throw new Error('client_not_found');
    }

    return {
      saldo: client,
      ultimas_transacoes: trasactions
    };
  }
};
