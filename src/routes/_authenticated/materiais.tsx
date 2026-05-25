import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, ArrowDownUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/materiais")({
  component: MateriaisPage,
});

type Material = {
  id: string;
  nome: string;
  descricao: string | null;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
};

function MateriaisPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "professor_admin";
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNovo, setOpenNovo] = useState(false);
  const [movMaterial, setMovMaterial] = useState<Material | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("materiais").select("*").order("nome");
    if (error) toast.error("Erro ao carregar materiais");
    setItems((data as Material[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCriar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = String(fd.get("nome") ?? "").trim();
    if (!nome) {
      toast.error("Nome obrigatório");
      return;
    }
    const { error } = await supabase.from("materiais").insert({
      nome,
      descricao: String(fd.get("descricao") ?? "") || null,
      unidade: String(fd.get("unidade") ?? "un") || "un",
      quantidade: Number(fd.get("quantidade") ?? 0),
      estoque_minimo: Number(fd.get("estoque_minimo") ?? 0),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Material cadastrado");
    setOpenNovo(false);
    load();
  };

  const handleMovimentar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!movMaterial || !user) return;
    const fd = new FormData(e.currentTarget);
    const tipo = String(fd.get("tipo") ?? "entrada") as "entrada" | "saida" | "ajuste";
    const quantidade = Number(fd.get("quantidade") ?? 0);
    if (quantidade <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    const { error } = await supabase.from("movimentacoes_estoque").insert({
      material_id: movMaterial.id,
      tipo,
      quantidade,
      motivo: String(fd.get("motivo") ?? "") || null,
      usuario_id: user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Movimentação registrada");
    setMovMaterial(null);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">Controle de estoque clínico</p>
        </div>
        {isAdmin && (
          <Dialog open={openNovo} onOpenChange={setOpenNovo}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Novo material</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo material</DialogTitle></DialogHeader>
              <form onSubmit={handleCriar} className="space-y-3">
                <div className="space-y-2"><Label>Nome *</Label><Input name="nome" required maxLength={200} /></div>
                <div className="space-y-2"><Label>Descrição</Label><Input name="descricao" maxLength={500} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Unidade</Label><Input name="unidade" defaultValue="un" maxLength={10} /></div>
                  <div className="space-y-2"><Label>Quant. inicial</Label><Input name="quantidade" type="number" min={0} step="0.01" defaultValue={0} /></div>
                  <div className="space-y-2"><Label>Estoque mínimo</Label><Input name="estoque_minimo" type="number" min={0} step="0.01" defaultValue={0} /></div>
                </div>
                <div className="flex justify-end"><Button type="submit">Cadastrar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Nenhum material cadastrado.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => {
            const baixo = m.quantidade <= m.estoque_minimo;
            return (
              <Card key={m.id}>
                <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      {m.nome}
                      {baixo && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Baixo</Badge>}
                    </div>
                    {m.descricao && <p className="text-xs text-muted-foreground">{m.descricao}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo: {m.estoque_minimo} {m.unidade}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold tabular-nums">{Number(m.quantidade)}</div>
                      <div className="text-xs text-muted-foreground">{m.unidade}</div>
                    </div>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => setMovMaterial(m)}>
                        <ArrowDownUp className="h-4 w-4 mr-1" /> Movimentar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!movMaterial} onOpenChange={(o) => !o && setMovMaterial(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Movimentar: {movMaterial?.nome}</DialogTitle></DialogHeader>
          <form onSubmit={handleMovimentar} className="space-y-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select name="tipo" defaultValue="entrada">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada (+)</SelectItem>
                  <SelectItem value="saida">Saída (−)</SelectItem>
                  <SelectItem value="ajuste">Ajuste (define saldo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantidade *</Label><Input name="quantidade" type="number" min="0.01" step="0.01" required /></div>
            <div className="space-y-2"><Label>Motivo</Label><Input name="motivo" maxLength={300} /></div>
            <div className="flex justify-end"><Button type="submit">Confirmar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
