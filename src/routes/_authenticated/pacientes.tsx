import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { formatCPF } from "@/lib/cpf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pacientes")({
  component: PacientesPage,
});

type Paciente = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  email: string | null;
};

function PacientesPage() {
  const location = useLocation();
  const { role } = useAuth();
  const isAdmin = role === "professor_admin";
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pacientes")
      .select("id, nome, cpf, telefone, email")
      .order("nome");
    if (error) toast.error("Erro ao carregar pacientes");
    setPacientes(data ?? []);
    setLoading(false);
  };

  const handleDelete = async (id: string, nome: string) => {
    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir paciente. Verifique se há prontuários ou agendamentos vinculados.");
      return;
    }
    toast.success(`Paciente ${nome} excluído`);
    setPacientes((prev) => prev.filter((p) => p.id !== id));
  };

  const filtrados = pacientes.filter((p) => {
    const q = busca.toLowerCase().trim();
    if (!q) return true;
    return p.nome.toLowerCase().includes(q) || p.cpf.includes(q.replace(/\D/g, ""));
  });

  if (location.pathname !== "/pacientes") {
    return <Outlet />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de pacientes</p>
        </div>
        <Button asChild>
          <Link to="/pacientes/novo">
            <Plus className="h-4 w-4 mr-2" /> Novo paciente
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum paciente encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="w-28 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{formatCPF(p.cpf)}</TableCell>
                    <TableCell>{p.telefone ?? "—"}</TableCell>
                    <TableCell>{p.email ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm" title="Editar">
                          <Link to="/pacientes/$pacienteId" params={{ pacienteId: p.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Excluir" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir paciente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir <strong>{p.nome}</strong>? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(p.id, p.nome)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
