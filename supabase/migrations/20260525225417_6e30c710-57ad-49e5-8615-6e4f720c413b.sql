ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS alergias text,
  ADD COLUMN IF NOT EXISTS doencas_preexistentes text;