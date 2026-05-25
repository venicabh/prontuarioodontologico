import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  ClipboardList,
  CheckSquare,
  Package,
  FileText,
  UserCog,
  User,
  Clock,
  ChevronRight,
  Plus,
  Activity,
  AlertTriangle,
} from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

type Feature = {
  to: string;
  icon: typeof Calendar;
  title: string;
  roles: AppRole[];
};

const FEATURES: Feature[] = [
  { to: "/agenda", icon: Calendar, title: "Agenda", roles: ["aluno", "professor_admin"] },
  { to: "/pacientes", icon: Users, title: "Pacientes", roles: ["aluno", "professor_admin"] },
  { to: "/prontuarios", icon: ClipboardList, title: "Prontuários", roles: ["aluno", "professor_admin"] },
  { to: "/materiais", icon: Package, title: "Materiais", roles: ["aluno", "professor_admin"] },
  { to: "/validacoes", icon: CheckSquare, title: "Validações", roles: ["professor_admin"] },
  { to: "/relatorios", icon: FileText, title: "Relatórios", roles: ["professor_admin"] },
  { to: "/usuarios", icon: UserCog, title: "Usuários", roles: ["professor_admin"] },
];

type Agendamento = {
  id: string;
  data_hora: string;
  procedimento: string | null;
  status: string;
  paciente_id: string;
};

type Prontuario = {
  id: string;
  data_atendimento: string;
  status: string;
  paciente_id: string;
  queixa_principal: string | null;
};

function InicioPage() {
  const { user, role } = useAuth();
  const items = FEATURES.filter((f) => role && f.roles.includes(role));

  const [proximos, setProximos] = useState<Agendamento[]>([]);
  const [prontuariosRec, setProntuariosRec] = useState<Prontuario[]>([]);
  const [pacientesMap, setPacientesMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ pacientes: 0, hoje: 0, pendentes: 0 });
  const [nomeUser, setNomeUser] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const isAluno = role === "aluno";

    Promise.all([
      supabase
        .from("agendamentos")
        .select("id, data_hora, procedimento, status, paciente_id")
        .gte("data_hora", now.toISOString())
        .neq("status", "cancelado")
        .order("data_hora", { ascending: true })
        .limit(5)
        .then((r) => (isAluno ? r.data?.filter((a) => true) : r.data) ?? []),
      supabase
        .from("prontuarios")
        .select("id, data_atendimento, status, paciente_id, queixa_principal")
        .order("data_atendimento", { ascending: false })
        .limit(4),
      supabase.from("pacientes").select("id, nome"),
      supabase
        .from("agendamentos")
        .select("id", { count: "exact", head: true })
        .gte("data_hora", startDay)
        .lt("data_hora", endDay)
        .neq("status", "cancelado"),
      supabase
        .from("prontuarios")
        .select("id", { count: "exact", head: true })
        .eq("status", "aguardando_validacao"),
      supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle(),
    ]).then(([ags, pron, pacs, hojeRes, pendRes, prof]) => {
      setProximos(ags as Agendamento[]);
      setProntuariosRec((pron.data as Prontuario[] | null) ?? []);
      const map: Record<string, string> = {};
      ((pacs.data as { id: string; nome: string }[] | null) ?? []).forEach((p) => {
        map[p.id] = p.nome;
      });
      setPacientesMap(map);
      setStats({
        pacientes: pacs.data?.length ?? 0,
        hoje: hojeRes.count ?? 0,
        pendentes: pendRes.count ?? 0,
      });
      setNomeUser((prof.data as { nome?: string } | null)?.nome ?? "");
    });
  }, [user, role]);

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      rascunho: { label: "Rascunho", variant: "outline" },
      aguardando_validacao: { label: "Aguardando", variant: "default" },
      validado: { label: "Validado", variant: "secondary" },
      rejeitado: { label: "Rejeitado", variant: "destructive" },
      agendado: { label: "Agendado", variant: "default" },
      confirmado: { label: "Confirmado", variant: "secondary" },
      realizado: { label: "Realizado", variant: "secondary" },
    };
    const m = map[s] ?? { label: s, variant: "outline" as const };
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  const firstName = (nomeUser || user?.email?.split("@")[0] || "").split(" ")[0];
  const roleLabel = role === "professor_admin" ? "Professor / Admin" : "Aluno";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header tipo prontuário */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <h1 className="text-2xl font-bold">Olá, {firstName}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span>{roleLabel}</span>
                <span>{user?.email}</span>
                <span>
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </span>
              </div>
            </div>
            <Link to="/agenda/novo">
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Nova consulta
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid (estilo Resumo do Paciente) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Consultas hoje"
          value={stats.hoje}
          to="/agenda"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Pacientes cadastrados"
          value={stats.pacientes}
          to="/pacientes"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Próximos agendamentos"
          value={proximos.length}
          to="/agenda"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label={role === "professor_admin" ? "Aguardando validação" : "Meus prontuários"}
          value={role === "professor_admin" ? stats.pendentes : prontuariosRec.length}
          to={role === "professor_admin" ? "/validacoes" : "/prontuarios"}
        />
      </div>

      {/* Próximas consultas + Prontuários recentes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Próximas consultas
              </h2>
              <Link to="/agenda" className="text-xs text-primary hover:underline flex items-center">
                Ver todas <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {proximos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma consulta agendada.</p>
            ) : (
              <ul className="space-y-3">
                {proximos.map((a) => {
                  const d = new Date(a.data_hora);
                  return (
                    <li key={a.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <div className="text-center shrink-0 w-12">
                        <div className="text-xs text-muted-foreground uppercase">
                          {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                        </div>
                        <div className="text-lg font-bold leading-tight">{d.getDate()}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {pacientesMap[a.paciente_id] ?? "Paciente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {a.procedimento ? ` · ${a.procedimento}` : ""}
                        </p>
                      </div>
                      {statusBadge(a.status)}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Prontuários recentes
              </h2>
              <Link to="/prontuarios" className="text-xs text-primary hover:underline flex items-center">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {prontuariosRec.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prontuário registrado.</p>
            ) : (
              <ul className="space-y-3">
                {prontuariosRec.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {pacientesMap[p.paciente_id] ?? "Paciente"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(p.data_atendimento).toLocaleDateString("pt-BR")}
                        {p.queixa_principal ? ` · ${p.queixa_principal}` : ""}
                      </p>
                    </div>
                    {statusBadge(p.status)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atalhos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Atalhos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.to} to={f.to} className="block">
                <Card className="h-full transition-all hover:bg-accent hover:border-primary/40">
                  <CardContent className="pt-5 pb-5 flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">{f.title}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="transition-colors hover:bg-accent h-full">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            {icon}
            <span>{label}</span>
          </div>
          <div className="text-3xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
