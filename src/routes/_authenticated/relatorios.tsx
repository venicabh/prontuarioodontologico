import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, CheckSquare, Calendar, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { role, loading } = useAuth();
  const [stats, setStats] = useState({
    pacientes: 0,
    agendamentos: 0,
    prontuariosTotal: 0,
    aguardando: 0,
    validados: 0,
    rejeitados: 0,
    rascunhos: 0,
    materiaisBaixo: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (role !== "professor_admin") return;
    const run = async () => {
      const [pacientes, agendamentos, total, aguardando, validados, rejeitados, rascunhos, materiais] = await Promise.all([
        supabase.from("pacientes").select("id", { count: "exact", head: true }),
        supabase.from("agendamentos").select("id", { count: "exact", head: true }),
        supabase.from("prontuarios").select("id", { count: "exact", head: true }),
        supabase.from("prontuarios").select("id", { count: "exact", head: true }).eq("status", "aguardando_validacao"),
        supabase.from("prontuarios").select("id", { count: "exact", head: true }).eq("status", "validado"),
        supabase.from("prontuarios").select("id", { count: "exact", head: true }).eq("status", "rejeitado"),
        supabase.from("prontuarios").select("id", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("materiais").select("id, quantidade, estoque_minimo"),
      ]);
      if (materiais.error) toast.error("Erro ao carregar relatórios");
      const baixo = (materiais.data ?? []).filter((m: any) => Number(m.quantidade) <= Number(m.estoque_minimo)).length;
      setStats({
        pacientes: pacientes.count ?? 0,
        agendamentos: agendamentos.count ?? 0,
        prontuariosTotal: total.count ?? 0,
        aguardando: aguardando.count ?? 0,
        validados: validados.count ?? 0,
        rejeitados: rejeitados.count ?? 0,
        rascunhos: rascunhos.count ?? 0,
        materiaisBaixo: baixo,
      });
      setLoadingData(false);
    };
    run();
  }, [role]);

  if (loading) return <p className="text-muted-foreground text-sm">Carregando...</p>;
  if (role !== "professor_admin") return <Navigate to="/inicio" />;

  const cards = [
    { label: "Pacientes cadastrados", value: stats.pacientes, icon: Users },
    { label: "Agendamentos", value: stats.agendamentos, icon: Calendar },
    { label: "Prontuários (total)", value: stats.prontuariosTotal, icon: ClipboardList },
    { label: "Aguardando validação", value: stats.aguardando, icon: CheckSquare },
    { label: "Validados", value: stats.validados, icon: CheckSquare },
    { label: "Rejeitados", value: stats.rejeitados, icon: CheckSquare },
    { label: "Rascunhos", value: stats.rascunhos, icon: ClipboardList },
    { label: "Materiais em estoque baixo", value: stats.materiaisBaixo, icon: Package },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>
      {loadingData ? (
        <p className="text-muted-foreground text-sm">Carregando dados...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {c.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums">{c.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
