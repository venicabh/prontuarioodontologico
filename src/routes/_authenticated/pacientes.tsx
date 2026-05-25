import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil } from "lucide-react";
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
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{formatCPF(p.cpf)}</TableCell>
                    <TableCell>{p.telefone ?? "—"}</TableCell>
                    <TableCell>{p.email ?? "—"}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/pacientes/$pacienteId" params={{ pacienteId: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
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
