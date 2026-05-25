DROP POLICY IF EXISTS pacientes_select_related_or_admin ON public.pacientes;

CREATE POLICY pacientes_select_auth
ON public.pacientes
FOR SELECT
TO authenticated
USING (true);