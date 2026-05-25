
-- PACIENTES
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  data_nascimento DATE,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  criado_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pacientes_select_auth" ON public.pacientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pacientes_insert_auth" ON public.pacientes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "pacientes_update_creator_or_admin" ON public.pacientes
  FOR UPDATE TO authenticated
  USING (auth.uid() = criado_por OR public.has_role(auth.uid(), 'professor_admin'));

CREATE POLICY "pacientes_delete_admin" ON public.pacientes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'professor_admin'));

-- AGENDAMENTOS
CREATE TYPE public.agendamento_status AS ENUM ('agendado', 'realizado', 'cancelado', 'faltou');

CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_minutos INTEGER NOT NULL DEFAULT 60,
  procedimento TEXT,
  status public.agendamento_status NOT NULL DEFAULT 'agendado',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agendamentos_data ON public.agendamentos(data_hora);
CREATE INDEX idx_agendamentos_aluno ON public.agendamentos(aluno_id);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agendamentos_select_auth" ON public.agendamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "agendamentos_insert_own_or_admin" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = aluno_id OR public.has_role(auth.uid(), 'professor_admin'));

CREATE POLICY "agendamentos_update_own_or_admin" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (auth.uid() = aluno_id OR public.has_role(auth.uid(), 'professor_admin'));

CREATE POLICY "agendamentos_delete_own_or_admin" ON public.agendamentos
  FOR DELETE TO authenticated
  USING (auth.uid() = aluno_id OR public.has_role(auth.uid(), 'professor_admin'));

-- Trigger: impede conflito de horário do mesmo aluno
CREATE OR REPLACE FUNCTION public.check_agendamento_conflito()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelado' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.agendamentos
    WHERE aluno_id = NEW.aluno_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status <> 'cancelado'
      AND data_hora = NEW.data_hora
  ) THEN
    RAISE EXCEPTION 'Já existe um agendamento neste horário para este aluno';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_agendamento_conflito
  BEFORE INSERT OR UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.check_agendamento_conflito();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_pacientes_updated BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agendamentos_updated BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
