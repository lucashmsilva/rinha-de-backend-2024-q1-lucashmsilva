const limites = [100000, 80000, 1000000, 10000000, 500000];

module.exports = {
  run: async (sql, { clientId }) => {
    if (!Number.isInteger(clientId)) {
      return [422, null];
    }

    if (clientId > 5) {
      return [404, null];
    }

    const balanceQuery = sql`
      SELECT s.valor AS total
      FROM saldos AS s
      WHERE s.id=${clientId};
    `;

    const transactionsQuery = sql`
      SELECT t.valor, t.tipo, t.descricao, t.realizada_em
      FROM transacoes t
      WHERE t.cliente_id=${clientId}
      ORDER BY t.id DESC
      LIMIT 10;
    `;

    const [[balance], transactions] = await Promise.all([balanceQuery, transactionsQuery]);

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
