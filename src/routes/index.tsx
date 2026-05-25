import { createFileRoute, Navigate } from "@tanstack/react-router";
import { hasPasswordRecoverySession, isPasswordRecoveryUrl, useAuth } from "@/hooks/use-auth";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading, isPasswordRecovery } = useAuth();

  // Se chegou um link de recuperação, mostra a troca de senha e não entra no sistema.
  if (isPasswordRecovery || isPasswordRecoveryUrl() || hasPasswordRecoverySession()) {
    return <ResetPasswordForm />;
  }

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  if (!session) return <Navigate to="/login" />;
  return <Navigate to="/inicio" />;
}
