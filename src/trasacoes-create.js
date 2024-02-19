module.exports = {
  run: async function (sql, { clientId, valor, tipo, descricao }) {
    if (!Number.isInteger(clientId)) {
      // invalid client id type
      return [422, null];
    }

    if (!Number.isInteger(valor) || valor < 0) {
      // invalid value for transaction
      return [422, null];
    }

    if (!['c', 'd'].includes(tipo)) {
      // invalid transaction type
      return [422, null];
    }

    if (!descricao || descricao === '' || descricao.length > 10) {
      // invlaid description
      return [422, null];
    }

    if (clientId > 5) {
      // client not found
      return [404, null];
    }

    const [updateResponse] = await sql`
      WITH limitquery AS MATERIALIZED (
        SELECT c.limite*-1 AS LIMIT,
        (CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END) AS t_value
        FROM clientes c WHERE c.id=${clientId}
      ),
      inserttransaction AS (
        INSERT INTO transacoes (cliente_id, valor, tipo, descricao, realizada_em)
        SELECT ${clientId}, ${valor}, ${tipo}, ${descricao}, ${new Date().toISOString()} FROM saldos s
        WHERE s.cliente_id=${clientId} AND valor-(SELECT l.t_value FROM limitquery l) >= (SELECT l.limit FROM limitquery l)
      )
      UPDATE saldos AS s
      SET valor=valor-(SELECT l.t_value FROM limitquery l)
      WHERE s.cliente_id=${clientId}
      AND valor-(SELECT l.t_value FROM limitquery l) >= (SELECT l.limit FROM limitquery l)
      RETURNING (SELECT (l.limit*-1) AS limite FROM limitquery AS l), valor AS saldo;
    `;

    if (!updateResponse) {
      // insufficient limit to complete transaction
      return [422, null];
    }

    return [200, updateResponse];
  }
};
