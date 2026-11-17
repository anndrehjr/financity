-- 006: pontuação padronizada da Culminância (e do molde do 7º): TODA questão vale 30 pontos e, nas de escolha,
-- as alternativas valem 30 / 20 / 10 / 0. ADITIVA e preserva o histórico:
--  * attempts.scoring: 1 = regra antiga (todas as tentativas JÁ existentes, inclusive as em andamento, terminam como começaram);
--                      2 = regra padronizada (toda tentativa NOVA).
--  * questions.legacy_max_points / options.legacy_points: guardam os valores de antes, para corrigir e relatar as tentativas antigas.
-- Nada é apagado. Cada tema continua somando 240 pontos (8 × 30), então os totais antigos e novos são comparáveis.

ALTER TABLE attempts ADD COLUMN scoring smallint NOT NULL DEFAULT 1;   -- as linhas existentes ficam com 1 (regra antiga)
ALTER TABLE attempts ALTER COLUMN scoring SET DEFAULT 2;               -- a partir de agora, tentativas novas usam 2
ALTER TABLE questions ADD COLUMN legacy_max_points integer;
ALTER TABLE options   ADD COLUMN legacy_points integer;
UPDATE questions SET legacy_max_points = max_points;
UPDATE options   SET legacy_points = points;

-- Escala das alternativas (só questões do banco novo, que têm "bloom"): pela proporção do valor antigo em relação ao máximo antigo.
--   100% (a resposta correta) -> 30 | de 50% a menos de 100% -> 20 | de 20% a menos de 50% -> 10 | abaixo de 20% -> 0
UPDATE options o SET points = CASE
    WHEN o.legacy_points >= q.legacy_max_points THEN 30
    WHEN o.legacy_points * 2 >= q.legacy_max_points THEN 20
    WHEN o.legacy_points * 5 >= q.legacy_max_points THEN 10
    ELSE 0 END
  FROM questions q WHERE q.id = o.question_id AND q.kind = 'choice' AND q.bloom IS NOT NULL;
UPDATE questions SET max_points = 30 WHERE bloom IS NOT NULL;
UPDATE questions SET note = 'Escala: integral 30; adequada parcial 20; incipiente 10; inadequada 0'
  WHERE bloom IS NOT NULL AND note LIKE 'Escala: integral 40;%';

-- Trava de segurança: toda questão de escolha padronizada precisa ter EXATAMENTE 1 alternativa de 30 pontos
-- e nenhuma alternativa fora da escala. Se algo escapar, a migração inteira é desfeita (nada muda).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM questions q WHERE q.bloom IS NOT NULL AND q.kind = 'choice'
             AND (SELECT COUNT(*) FROM options o WHERE o.question_id = q.id AND o.points = 30) <> 1) THEN
    RAISE EXCEPTION 'Padronização abortada: questão de escolha sem exatamente uma alternativa de 30 pontos';
  END IF;
  IF EXISTS (SELECT 1 FROM options o JOIN questions q ON q.id = o.question_id
             WHERE q.bloom IS NOT NULL AND q.kind = 'choice' AND o.points NOT IN (0, 10, 20, 30)) THEN
    RAISE EXCEPTION 'Padronização abortada: alternativa fora da escala 30/20/10/0';
  END IF;
END $$;
