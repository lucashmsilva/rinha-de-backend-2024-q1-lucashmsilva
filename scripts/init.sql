CREATE UNLOGGED TABLE transacoes (
	id SERIAL PRIMARY KEY,
	cliente_id INTEGER NOT NULL,
	valor INTEGER NOT NULL,
	tipo CHAR(1) NOT NULL,
	descricao VARCHAR(10) NOT NULL,
	realizada_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX trasacoes_idx
ON transacoes(cliente_id)
INCLUDE (valor, tipo, descricao, realizada_em);

CREATE UNLOGGED TABLE saldos (
	id SERIAL PRIMARY KEY,
	cliente_id INTEGER NOT NULL,
	valor INTEGER NOT NULL
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

		INSERT INTO saldos (cliente_id, valor)
		VALUES
			(1, 0),
			(2, 0),
			(3, 0),
			(4, 0),
			(5, 0);
END;
$$;
