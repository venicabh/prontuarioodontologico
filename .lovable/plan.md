# Sistema de Prontuário Odontológico Digital

Sistema completo baseado nos diagramas UML do PDF, com dois perfis (Aluno e Professor/Administrador), backend Lovable Cloud, controle de acesso por papéis e os 12 fluxos de sequência mapeados.

## Arquitetura

- **Frontend**: TanStack Start + React + Tailwind + shadcn
- **Backend**: Lovable Cloud (Postgres + Auth + RLS)
- **Auth**: Email/senha (Aluno + Professor/Admin)
- **Papéis**: tabela `user_roles` separada + função `has_role()` (segurança)

## Banco de Dados (tabelas)

- `profiles` — dados do usuário (nome, email)
- `user_roles` — enum: `aluno` | `professor_admin`
- `pacientes` — id, nome, cpf (único), endereço, telefone, nascimento, histórico
- `consultas` — id, paciente_id, aluno_id, data, horário, status (agendada/presente/falta/cancelada/remarcada)
- `prontuarios` — id, paciente_id, consulta_id, histórico_clínico, observações, status (aguardando/validado/rejeitado), validado_por
- `procedimentos` — id, prontuario_id, descrição, data
- `materiais` — id, nome, status_esterilização, disponibilidade
- `esterilizacoes` — id, material_id, data, status
- `relatorios` — id, tipo, dados, gerado_por, data

Todas com RLS conforme perfil.

## Fases de Construção

### Fase 1 — Fundação (esta entrega)
1. Ativar Lovable Cloud
2. Migration: enum `app_role`, tabelas `profiles`, `user_roles`, função `has_role()`, trigger de criação automática de profile
3. Tela de Login + Cadastro (com seleção de perfil)
4. Tela Principal com menu adaptado ao perfil
5. Layout protegido (`_authenticated`) e redirecionamento por papel
6. Logout

### Fase 2 — Pacientes & Agenda (Aluno)
- CRUD Pacientes (cadastrar, editar, consultar histórico)
- Agenda: agendar, remarcar, cancelar consulta
- Validação de CPF duplicado e horário ocupado

### Fase 3 — Atendimento & Prontuário
- Confirmar presença / registrar falta
- Registrar procedimento + preencher prontuário
- Status "Aguardando Validação"

### Fase 4 — Painel Professor/Admin
- Validar/rejeitar prontuários pendentes
- Gerenciar usuários (com guarda de e-mail duplicado)
- Controle de materiais e esterilização
- Geração de relatórios

## Esta entrega = Fase 1

Após você aprovar e testar a Fase 1 (login funcionando para os dois perfis), seguimos para a Fase 2.

## Detalhes técnicos

- Rotas: `/login`, `/cadastro`, `/_authenticated/inicio`, `/_authenticated/agenda`, etc.
- Server functions com `requireSupabaseAuth` para todas operações
- Política RLS: Aluno só vê os próprios registros; Professor vê todos
- Validação Zod em todos os formulários
