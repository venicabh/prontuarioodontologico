-- Status enum for prontuários
CREATE TYPE public.prontuario_status AS ENUM ('rascunho', 'aguardando_validacao', 'validado', 'rejeitado');

-- Prontuários table
CREATE TABLE public.prontuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id UUID NOT NULL,
  aluno_id UUID NOT NULL,
  agendamento_id UUID,
  data_atendimento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  queixa_principal TEXT,
  anamnese TEXT,
  exame_clinico TEXT,
  diagnostico TEXT,
  procedimentos_realizados TEXT,
  prescricoes TEXT,
  observacoes TEXT,
  status public.prontuario_status NOT NULL DEFAULT 'rascunho',
  validado_por UUID,
  validado_em TIMESTAMP WITH TIME ZONE,
  motivo_rejeicao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view (alunos see their own context, professores see all)
CREATE POLICY "prontuarios_select_auth" ON public.prontuarios
  FOR SELECT TO authenticated USING (true);

-- Alunos can insert their own; admins anyone
CREATE POLICY "prontuarios_insert_own_or_admin" ON public.prontuarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = aluno_id OR public.has_role(auth.uid(), 'professor_admin'));

-- Aluno can update only if rascunho or rejeitado; admin always
CREATE POLICY "prontuarios_update_own_draft_or_admin" ON public.prontuarios
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = aluno_id AND status IN ('rascunho', 'rejeitado'))
    OR public.has_role(auth.uid(), 'professor_admin')
  );

-- Only admin can delete
CREATE POLICY "prontuarios_delete_admin" ON public.prontuarios
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'professor_admin'));

-- Updated_at trigger
CREATE TRIGGER prontuarios_updated_at
  BEFORE UPDATE ON public.prontuarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prontuarios_paciente ON public.prontuarios(paciente_id);
CREATE INDEX idx_prontuarios_aluno ON public.prontuarios(aluno_id);
CREATE INDEX idx_prontuarios_status ON public.prontuarios(status);