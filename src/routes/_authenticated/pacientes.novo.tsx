import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PacienteForm } from "@/components/PacienteForm";

export const Route = createFileRoute("/_authenticated/pacientes/novo")({
  component: NovoPacientePage,
});

function NovoPacientePage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Novo paciente</h1>
        <p className="text-muted-foreground">Cadastre um novo paciente no sistema</p>
      </div>
      <PacienteForm onSaved={() => navigate({ to: "/pacientes" })} />
    </div>
  );
}
