ALTER TABLE public.prontuarios
  ADD CONSTRAINT prontuarios_paciente_id_fkey
  FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE RESTRICT;

ALTER TABLE public.prontuarios
  ADD CONSTRAINT prontuarios_agendamento_id_fkey
  FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id) ON DELETE SET NULL;