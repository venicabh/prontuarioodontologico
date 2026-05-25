import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PacienteForm, type PacienteFormValues } from "@/components/PacienteForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pacientes/$pacienteId")({
  component: EditarPacientePage,
});

function EditarPacientePage() {
  const { pacienteId } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<PacienteFormValues | null>(null);

  useEffect(() => {
    supabase
      .from("pacientes")
      .select("*")
      .eq("id", pacienteId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Paciente não encontrado");
          navigate({ to: "/pacientes" });
          return;
        }
        setInitial({
          nome: data.nome,
          cpf: data.cpf,
          data_nascimento: data.data_nascimento ?? "",
          telefone: data.telefone ?? "",
          email: data.email ?? "",
          endereco: data.endereco ?? "",
          observacoes: data.observacoes ?? "",
        });
      });
  }, [pacienteId, navigate]);

  if (!initial) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar paciente</h1>
        <p className="text-muted-foreground">Atualize as informações do paciente</p>
      </div>
      <PacienteForm
        initial={initial}
        pacienteId={pacienteId}
        onSaved={() => navigate({ to: "/pacientes" })}
      />
    </div>
  );
}
