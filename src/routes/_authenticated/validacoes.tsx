import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/validacoes")({
  component: ValidacoesPage,
});

type Item = {
  id: string;
  data_atendimento: string;
  aluno_id: string;
  paciente_id: string;
  paciente_nome: string;
  aluno_nome: string;
};

function ValidacoesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: pront, error } = await supabase
      .from("prontuarios")
      .select("id, data_atendimento, aluno_id, paciente_id")
      .eq("status", "aguardando_validacao")
      .order("data_atendimento", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar");
      setLoading(false);
      return;
    }

    const rows = pront ?? [];
    const pacIds = Array.from(new Set(rows.map((r) => r.paciente_id)));
    const aluIds = Array.from(new Set(rows.map((r) => r.aluno_id)));

    const [{ data: pacs }, { data: alus }] = await Promise.all([
      supabase.from("pacientes").select("id, nome").in("id", pacIds.length ? pacIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase.from("profiles").select("id, nome").in("id", aluIds.length ? aluIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

    const pacMap = new Map((pacs ?? []).map((p) => [p.id, p.nome]));
    const aluMap = new Map((alus ?? []).map((p) => [p.id, p.nome]));

    setItems(
      rows.map((r) => ({
        id: r.id,
        data_atendimento: r.data_atendimento,
        aluno_id: r.aluno_id,
        paciente_id: r.paciente_id,
        paciente_nome: pacMap.get(r.paciente_id) ?? "Paciente removido",
        aluno_nome: aluMap.get(r.aluno_id) ?? "—",
      }))
    );
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Validações pendentes</h1>
        <p className="text-muted-foreground">Prontuários aguardando sua revisão</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum prontuário aguardando validação.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <Link
              key={p.id}
              to="/prontuarios/$prontuarioId"
              params={{ prontuarioId: p.id }}
              className="block p-4 rounded-md border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="font-medium">{p.paciente_nome}</div>
              <div className="text-xs text-muted-foreground">
                Aluno: {p.aluno_nome} · {new Date(p.data_atendimento).toLocaleString("pt-BR")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
