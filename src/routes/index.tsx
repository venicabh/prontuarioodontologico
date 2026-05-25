import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();

  // Se chegou um link de recuperação de senha na raiz, redireciona preservando o hash
  if (
    typeof window !== "undefined" &&
    (window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery") ||
      window.location.search.includes("reset-password=1"))
  ) {
    return (
      <Navigate
        to="/reset-password"
        search={window.location.search.slice(1)}
        hash={window.location.hash.slice(1)}
      />
    );
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
