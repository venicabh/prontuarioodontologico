import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, ClipboardList, CheckSquare, Package, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

function InicioPage() {
  const { user, role } = useAuth();
  const isProfessor = role === "professor_admin";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo(a)</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard
          icon={Calendar}
          title="Agenda"
          description="Visualize, agende, remarque ou cancele consultas."
        />
        <FeatureCard
          icon={Users}
          title="Pacientes"
          description="Cadastre e edite informações dos pacientes."
        />
        <FeatureCard
          icon={ClipboardList}
          title="Prontuários"
          description="Registre procedimentos e preencha prontuários."
        />
        {isProfessor && (
          <>
            <FeatureCard
              icon={CheckSquare}
              title="Validações"
              description="Aprove ou rejeite prontuários pendentes."
            />
            <FeatureCard
              icon={Package}
              title="Materiais"
              description="Controle uso e esterilização de materiais."
            />
            <FeatureCard
              icon={FileText}
              title="Relatórios"
              description="Gere relatórios de atendimentos e procedimentos."
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em construção</CardTitle>
          <CardDescription>
            Esta é a Fase 1 do sistema: autenticação e estrutura. As próximas
            fases adicionarão Pacientes, Agenda, Atendimento, Validação e
            demais funcionalidades dos diagramas UML.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
