CREATE UNLOGGED TABLE transacoes (
	id SERIAL PRIMARY KEY,
	cliente_id INTEGER NOT NULL,
	valor INTEGER NOT NULL,
	saldo_atual INTEGER NOT NULL,
	tipo CHAR(1) NOT NULL,
	descricao VARCHAR(10) NOT NULL,
	realizada_em TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
	INSERT INTO transacoes (cliente_id, valor, saldo_atual, tipo, descricao, realizada_em)
	VALUES
		(1, -1, 0, 'c', 'ababa', NOW()),
		(2, -1, 0, 'c', 'ababa', NOW()),
		(3, -1, 0, 'c', 'ababa', NOW()),
		(4, -1, 0, 'c', 'ababa', NOW()),
		(5, -1, 0, 'c', 'ababa', NOW());
END;
$$;
