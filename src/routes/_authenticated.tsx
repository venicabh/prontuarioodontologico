import { createFileRoute, Outlet, Navigate, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Calendar, Users, ClipboardList, CheckSquare, Package, FileText, UserCog } from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";
import { OdontoSymbol } from "@/components/OdontoSymbol";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

type NavItem = { to: string; label: string; icon: typeof Home; roles: AppRole[] };

const NAV: NavItem[] = [
  { to: "/inicio", label: "Meu Painel", icon: Home, roles: ["aluno", "professor_admin"] },
  { to: "/agenda", label: "Agenda", icon: Calendar, roles: ["aluno", "professor_admin"] },
  { to: "/pacientes", label: "Pacientes", icon: Users, roles: ["aluno", "professor_admin"] },
  { to: "/prontuarios", label: "Prontuários", icon: ClipboardList, roles: ["aluno", "professor_admin"] },
  { to: "/validacoes", label: "Validações", icon: CheckSquare, roles: ["professor_admin"] },
  { to: "/materiais", label: "Materiais", icon: Package, roles: ["aluno", "professor_admin"] },
  { to: "/relatorios", label: "Relatórios", icon: FileText, roles: ["professor_admin"] },
  { to: "/usuarios", label: "Usuários", icon: UserCog, roles: ["professor_admin"] },
];

function AuthLayout() {
  const { session, role, loading, isPasswordRecovery, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  }
  if (isPasswordRecovery) return <Navigate to="/" />;
  if (!session) return <Navigate to="/login" />;

  const items = NAV.filter((i) => role && i.roles.includes(role));

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <OdontoSymbol className="h-5 w-5 text-primary shrink-1" />
            <h1 className="font-semibold text-sm leading-tight">Prontuário Odontológico</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {role === "professor_admin" ? "Professor/Admin" : "Aluno"}
          </p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                activeProps={{ className: "bg-accent font-medium" }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
