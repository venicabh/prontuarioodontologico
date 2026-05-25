import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ToothState =
  | "saudavel"
  | "carie"
  | "restauracao"
  | "extracao"
  | "tratamento"
  | "ausente";

export type DentesMarcados = Record<string, ToothState>;

const STATE_META: Record<
  ToothState,
  { label: string; color: string; dot: string }
> = {
  saudavel: { label: "Saudável", color: "fill-background stroke-border", dot: "bg-muted" },
  carie: { label: "Cárie", color: "fill-amber-200 stroke-amber-600", dot: "bg-amber-500" },
  restauracao: {
    label: "Restauração",
    color: "fill-blue-200 stroke-blue-600",
    dot: "bg-blue-500",
  },
  tratamento: {
    label: "Tratamento",
    color: "fill-emerald-200 stroke-emerald-600",
    dot: "bg-emerald-500",
  },
  extracao: {
    label: "Extração",
    color: "fill-red-200 stroke-red-600",
    dot: "bg-red-500",
  },
  ausente: { label: "Ausente", color: "fill-muted stroke-muted-foreground", dot: "bg-muted-foreground" },
};

// FDI numbering
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

type Props = {
  value?: DentesMarcados;
  onChange?: (v: DentesMarcados) => void;
  disabled?: boolean;
};

function Tooth({
  num,
  state,
  onSelect,
  disabled,
}: {
  num: number;
  state: ToothState;
  onSelect: (s: ToothState) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = STATE_META[state];

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex flex-col items-center gap-1 group focus:outline-none"
          aria-label={`Dente ${num} - ${meta.label}`}
        >
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
            {num}
          </span>
          <svg
            viewBox="0 0 24 32"
            className={cn(
              "w-6 h-8 transition-transform group-hover:scale-110",
              !disabled && "cursor-pointer",
            )}
          >
            <path
              d="M12 2 C5 2 3 8 3 14 C3 20 5 26 8 30 C9 31 10 30 10 28 L10 22 C10 20 11 19 12 19 C13 19 14 20 14 22 L14 28 C14 30 15 31 16 30 C19 26 21 20 21 14 C21 8 19 2 12 2 Z"
              className={cn("stroke-[1.5] transition-colors", meta.color)}
            />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
          Dente {num}
        </p>
        <div className="space-y-0.5">
          {(Object.keys(STATE_META) as ToothState[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onSelect(s);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-accent text-left",
                state === s && "bg-accent",
              )}
            >
              <span className={cn("w-3 h-3 rounded-full", STATE_META[s].dot)} />
              {STATE_META[s].label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Odontograma({ value = {}, onChange, disabled }: Props) {
  const setTooth = (num: number, s: ToothState) => {
    const next = { ...value };
    if (s === "saudavel") delete next[String(num)];
    else next[String(num)] = s;
    onChange?.(next);
  };

  const row = (nums: number[]) => (
    <div className="flex gap-1">
      {nums.map((n) => (
        <Tooth
          key={n}
          num={n}
          state={(value[String(n)] as ToothState) ?? "saudavel"}
          onSelect={(s) => setTooth(n, s)}
          disabled={disabled}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 overflow-x-auto">
        <div className="flex flex-col items-center gap-3 min-w-fit">
          <div className="flex items-center gap-3">
            {row(UPPER_RIGHT)}
            <div className="w-px h-10 bg-border" />
            {row(UPPER_LEFT)}
          </div>
          <div className="h-px w-full bg-border" />
          <div className="flex items-center gap-3">
            {row(LOWER_RIGHT)}
            <div className="w-px h-10 bg-border" />
            {row(LOWER_LEFT)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {(Object.keys(STATE_META) as ToothState[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-full", STATE_META[s].dot)} />
            <span className="text-muted-foreground">{STATE_META[s].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
