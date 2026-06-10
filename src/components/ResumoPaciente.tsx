import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertOctagon,
  CalendarClock,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  TrendingUp,
  Pencil,
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
