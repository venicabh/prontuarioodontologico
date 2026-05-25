import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prontuarios")({
  component: ProntuariosPage,
});

type Prontuario = {
  id: string;
  data_atendimento: string;
  status: "rascunho" | "aguardando_validacao" | "validado" | "rejeitado";
  aluno_id: string;
  paciente: { id: string; nome: string } | null;
};

const statusLabel: Record<Prontuario["status"], string> = {
  rascunho: "Rascunho",
  aguardando_validacao: "Aguardando validação",
  validado: "Validado",
  rejeitado: "Rejeitado",
};

const statusVariant: Record<Prontuario["status"], "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  aguardando_validacao: "default",
  validado: "secondary",
  rejeitado: "destructive",
};

function ProntuariosPage() {
  const { user, role } = useAuth();
  const [items, setItems] = useState<Prontuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"meus" | "todos">("meus");
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, [filter, user?.id]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("prontuarios")
      .select("id, data_atendimento, status, aluno_id, paciente:pacientes(id, nome)")
      .order("data_atendimento", { ascending: false });
    if (filter === "meus" && user) q = q.eq("aluno_id", user.id);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar prontuários");
    setItems((data as Prontuario[] | null) ?? []);
    setLoading(false);
  };

  const filtered = items.filter((p) =>
    !search ? true : p.paciente?.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Prontuários</h1>
          <p className="text-muted-foreground">Registros de atendimentos clínicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "meus" ? "default" : "outline"} size="sm" onClick={() => setFilter("meus")}>
            Meus
          </Button>
          {role === "professor_admin" && (
            <Button variant={filter === "todos" ? "default" : "outline"} size="sm" onClick={() => setFilter("todos")}>
              Todos
            </Button>
          )}
          <Button asChild>
            <Link to="/prontuarios/novo">
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Link>
          </Button>
        </div>
      </div>

      <Input
        placeholder="Buscar por paciente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum prontuário encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/prontuarios/$prontuarioId"
              params={{ prontuarioId: p.id }}
              className="block"
            >
              <div className="flex items-center justify-between gap-3 p-4 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.paciente?.nome ?? "Paciente removido"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.data_atendimento).toLocaleString("pt-BR")}
                  </div>
                </div>
                <Badge variant={statusVariant[p.status]}>{statusLabel[p.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
