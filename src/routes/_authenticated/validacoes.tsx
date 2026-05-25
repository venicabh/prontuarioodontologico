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
  paciente: { nome: string } | null;
  aluno: { nome: string } | null;
};

function ValidacoesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("prontuarios")
      .select("id, data_atendimento, aluno_id, paciente:pacientes(nome), aluno:profiles!prontuarios_aluno_id_fkey(nome)")
      .eq("status", "aguardando_validacao")
      .order("data_atendimento", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          // fallback without explicit FK name
          supabase
            .from("prontuarios")
            .select("id, data_atendimento, aluno_id, paciente:pacientes(nome)")
            .eq("status", "aguardando_validacao")
            .order("data_atendimento", { ascending: true })
            .then(async ({ data: d2 }) => {
              const rows = (d2 as any[] | null) ?? [];
              const ids = Array.from(new Set(rows.map((r) => r.aluno_id)));
              const { data: profs } = await supabase
                .from("profiles")
                .select("id, nome")
                .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
              const map = new Map((profs ?? []).map((p: any) => [p.id, p.nome]));
              setItems(
                rows.map((r) => ({ ...r, aluno: { nome: map.get(r.aluno_id) ?? "—" } })) as Item[]
              );
              setLoading(false);
            });
          return;
        }
        setItems((data as Item[] | null) ?? []);
        setLoading(false);
      })
      .then(undefined, () => toast.error("Erro ao carregar"));
  }, []);

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
              <div className="font-medium">{p.paciente?.nome ?? "Paciente removido"}</div>
              <div className="text-xs text-muted-foreground">
                Aluno: {p.aluno?.nome ?? "—"} · {new Date(p.data_atendimento).toLocaleString("pt-BR")}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
