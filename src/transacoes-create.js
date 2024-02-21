const limites = [100000, 80000, 1000000, 10000000, 500000];

module.exports = {
  run: async function (sql, { clientId, valor, tipo, descricao }) {
    if (!Number.isInteger(clientId)) {
      return [422, null];
    }

    if (!Number.isInteger(valor) || valor < 0) {
      return [422, null];
    }

    if (!['c', 'd'].includes(tipo)) {
      return [422, null];
    }

    if (!descricao || descricao === '' || descricao.length > 10) {
      return [422, null];
    }

    if (clientId > 5) {
      return [404, null];
    }

    const response = await sql`
      WITH inserttransaction AS (
        INSERT INTO transacoes (cliente_id, valor, tipo, descricao, realizada_em)
        SELECT ${clientId}, ${valor}, ${tipo}, ${descricao}, ${new Date().toISOString()} FROM saldos s
        WHERE s.cliente_id=${clientId} AND valor-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END) >= ${limites[clientId - 1]}
      )
      UPDATE saldos AS s
      SET valor=valor-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END)
      WHERE s.cliente_id=${clientId}
      AND valor-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END) >= ${limites[clientId - 1]}
      RETURNING valor AS saldo;
    `;

    if (!response) {
      return [422, null];
    }

    return [200, {
      limite: limites[clientId - 1],
      saldo: response.saldo
    }];
  }
};
