import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  AlertOctagon,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import type { DentesMarcados, ToothState } from "@/components/Odontograma";

type Props = {
  pacienteId: string;
  currentProntuarioId?: string;
};

type ProntuarioRow = {
  id: string;
  data_atendimento: string;
  diagnostico: string | null;
  procedimentos_realizados: string | null;
  status: string;
  dentes_marcados: DentesMarcados | null;
};

type AgendamentoRow = {
  id: string;
  data_hora: string;
  procedimento: string | null;
  status: string;
};

const TOOTH_LABEL: Record<ToothState, string> = {
  saudavel: "Saudável",
  carie: "Cárie",
  restauracao: "Restauração",
  tratamento: "Tratamento",
  extracao: "Extração",
  ausente: "Ausente",
};

const TOOTH_DOT: Record<ToothState, string> = {
  saudavel: "bg-muted-foreground",
  carie: "bg-amber-500",
  restauracao: "bg-blue-500",
  tratamento: "bg-emerald-500",
  extracao: "bg-red-500",
  ausente: "bg-muted-foreground",
};

function summarizeDentes(dentes: DentesMarcados | null | undefined) {
  const counts = new Map<ToothState, number>();
  if (dentes) {
    for (const state of Object.values(dentes)) {
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }
  }
  return counts;
}

export function ResumoPaciente({ pacienteId, currentProntuarioId }: Props) {
  const [prontuarios, setProntuarios] = useState<ProntuarioRow[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoRow[]>([]);
  const [paciente, setPaciente] = useState<{
    alergias: string | null;
    doencas_preexistentes: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      supabase
        .from("prontuarios")
        .select("id, data_atendimento, diagnostico, procedimentos_realizados, status, dentes_marcados")
        .eq("paciente_id", pacienteId)
        .order("data_atendimento", { ascending: false })
        .limit(20),
      supabase
        .from("agendamentos")
        .select("id, data_hora, procedimento, status")
        .eq("paciente_id", pacienteId)
        .gte("data_hora", new Date().toISOString())
        .neq("status", "cancelado")
        .order("data_hora", { ascending: true })
        .limit(5),
      supabase
        .from("pacientes")
        .select("alergias, doencas_preexistentes")
        .eq("id", pacienteId)
        .maybeSingle(),
    ]).then(([p, a, pac]) => {
      if (cancelled) return;
      setProntuarios((p.data as ProntuarioRow[] | null) ?? []);
      setAgendamentos((a.data as AgendamentoRow[] | null) ?? []);
      setPaciente(
        (pac.data as { alergias: string | null; doencas_preexistentes: string | null } | null) ?? null,
      );
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [pacienteId]);


  const outros = prontuarios.filter((p) => p.id !== currentProntuarioId);
  const ultimo = outros[0];
  const ultimoSummary = summarizeDentes(ultimo?.dentes_marcados);

  // Tratamentos atuais: procedimentos em prontuários recentes não validados ou agendamentos futuros
  const tratamentosSet = new Set<string>();
  outros.slice(0, 5).forEach((p) => {
    if (p.procedimentos_realizados) {
      p.procedimentos_realizados
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => tratamentosSet.add(s));
    }
  });
  const tratamentos = Array.from(tratamentosSet).slice(0, 4);

  // Condições dentárias: agregando dentes marcados de prontuários recentes (exceto saudável/ausente)
  const condicoesCount = new Map<ToothState, number>();
  outros.slice(0, 5).forEach((p) => {
    const s = summarizeDentes(p.dentes_marcados);
    s.forEach((v, k) => {
      if (k === "saudavel" || k === "ausente") return;
      condicoesCount.set(k, (condicoesCount.get(k) ?? 0) + v);
    });
  });

  // Evolução
  const totalConsultas = outros.length;
  const validados = outros.filter((p) => p.status === "validado").length;
  const ultimaData = ultimo?.data_atendimento;
  const proxima = agendamentos[0];

  if (!pacienteId) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Resumo do Paciente</h3>
          {loading && (
            <span className="text-xs text-muted-foreground">Carregando...</span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Último Exame Dentário */}
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5" />
              Último Exame
            </div>
            {ultimo ? (
              <>
                <p className="text-sm font-semibold">
                  {new Date(ultimo.data_atendimento).toLocaleDateString("pt-BR")}
                </p>
                <div className="space-y-1">
                  {Array.from(ultimoSummary.entries())
                    .filter(([k]) => k !== "saudavel")
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className={`h-2 w-2 rounded-full ${TOOTH_DOT[k]}`} />
                        <span>
                          {TOOTH_LABEL[k]} ({v})
                        </span>
                      </div>
                    ))}
                  {ultimoSummary.size === 0 && (
                    <p className="text-xs text-muted-foreground">Sem marcações</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sem registros anteriores</p>
            )}
          </div>

          {/* Tratamentos Atuais */}
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5" />
              Tratamentos Atuais
            </div>
            {tratamentos.length > 0 ? (
              <ul className="space-y-1">
                {tratamentos.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className="line-clamp-1">{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum em andamento</p>
            )}
          </div>

          {/* Condições Dentárias */}
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Condições Dentárias
            </div>
            {condicoesCount.size > 0 ? (
              <div className="space-y-1">
                {Array.from(condicoesCount.entries()).slice(0, 4).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${TOOTH_DOT[k]}`} />
                    <span>
                      {TOOTH_LABEL[k]} ({v})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sem condições registradas</p>
            )}
          </div>

          {/* Próximas Consultas */}
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Próximas Consultas
            </div>
            {agendamentos.length > 0 ? (
              <ul className="space-y-1.5">
                {agendamentos.slice(0, 3).map((a) => {
                  const d = new Date(a.data_hora);
                  return (
                    <li key={a.id} className="text-xs">
                      <p className="font-medium">
                        {d.toLocaleDateString("pt-BR")} {" "}
                        {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {a.procedimento && (
                        <p className="text-muted-foreground line-clamp-1">{a.procedimento}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma agendada</p>
            )}
          </div>

          {/* Evolução do Tratamento */}
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Evolução do Tratamento
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consultas</span>
                <span className="font-semibold">{totalConsultas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validadas</span>
                <span className="font-semibold">{validados}</span>
              </div>
              {ultimaData && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última</span>
                  <span className="font-semibold">
                    {new Date(ultimaData).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {proxima && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Próxima</span>
                  <span className="font-semibold">
                    {new Date(proxima.data_hora).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}
              {totalConsultas > 0 && (
                <div className="pt-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min(100, (validados / Math.max(1, totalConsultas)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {Math.round((validados / Math.max(1, totalConsultas)) * 100)}% concluído
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
