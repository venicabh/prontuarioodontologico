-- Materiais (estoque clínico)
CREATE TABLE public.materiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT NOT NULL DEFAULT 'un',
  quantidade NUMERIC NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  estoque_minimo NUMERIC NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver materiais"
  ON public.materiais FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins gerenciam materiais (insert)"
  ON public.materiais FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'professor_admin'));

CREATE POLICY "Admins gerenciam materiais (update)"
  ON public.materiais FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'professor_admin'));

CREATE POLICY "Admins gerenciam materiais (delete)"
  ON public.materiais FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'professor_admin'));

CREATE TRIGGER trg_materiais_updated_at
  BEFORE UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Movimentações de estoque
CREATE TYPE public.movimentacao_tipo AS ENUM ('entrada', 'saida', 'ajuste');

CREATE TABLE public.movimentacoes_estoque (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo public.movimentacao_tipo NOT NULL,
  quantidade NUMERIC NOT NULL CHECK (quantidade > 0),
  motivo TEXT,
  usuario_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados veem movimentacoes"
  ON public.movimentacoes_estoque FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins criam movimentacoes"
  ON public.movimentacoes_estoque FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'professor_admin') AND usuario_id = auth.uid());

-- Trigger para atualizar saldo
CREATE OR REPLACE FUNCTION public.aplicar_movimentacao_estoque()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  saldo_atual NUMERIC;
BEGIN
  SELECT quantidade INTO saldo_atual FROM public.materiais WHERE id = NEW.material_id FOR UPDATE;
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.materiais SET quantidade = saldo_atual + NEW.quantidade WHERE id = NEW.material_id;
  ELSIF NEW.tipo = 'saida' THEN
    IF saldo_atual < NEW.quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente';
    END IF;
    UPDATE public.materiais SET quantidade = saldo_atual - NEW.quantidade WHERE id = NEW.material_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE public.materiais SET quantidade = NEW.quantidade WHERE id = NEW.material_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aplicar_movimentacao_estoque() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_aplicar_movimentacao
  AFTER INSERT ON public.movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION public.aplicar_movimentacao_estoque();