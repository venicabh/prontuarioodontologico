import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalIcon, X, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

type Agendamento = {
  id: string;
  data_hora: string;
  duracao_minutos: number;
  procedimento: string | null;
  status: "agendado" | "realizado" | "cancelado" | "faltou";
  aluno_id: string;
  paciente: { id: string; nome: string } | null;
};

const statusVariant: Record<Agendamento["status"], "default" | "secondary" | "destructive" | "outline"> = {
  agendado: "default",
  realizado: "secondary",
  cancelado: "outline",
  faltou: "destructive",
};

function AgendaPage() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "meus">("meus");

  useEffect(() => {
    load();
  }, [filter, user?.id]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("agendamentos")
      .select("id, data_hora, duracao_minutos, procedimento, status, aluno_id, paciente:pacientes(id, nome)")
      .order("data_hora");
    if (filter === "meus" && user) q = q.eq("aluno_id", user.id);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar agenda");
    setItems((data as Agendamento[] | null) ?? []);
    setLoading(false);
  };

  const cancelar = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agendamento cancelado");
    load();
  };

  // group by date
  const grupos = items.reduce<Record<string, Agendamento[]>>((acc, a) => {
    const key = new Date(a.data_hora).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Visualize e gerencie atendimentos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "meus" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("meus")}
          >
            Meus
          </Button>
          {role === "professor_admin" && (
            <Button
              variant={filter === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("todos")}
            >
              Todos
            </Button>
          )}
          <Button asChild>
            <Link to="/agenda/novo">
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum agendamento.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grupos).map(([dia, lista]) => (
          <Card key={dia}>
            <CardHeader>
              <CardTitle className="text-base capitalize">{dia}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lista.map((a) => {
                const hora = new Date(a.data_hora).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const podeCancelar =
                  a.status !== "cancelado" &&
                  (a.aluno_id === user?.id || role === "professor_admin");
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md border bg-card"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-sm font-mono font-semibold tabular-nums w-12">
                        {hora}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">
                          {a.paciente?.nome ?? "Paciente removido"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {a.procedimento ?? "Sem procedimento informado"} ·{" "}
                          {a.duracao_minutos} min
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusVariant[a.status]} className="capitalize">
                        {a.status}
                      </Badge>
                      {a.status !== "cancelado" && a.paciente && (a.aluno_id === user?.id || role === "professor_admin") && (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            to="/prontuarios/novo"
                            search={{ paciente: a.paciente.id, agendamento: a.id }}
                          >
                            <Stethoscope className="h-4 w-4 mr-1" /> Atender
                          </Link>
                        </Button>
                      )}
                      {podeCancelar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelar(a.id)}
                          aria-label="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
