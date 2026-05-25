import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, ClipboardList, CheckSquare, Package, FileText, UserCog } from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/inicio")({
  component: InicioPage,
});

type Feature = {
  to: string;
  icon: typeof Calendar;
  title: string;
  description: string;
  roles: AppRole[];
};

const FEATURES: Feature[] = [
  { to: "/agenda", icon: Calendar, title: "Agenda", description: "Visualize, agende, remarque ou cancele consultas.", roles: ["aluno", "professor_admin"] },
  { to: "/pacientes", icon: Users, title: "Pacientes", description: "Cadastre e edite informações dos pacientes.", roles: ["aluno", "professor_admin"] },
  { to: "/prontuarios", icon: ClipboardList, title: "Prontuários", description: "Registre procedimentos e preencha prontuários.", roles: ["aluno", "professor_admin"] },
  { to: "/materiais", icon: Package, title: "Materiais", description: "Consulte e controle o estoque de materiais.", roles: ["aluno", "professor_admin"] },
  { to: "/validacoes", icon: CheckSquare, title: "Validações", description: "Aprove ou rejeite prontuários pendentes.", roles: ["professor_admin"] },
  { to: "/relatorios", icon: FileText, title: "Relatórios", description: "Gere relatórios de atendimentos e procedimentos.", roles: ["professor_admin"] },
  { to: "/usuarios", icon: UserCog, title: "Usuários", description: "Gerencie acessos e papéis do sistema.", roles: ["professor_admin"] },
];

function InicioPage() {
  const { user, role } = useAuth();
  const items = FEATURES.filter((f) => role && f.roles.includes(role));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo(a)</h1>
        <p className="text-muted-foreground mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.to} to={f.to} className="block">
              <Card className="h-full transition-colors hover:bg-accent">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
