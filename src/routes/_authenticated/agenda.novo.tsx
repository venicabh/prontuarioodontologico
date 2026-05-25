import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agenda/novo")({
  component: NovoAgendamentoPage,
});

const schema = z.object({
  paciente_id: z.string().uuid("Selecione um paciente"),
  data: z.string().min(1, "Informe a data"),
  hora: z.string().min(1, "Informe a hora"),
  duracao_minutos: z.coerce.number().int().min(15).max(480),
  procedimento: z.string().max(200).optional(),
  observacoes: z.string().max(1000).optional(),
});

function NovoAgendamentoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<{ id: string; nome: string }[]>([]);
  const [pacienteId, setPacienteId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("pacientes")
      .select("id, nome")
      .order("nome")
      .then(({ data }) => setPacientes(data ?? []));
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      paciente_id: pacienteId,
      data: fd.get("data"),
      hora: fd.get("hora"),
      duracao_minutos: fd.get("duracao_minutos"),
      procedimento: fd.get("procedimento"),
      observacoes: fd.get("observacoes"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const data_hora = new Date(`${parsed.data.data}T${parsed.data.hora}:00`);
    if (isNaN(data_hora.getTime())) {
      toast.error("Data/hora inválida");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("agendamentos").insert({
      paciente_id: parsed.data.paciente_id,
      aluno_id: user.id,
      data_hora: data_hora.toISOString(),
      duracao_minutos: parsed.data.duracao_minutos,
      procedimento: parsed.data.procedimento || null,
      observacoes: parsed.data.observacoes || null,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agendamento criado");
    navigate({ to: "/agenda" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Novo agendamento</h1>
        <p className="text-muted-foreground">Agende um atendimento</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {pacientes.length === 0 ? (
            <div className="space-y-4 text-center py-6">
              <p className="text-sm text-muted-foreground">
                Você ainda não tem pacientes cadastrados. Cadastre um paciente para poder marcar consultas.
              </p>
              <Button onClick={() => navigate({ to: "/pacientes/novo" })}>
                Cadastrar paciente
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select value={pacienteId} onValueChange={setPacienteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <Input id="data" name="data" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora *</Label>
                  <Input id="hora" name="hora" type="time" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duracao_minutos">Duração (min)</Label>
                  <Input
                    id="duracao_minutos"
                    name="duracao_minutos"
                    type="number"
                    defaultValue={60}
                    min={15}
                    max={480}
                    step={15}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="procedimento">Procedimento</Label>
                <Input
                  id="procedimento"
                  name="procedimento"
                  maxLength={200}
                  placeholder="Ex: Limpeza, Restauração..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" rows={3} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate({ to: "/agenda" })}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Agendar"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
