const limites = [100000, 80000, 1000000, 10000000, 500000];

module.exports = {
  run: async (sql, { clientId }) => {
    if (!Number.isInteger(clientId)) {
      return [422, null];
    }

    if (clientId > 5) {
      return [404, null];
    }

    const transactions = await sql`
      SELECT t.valor, t.saldo_atual, t.tipo, t.descricao, t.realizada_em
      FROM transacoes t
      WHERE t.cliente_id=${clientId} AND t.valor >= 0
      ORDER BY t.id DESC
      LIMIT 10;
    `;

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
        total: transactions[0].saldo_atual,
        data_extrato: new Date(),
        limite: limites[clientId - 1],
      },
      ultimas_transacoes: transactions.map((transaction) => {
        return {
          valor: transaction.valor,
          tipo: transaction.tipo,
          descricao: transaction.descricao,
          realizada_em: transaction.realizada_em
        }
      })
    }];
  }
};
