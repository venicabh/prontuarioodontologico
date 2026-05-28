create policy "pacientes_delete_admin"
  on public.pacientes for delete
  to authenticated
  using (public.has_role(auth.uid(), 'professor_admin'));

create policy "prontuarios_delete_admin"
  on public.prontuarios for delete
  to authenticated
  using (public.has_role(auth.uid(), 'professor_admin'));

create policy "agendamentos_delete_admin"
  on public.agendamentos for delete
  to authenticated
  using (public.has_role(auth.uid(), 'professor_admin'));

alter table public.prontuarios
  drop constraint if exists prontuarios_paciente_id_fkey,
  add constraint prontuarios_paciente_id_fkey
    foreign key (paciente_id) references public.pacientes(id) on delete cascade;

alter table public.agendamentos
  drop constraint if exists agendamentos_paciente_id_fkey,
  add constraint agendamentos_paciente_id_fkey
    foreign key (paciente_id) references public.pacientes(id) on delete cascade;
