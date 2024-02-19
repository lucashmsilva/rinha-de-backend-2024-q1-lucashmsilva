const limites = [100000, 80000, 1000000, 10000000, 500000];

module.exports = {
  run: async (sql, { clientId }) => {
    if (!Number.isInteger(clientId)) {
      throw new Error('invalid_client_id');
    }

    const transactions = await sql`
      SELECT t.valor, t.saldo_atual, t.tipo, t.descricao, t.realizada_em
      FROM transacoes t
      WHERE t.cliente_id=${clientId} AND t.valor >= 0
      ORDER BY t.id DESC
      LIMIT 10;
    `;

    if (!transactions?.length) {
      return {
        saldo: {
          total: 0,
          data_extrato: new Date(),
          limite: limites[clientId - 1],
        },
        ultimas_transacoes: []
      }
    }

    return {
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
    };
  }
};
