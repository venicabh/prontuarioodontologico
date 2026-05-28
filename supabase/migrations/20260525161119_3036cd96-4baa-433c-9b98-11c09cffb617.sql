-- Enum for app roles
create type public.app_role as enum ('aluno', 'professor_admin');

-- profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- has_role security definer function
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "user_roles_select_authenticated"
  on public.user_roles for select
  to authenticated
  using (true);

create policy "user_roles_admin_insert"
  on public.user_roles for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'professor_admin'));

create policy "user_roles_admin_update"
  on public.user_roles for update
  to authenticated
  using (public.has_role(auth.uid(), 'professor_admin'));

create policy "user_roles_admin_delete"
  on public.user_roles for delete
  to authenticated
  using (public.has_role(auth.uid(), 'professor_admin'));

-- Trigger: when a new auth user is created, create a matching profile and assign role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    new.email
  );

  -- role from metadata, default to 'aluno'
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role,
    'aluno'::public.app_role
  );

  insert into public.user_roles (user_id, role)
  values (new.id, v_role)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- CASCADE DELETE nas foreign keys
alter table public.prontuarios
  drop constraint if exists prontuarios_paciente_id_fkey,
  add constraint prontuarios_paciente_id_fkey
    foreign key (paciente_id) references public.pacientes(id) on delete cascade;

alter table public.agendamentos
  drop constraint if exists agendamentos_paciente_id_fkey,
  add constraint agendamentos_paciente_id_fkey
    foreign key (paciente_id) references public.pacientes(id) on delete cascade;
