import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProntuarioForm } from "@/components/ProntuarioForm";

export const Route = createFileRoute("/_authenticated/prontuarios/novo")({
  validateSearch: z.object({
    paciente: z.string().uuid().optional(),
    agendamento: z.string().uuid().optional(),
  }),
  component: NovoProntuarioPage,
});

function NovoProntuarioPage() {
  const { paciente, agendamento } = Route.useSearch();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Novo prontuário</h1>
        <p className="text-muted-foreground">Registre um atendimento clínico</p>
      </div>
      <ProntuarioForm defaultPacienteId={paciente} defaultAgendamentoId={agendamento} />
    </div>
  );
}
