import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

type Paciente = { id: string; nome: string };

export type ProntuarioStatus = "rascunho" | "aguardando_validacao" | "validado" | "rejeitado";

export type ProntuarioData = {
  id?: string;
  paciente_id: string;
  aluno_id: string;
  agendamento_id?: string | null;
  data_atendimento: string;
  queixa_principal: string | null;
  anamnese: string | null;
  exame_clinico: string | null;
  diagnostico: string | null;
  procedimentos_realizados: string | null;
  prescricoes: string | null;
  observacoes: string | null;
  status: ProntuarioStatus;
  motivo_rejeicao?: string | null;
};

const schema = z.object({
  paciente_id: z.string().uuid("Selecione um paciente"),
  queixa_principal: z.string().min(1, "Informe a queixa principal").max(2000),
  anamnese: z.string().max(5000).optional(),
  exame_clinico: z.string().max(5000).optional(),
  diagnostico: z.string().max(2000).optional(),
  procedimentos_realizados: z.string().max(5000).optional(),
  prescricoes: z.string().max(2000).optional(),
  observacoes: z.string().max(2000).optional(),
});

type Props = {
  initial?: Partial<ProntuarioData>;
  prontuarioId?: string;
  defaultPacienteId?: string;
  defaultAgendamentoId?: string;
  onSaved?: () => void;
};

const statusLabel: Record<ProntuarioStatus, string> = {
  rascunho: "Rascunho",
  aguardando_validacao: "Aguardando validação",
  validado: "Validado",
  rejeitado: "Rejeitado",
};

const statusVariant: Record<ProntuarioStatus, "default" | "secondary" | "destructive" | "outline"> = {
  rascunho: "outline",
  aguardando_validacao: "default",
  validado: "secondary",
  rejeitado: "destructive",
};

export function ProntuarioForm({
  initial,
  prontuarioId,
  defaultPacienteId,
  defaultAgendamentoId,
  onSaved,
}: Props) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    paciente_id: initial?.paciente_id ?? defaultPacienteId ?? "",
    queixa_principal: initial?.queixa_principal ?? "",
    anamnese: initial?.anamnese ?? "",
    exame_clinico: initial?.exame_clinico ?? "",
    diagnostico: initial?.diagnostico ?? "",
    procedimentos_realizados: initial?.procedimentos_realizados ?? "",
    prescricoes: initial?.prescricoes ?? "",
    observacoes: initial?.observacoes ?? "",
  });

  const status: ProntuarioStatus = initial?.status ?? "rascunho";
  const isOwner = !initial || initial.aluno_id === user?.id;
  const isAdmin = role === "professor_admin";
  const canEdit = isAdmin || (isOwner && (status === "rascunho" || status === "rejeitado"));
  const canSubmit = canEdit && (status === "rascunho" || status === "rejeitado");

  useEffect(() => {
    supabase
      .from("pacientes")
      .select("id, nome")
      .order("nome")
      .then(({ data }) => setPacientes((data as Paciente[] | null) ?? []));
  }, []);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (newStatus: ProntuarioStatus) => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);

    const payload = {
      paciente_id: form.paciente_id,
      aluno_id: initial?.aluno_id ?? user.id,
      agendamento_id: initial?.agendamento_id ?? defaultAgendamentoId ?? null,
      queixa_principal: form.queixa_principal || null,
      anamnese: form.anamnese || null,
      exame_clinico: form.exame_clinico || null,
      diagnostico: form.diagnostico || null,
      procedimentos_realizados: form.procedimentos_realizados || null,
      prescricoes: form.prescricoes || null,
      observacoes: form.observacoes || null,
      status: newStatus,
      ...(newStatus === "rascunho" && status === "rejeitado" ? { motivo_rejeicao: null } : {}),
    };

    const { error } = prontuarioId
      ? await supabase.from("prontuarios").update(payload).eq("id", prontuarioId)
      : await supabase.from("prontuarios").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(prontuarioId ? "Prontuário atualizado" : "Prontuário criado");
    if (onSaved) onSaved();
    else navigate({ to: "/prontuarios" });
  };

  const validar = async () => {
    if (!prontuarioId || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from("prontuarios")
      .update({
        status: "validado",
        validado_por: user.id,
        validado_em: new Date().toISOString(),
        motivo_rejeicao: null,
      })
      .eq("id", prontuarioId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Prontuário validado");
    navigate({ to: "/prontuarios" });
  };

  const rejeitar = async () => {
    if (!prontuarioId || !user) return;
    const motivo = prompt("Motivo da rejeição:");
    if (!motivo) return;
    setSaving(true);
    const { error } = await supabase
      .from("prontuarios")
      .update({
        status: "rejeitado",
        validado_por: user.id,
        validado_em: new Date().toISOString(),
        motivo_rejeicao: motivo,
      })
      .eq("id", prontuarioId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Prontuário rejeitado");
    navigate({ to: "/prontuarios" });
  };

  return (
    <div className="space-y-6">
      {initial?.status === "rejeitado" && initial.motivo_rejeicao && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Rejeitado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{initial.motivo_rejeicao}</CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paciente">Paciente *</Label>
            <Select
              value={form.paciente_id}
              onValueChange={set("paciente_id")}
              disabled={!canEdit || !!defaultPacienteId}
            >
              <SelectTrigger id="paciente">
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

          {initial?.data_atendimento && (
            <div className="space-y-2">
              <Label>Data do atendimento</Label>
              <Input
                value={new Date(initial.data_atendimento).toLocaleString("pt-BR")}
                disabled
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="queixa">Queixa principal *</Label>
            <Textarea
              id="queixa"
              value={form.queixa_principal}
              onChange={(e) => set("queixa_principal")(e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anamnese">Anamnese</Label>
            <Textarea
              id="anamnese"
              value={form.anamnese}
              onChange={(e) => set("anamnese")(e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exame">Exame clínico</Label>
            <Textarea
              id="exame"
              value={form.exame_clinico}
              onChange={(e) => set("exame_clinico")(e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diag">Diagnóstico</Label>
            <Textarea
              id="diag"
              value={form.diagnostico}
              onChange={(e) => set("diagnostico")(e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proc">Procedimentos realizados</Label>
            <Textarea
              id="proc"
              value={form.procedimentos_realizados}
              onChange={(e) => set("procedimentos_realizados")(e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="presc">Prescrições</Label>
            <Textarea
              id="presc"
              value={form.prescricoes}
              onChange={(e) => set("prescricoes")(e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={form.observacoes}
              onChange={(e) => set("observacoes")(e.target.value)}
              rows={2}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate({ to: "/prontuarios" })} disabled={saving}>
          Voltar
        </Button>
        {canSubmit && (
          <>
            <Button variant="secondary" onClick={() => save("rascunho")} disabled={saving}>
              Salvar rascunho
            </Button>
            <Button onClick={() => save("aguardando_validacao")} disabled={saving}>
              Enviar para validação
            </Button>
          </>
        )}
        {isAdmin && status === "aguardando_validacao" && (
          <>
            <Button variant="destructive" onClick={rejeitar} disabled={saving}>
              Rejeitar
            </Button>
            <Button onClick={validar} disabled={saving}>
              Validar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
