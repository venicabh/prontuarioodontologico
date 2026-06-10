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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-[220px]">
              {canEdit && !defaultPacienteId && !initial ? (
                <Select value={form.paciente_id} onValueChange={set("paciente_id")}>
                  <SelectTrigger className="text-lg font-semibold h-auto border-0 p-0 shadow-none focus:ring-0">
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
              ) : (
                <h2 className="text-2xl font-bold">{paciente?.nome ?? "—"}</h2>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                {idade != null && <span>{idade} anos</span>}
                {paciente?.data_nascimento && (
                  <span>{new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")}</span>
                )}
                {paciente?.cpf && <span>CPF: {paciente.cpf}</span>}
              </div>
            </div>
            <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
          </div>

          {paciente?.observacoes && (
            <div className="flex items-start gap-2 mt-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-amber-900 dark:text-amber-200">{paciente.observacoes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {initial?.status === "rejeitado" && initial.motivo_rejeicao && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-destructive mb-1">Rejeitado</p>
            <p className="text-sm">{initial.motivo_rejeicao}</p>
          </CardContent>
        </Card>
      )}

      {status === "validado" && isOwner && !isAdmin && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-900">
                Este prontuário está <strong>validado</strong>. Qualquer edição irá reenviá-lo para validação do professor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {form.paciente_id && (
        <ResumoPaciente pacienteId={form.paciente_id} currentProntuarioId={prontuarioId} />
      )}

      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="prescricoes">Prescrições</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Label htmlFor="queixa">Queixa principal *</Label>
                <Textarea
                  id="queixa"
                  value={form.queixa_principal}
                  onChange={(e) => set("queixa_principal")(e.target.value)}
                  rows={3}
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Label htmlFor="diag">Diagnóstico</Label>
                <Textarea
                  id="diag"
                  value={form.diagnostico}
                  onChange={(e) => set("diagnostico")(e.target.value)}
                  rows={3}
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Odontograma</h3>
                  <p className="text-xs text-muted-foreground">
                    Clique em um dente para marcar o procedimento
                  </p>
                </div>
              </div>
              <Odontograma value={dentes} onChange={setDentes} disabled={!canEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="anamnese">Anamnese</Label>
              <Textarea
                id="anamnese"
                value={form.anamnese}
                onChange={(e) => set("anamnese")(e.target.value)}
                rows={4}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="exame">Exame clínico</Label>
              <Textarea
                id="exame"
                value={form.exame_clinico}
                onChange={(e) => set("exame_clinico")(e.target.value)}
                rows={4}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="proc">Procedimentos realizados</Label>
              <Textarea
                id="proc"
                value={form.procedimentos_realizados}
                onChange={(e) => set("procedimentos_realizados")(e.target.value)}
                rows={4}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescricoes" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Label htmlFor="presc">Prescrições</Label>
              <Textarea
                id="presc"
                value={form.prescricoes}
                onChange={(e) => set("prescricoes")(e.target.value)}
                rows={8}
                disabled={!canEdit}
                placeholder="Ex.: Amoxicilina 500mg — 1 cápsula via oral de 8/8h por 7 dias..."
              />
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  Compartilhar ou assinar esta prescrição:
                </p>
                <PrescricaoActions
                  prescricao={form.prescricoes}
                  paciente={paciente}
                  alunoNome={user?.user_metadata?.nome ?? user?.email ?? null}
                  dataAtendimento={initial?.data_atendimento ?? new Date().toISOString()}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dados" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={form.observacoes}
                onChange={(e) => set("observacoes")(e.target.value)}
                rows={4}
                disabled={!canEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
              {status === "validado" ? "Salvar e reenviar para validação" : "Enviar para validação"}
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
