-- 003: tipos de questão (escolha, multisseleção, ordenação), pontuação por questão, dica e avaliação arquivada.
-- Aditiva: nada é apagado. As questões antigas continuam valendo 0..5 pontos (max_points = 5, kind = 'choice').

ALTER TABLE questions ADD COLUMN kind text NOT NULL DEFAULT 'choice' CHECK (kind IN ('choice','multi','order'));
ALTER TABLE questions ADD COLUMN max_points integer NOT NULL DEFAULT 5 CHECK (max_points BETWEEN 1 AND 100);
ALTER TABLE questions ADD COLUMN hint text;
ALTER TABLE questions ADD COLUMN bloom text;
ALTER TABLE questions ADD COLUMN bncc text;
ALTER TABLE questions ADD COLUMN source text;

ALTER TABLE options ADD COLUMN is_correct boolean NOT NULL DEFAULT false;  -- multisseleção: faz parte do conjunto correto
ALTER TABLE options ADD COLUMN seq integer;                                 -- ordenação: posição correta (1..N)
ALTER TABLE options DROP CONSTRAINT IF EXISTS options_points_check;
ALTER TABLE options ADD CONSTRAINT options_points_check CHECK (points BETWEEN 0 AND 100);

ALTER TABLE answers ADD COLUMN response jsonb;                              -- o que o aluno marcou/ordenou (auditoria)
ALTER TABLE answers ADD COLUMN used_hint boolean NOT NULL DEFAULT false;    -- apoio formativo, não reduz a nota

ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_status_check;
ALTER TABLE assessments ADD CONSTRAINT assessments_status_check CHECK (status IN ('available','developing','archived'));
