import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCPF, isValidCPF, onlyDigits } from "@/lib/cpf";

export type PacienteFormValues = {
  nome: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
};

const schema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(200),
  cpf: z.string().refine((v) => isValidCPF(v), "CPF inválido"),
  data_nascimento: z.string().optional(),
  telefone: z.string().max(30).optional(),
  email: z.string().email("E-mail inválido").max(255).optional().or(z.literal("")),
  endereco: z.string().max(500).optional(),
  observacoes: z.string().max(2000).optional(),
});

const EMPTY: PacienteFormValues = {
  nome: "",
  cpf: "",
  data_nascimento: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
};

export function PacienteForm({
  initial,
  pacienteId,
  onSaved,
}: {
  initial?: PacienteFormValues;
  pacienteId?: string;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [values, setValues] = useState<PacienteFormValues>(initial ?? EMPTY);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof PacienteFormValues>(k: K, v: PacienteFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!user) return;
    setLoading(true);

    const payload = {
      nome: parsed.data.nome,
      cpf: onlyDigits(parsed.data.cpf),
      data_nascimento: parsed.data.data_nascimento || null,
      telefone: parsed.data.telefone || null,
      email: parsed.data.email || null,
      endereco: parsed.data.endereco || null,
      observacoes: parsed.data.observacoes || null,
    };

    let error;
    if (pacienteId) {
      ({ error } = await supabase.from("pacientes").update(payload).eq("id", pacienteId));
    } else {
      ({ error } = await supabase
        .from("pacientes")
        .insert({ ...payload, criado_por: user.id }));
    }
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("Já existe um paciente com este CPF");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success(pacienteId ? "Paciente atualizado" : "Paciente cadastrado");
    onSaved();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input
              id="nome"
              value={values.nome}
              onChange={(e) => set("nome", e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formatCPF(values.cpf)}
                onChange={(e) => set("cpf", e.target.value)}
                required
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={values.data_nascimento}
                onChange={(e) => set("data_nascimento", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={values.telefone}
                onChange={(e) => set("telefone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={values.endereco}
              onChange={(e) => set("endereco", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              rows={4}
              value={values.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
