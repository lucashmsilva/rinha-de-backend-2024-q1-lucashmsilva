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

    const [response] = await sql`
      INSERT INTO transacoes
        (cliente_id, valor, tipo, descricao, realizada_em, saldo_atual)
        SELECT 1, ${valor}, ${tipo}, ${descricao}, NOW(), t.saldo_atual-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END)
        FROM transacoes t
        WHERE t.id=(SELECT MAX(id) FROM transacoes WHERE cliente_id=${clientId})
        AND (t.saldo_atual-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END)) >= (${limites[clientId - 1]}*-1)
        RETURNING saldo_atual;`;

    if (!response) {
      return [422, null];
    }

    return [200, {
      limite: limites[clientId - 1],
      saldo: response.saldo_atual
    }];
  }
};
