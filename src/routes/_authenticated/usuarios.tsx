import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

type Row = {
  id: string;
  nome: string | null;
  email: string;
  role: "aluno" | "professor_admin" | null;
};

function UsuariosPage() {
  const { role, loading, user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const load = async () => {
    setLoadingData(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome, email")
      .order("nome");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const map = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    setRows(
      (profiles ?? []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        email: p.email,
        role: map.get(p.id) ?? null,
      })),
    );
    setLoadingData(false);
  };

  useEffect(() => {
    if (role === "professor_admin") load();
  }, [role]);

  if (loading) return <p className="text-muted-foreground text-sm">Carregando...</p>;
  if (role !== "professor_admin") return <Navigate to="/inicio" />;

  const alterarRole = async (userId: string, newRole: "aluno" | "professor_admin") => {
    if (userId === user?.id && newRole !== "professor_admin") {
      toast.error("Você não pode remover seu próprio acesso de admin");
      return;
    }
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    const { error: insErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });
    if (insErr) {
      toast.error(insErr.message);
      return;
    }
    toast.success("Permissão atualizada");
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie as permissões dos usuários</p>
      </div>

      {loadingData ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <UserCog className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum usuário.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.nome ?? "(sem nome)"}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.role === "professor_admin" ? "default" : "secondary"}>
                    {r.role === "professor_admin" ? "Professor/Admin" : r.role === "aluno" ? "Aluno" : "Sem papel"}
                  </Badge>
                  <Select
                    value={r.role ?? undefined}
                    onValueChange={(v) => alterarRole(r.id, v as "aluno" | "professor_admin")}
                  >
                    <SelectTrigger className="w-44"><SelectValue placeholder="Alterar papel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aluno">Aluno</SelectItem>
                      <SelectItem value="professor_admin">Professor/Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {r.id === user?.id && (
                    <Button variant="ghost" size="sm" disabled>Você</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
