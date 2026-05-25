
-- Tighten SELECT policies to fix EXPOSED_SENSITIVE_DATA findings

-- profiles: users see only their own profile; admins see all
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'professor_admin'));

-- user_roles: users see only their own roles; admins see all
DROP POLICY IF EXISTS user_roles_select_authenticated ON public.user_roles;
CREATE POLICY user_roles_select_own_or_admin ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'professor_admin'));

-- prontuarios: students see only their own records; admins see all
DROP POLICY IF EXISTS prontuarios_select_auth ON public.prontuarios;
CREATE POLICY prontuarios_select_own_or_admin ON public.prontuarios
  FOR SELECT TO authenticated
  USING (auth.uid() = aluno_id OR public.has_role(auth.uid(), 'professor_admin'));

-- pacientes: creator, admin, or users with a linked appointment/record
DROP POLICY IF EXISTS pacientes_select_auth ON public.pacientes;
CREATE POLICY pacientes_select_related_or_admin ON public.pacientes
  FOR SELECT TO authenticated
  USING (
    auth.uid() = criado_por
    OR public.has_role(auth.uid(), 'professor_admin')
    OR EXISTS (
      SELECT 1 FROM public.agendamentos a
      WHERE a.paciente_id = pacientes.id AND a.aluno_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.prontuarios p
      WHERE p.paciente_id = pacientes.id AND p.aluno_id = auth.uid()
    )
  );
