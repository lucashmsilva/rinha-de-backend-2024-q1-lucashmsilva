module.exports = {
  run: async function (sql, { clientId, valor, tipo, descricao }) {
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

    if (clientId > 5) {
      throw new Error('client_not_found');
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
      throw new Error('insufficient_limit');
    }

    return updateResponse;
  }
};
