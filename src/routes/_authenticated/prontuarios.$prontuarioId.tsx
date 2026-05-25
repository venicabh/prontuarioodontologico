import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProntuarioForm, type ProntuarioData } from "@/components/ProntuarioForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prontuarios/$prontuarioId")({
  component: EditarProntuarioPage,
});

function EditarProntuarioPage() {
  const { prontuarioId } = Route.useParams();
  const [data, setData] = useState<ProntuarioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("prontuarios")
      .select("*")
      .eq("id", prontuarioId)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar prontuário");
        setData(data as ProntuarioData | null);
        setLoading(false);
      });
  }, [prontuarioId]);

  if (loading) return <p className="text-muted-foreground text-sm">Carregando...</p>;
  if (!data) return <p className="text-muted-foreground text-sm">Prontuário não encontrado.</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prontuário</h1>
        <p className="text-muted-foreground">
          {new Date(data.data_atendimento).toLocaleString("pt-BR")}
        </p>
      </div>
      <ProntuarioForm initial={data} prontuarioId={prontuarioId} />
    </div>
  );
}
