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

    const [updateResponse] = await sql`
      WITH limitquery AS MATERIALIZED (
        SELECT (CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END) AS t_value
      ),
      inserttransaction AS (
        INSERT INTO transacoes (cliente_id, valor, tipo, descricao, realizada_em)
        SELECT ${clientId}, ${valor}, ${tipo}, ${descricao}, ${new Date().toISOString()} FROM saldos s
        WHERE s.cliente_id=${clientId} AND valor-(SELECT l.t_value FROM limitquery l) >= ${limites[clientId-1]*-1}
      )
      UPDATE saldos AS s
      SET valor=valor-(SELECT l.t_value FROM limitquery l)
      WHERE s.cliente_id=${clientId}
      AND valor-(SELECT l.t_value FROM limitquery l) >= ${limites[clientId-1]*-1}
      RETURNING valor AS saldo;
    `;

    if (!updateResponse) {
      return [422, null];
    }

    return [200, {
      saldo: updateResponse.saldo,
      limite: limites[clientId-1]
    }];
  }
};
