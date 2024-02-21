const limites = [100000, 80000, 1000000, 10000000, 500000];

module.exports = {
  run: async (sql, { clientId }) => {
    if (!Number.isInteger(clientId)) {
      return [422, null];
    }

    if (clientId > 5) {
      return [404, null];
    }

    const transactionsQuery = sql`
      SELECT t.valor, t.tipo, t.descricao, t.realizada_em
      FROM transacoes t
      WHERE t.cliente_id=${clientId} AND t.valor >= 0
      ORDER BY t.id DESC
      LIMIT 10;
    `;

    const balanceQuery = sql`
      SELECT s.valor AS total
      FROM slados s
      WHERE c.id=${clientId};
    `;

    const [transactions, [balance]] = await Promise.all([transactionsQuery, balanceQuery]);

    if (!transactions?.length) {
      return [200, {
        saldo: {
          total: 0,
          data_extrato: new Date(),
          limite: limites[clientId - 1],
        },
        ultimas_transacoes: []
      }];
    }

    return [200, {
      saldo: {
        total: balance.total,
        data_extrato: new Date(),
        limite: limites[clientId - 1],
      },
      ultimas_transacoes: transactions
    }];
  }
};
