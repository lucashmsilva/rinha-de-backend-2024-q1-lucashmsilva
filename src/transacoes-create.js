const limites = [100000, 80000, 1000000, 10000000, 500000];

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

    const [response] = await sql`
      INSERT INTO transacoes
        (cliente_id, valor, tipo, descricao, realizada_em, saldo_atual)
        SELECT 1, ${valor}, ${tipo}, ${descricao}, NOW(), t.saldo_atual-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END)
        FROM transacoes t
        WHERE t.id=(SELECT MAX(id) FROM transacoes WHERE cliente_id=${clientId})
        AND (t.saldo_atual-(CASE WHEN ${tipo}='c' THEN ${valor}*-1 ELSE ${valor} END)) >= (${limites[clientId - 1]}*-1)
        RETURNING saldo_atual;`;

    if (!response) {
      throw new Error('insufficient_limit');
    }

    return {
      limite: limites[clientId - 1],
      saldo: response.saldo_atual
    }
  }
};
