import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Odontograma, type DentesMarcados } from "@/components/Odontograma";
import { ResumoPaciente } from "@/components/ResumoPaciente";
import { PrescricaoActions } from "@/components/PrescricaoActions";
import { toast } from "sonner";
import { z } from "zod";
import { User, AlertTriangle } from "lucide-react";

type Paciente = {
  id: string;
  nome: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  observacoes?: string | null;
  telefone?: string | null;
  email?: string | null;
};

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
  dentes_marcados?: DentesMarcados | null;
};

const schema = z.object({
  paciente_id: z.string().uuid("Selecione um paciente"),
  queixa_principal: z.string().min(1, "Informe a queixa principal").max(2000),
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

function calcIdade(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

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
  const [dentes, setDentes] = useState<DentesMarcados>(
    (initial?.dentes_marcados as DentesMarcados) ?? {},
  );

  const status: ProntuarioStatus = initial?.status ?? "rascunho";
  const isOwner = !initial || initial.aluno_id === user?.id;
  const isAdmin = role === "professor_admin";
  const canEdit = isAdmin || isOwner;
  const canSubmit = isOwner && status !== "aguardando_validacao";

  useEffect(() => {
    supabase
      .from("pacientes")
      .select("id, nome, cpf, data_nascimento, observacoes, telefone, email")
      .order("nome")
      .then(({ data }) => setPacientes((data as Paciente[] | null) ?? []));
  }, []);

  const paciente = pacientes.find((p) => p.id === form.paciente_id);
  const idade = calcIdade(paciente?.data_nascimento);

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
      dentes_marcados: dentes,
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
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-muted-foreground" />
