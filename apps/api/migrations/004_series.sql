-- 004: série no aluno e no tema. ADITIVA: só colunas novas com valor padrão e um gatilho. Nada é apagado, renomeado ou alterado
-- (login, senhas, usuários, progresso, pontuação e respostas não são tocados).

-- Série do aluno e do tema: 7 ou 8 hoje (aceita 1 a 12). Todos os alunos e os 4 temas atuais ficam com 8 (valor padrão).
ALTER TABLE students ADD COLUMN serie smallint NOT NULL DEFAULT 8 CHECK (serie BETWEEN 1 AND 12);
ALTER TABLE maps     ADD COLUMN serie smallint NOT NULL DEFAULT 8 CHECK (serie BETWEEN 1 AND 12);

-- O aluno acompanha a série da turma. (Hoje todos já estão em turma de série 8: esta atualização não muda nenhum valor.)
UPDATE students s SET serie = c.grade FROM classes c WHERE c.id = s.class_id AND c.grade IS NOT NULL AND s.serie <> c.grade;

-- Ao inserir um aluno ou trocar a turma dele, a série do aluno passa a ser a da turma (sem turma/série: mantém o valor atual).
CREATE FUNCTION students_sync_serie() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.class_id IS NOT NULL THEN
    NEW.serie := COALESCE((SELECT grade FROM classes WHERE id = NEW.class_id), NEW.serie);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER students_sync_serie BEFORE INSERT OR UPDATE OF class_id ON students
  FOR EACH ROW EXECUTE FUNCTION students_sync_serie();
