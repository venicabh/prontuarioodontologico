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

type StateMeta = {
  label: string;
  dot: string;
  crown: string; // fill
  crownStroke: string;
  root: string;
  rootStroke: string;
  opacity?: number;
};

const STATE_META: Record<ToothState, StateMeta> = {
  saudavel: {
    label: "Saudável",
    dot: "bg-muted",
    crown: "#fdfcf7",
    crownStroke: "#c8c2b0",
    root: "#f3ead4",
    rootStroke: "#b8a878",
  },
  carie: {
    label: "Cárie",
    dot: "bg-amber-500",
    crown: "#fde68a",
    crownStroke: "#b45309",
    root: "#f3ead4",
    rootStroke: "#b8a878",
  },
  restauracao: {
    label: "Restauração",
    dot: "bg-blue-500",
    crown: "#bfdbfe",
    crownStroke: "#1d4ed8",
    root: "#f3ead4",
    rootStroke: "#b8a878",
  },
  tratamento: {
    label: "Tratamento",
    dot: "bg-emerald-500",
    crown: "#a7f3d0",
    crownStroke: "#047857",
    root: "#f3ead4",
    rootStroke: "#b8a878",
  },
  extracao: {
    label: "Extração",
    dot: "bg-red-500",
    crown: "#fecaca",
    crownStroke: "#b91c1c",
    root: "#fecaca",
    rootStroke: "#b91c1c",
  },
  ausente: {
    label: "Ausente",
    dot: "bg-muted-foreground",
    crown: "#e5e7eb",
    crownStroke: "#9ca3af",
    root: "#e5e7eb",
    rootStroke: "#9ca3af",
    opacity: 0.35,
  },
};

// Tooth type by FDI second digit (1-8)
type ToothType = "incisor" | "canine" | "premolar" | "molar";
function toothType(num: number): ToothType {
  const pos = num % 10;
  if (pos <= 2) return "incisor";
  if (pos === 3) return "canine";
  if (pos <= 5) return "premolar";
  return "molar";
}

// SVG paths for crown + root, drawn in a 40x56 viewBox (upper tooth: root down)
// We'll flip vertically for the lower arch.
const TOOTH_PATHS: Record<ToothType, { crown: string; root: string; cusps?: string }> = {
  incisor: {
    // flat wide crown, single tapered root
    crown:
      "M8 4 Q8 2 12 2 L28 2 Q32 2 32 4 L33 22 Q33 26 28 27 L12 27 Q7 26 7 22 Z",
    root: "M11 26 Q10 40 14 52 Q20 56 26 52 Q30 40 29 26 Z",
    cusps: "M10 22 L30 22",
  },
  canine: {
    // pointed crown, long single root
    crown:
      "M9 6 Q10 2 14 2 Q20 2 20 1 Q20 2 26 2 Q30 2 31 6 L33 22 Q33 26 28 27 L12 27 Q7 26 7 22 Z",
    root: "M10 26 Q8 44 14 54 Q20 58 26 54 Q32 44 30 26 Z",
    cusps: "M20 3 L20 14",
  },
  premolar: {
    // two small cusps, single/bifid root
    crown:
      "M8 6 Q9 2 13 2 Q16 2 17 5 Q18 8 20 8 Q22 8 23 5 Q24 2 27 2 Q31 2 32 6 L33 22 Q33 26 28 27 L12 27 Q7 26 7 22 Z",
    root: "M11 26 Q9 40 13 52 Q16 55 17 50 L17 36 Q18 34 20 34 Q22 34 23 36 L23 50 Q24 55 27 52 Q31 40 29 26 Z",
    cusps: "M13 12 L17 16 M27 12 L23 16",
  },
  molar: {
    // wide crown with 4 cusps, 2-3 roots
    crown:
      "M6 8 Q7 2 12 2 Q15 2 16 5 Q17 8 20 8 Q23 8 24 5 Q25 2 28 2 Q33 2 34 8 L35 24 Q35 28 30 29 L10 29 Q5 28 5 24 Z",
    root: "M9 28 Q7 42 10 52 Q13 55 14 50 L14 36 Q15 34 17 34 Q19 34 19 38 L19 50 Q20 55 22 52 Q24 55 25 50 L25 38 Q25 34 27 34 Q29 34 29 36 L29 50 Q30 55 33 52 Q35 42 31 28 Z",
    cusps: "M10 14 L16 18 M30 14 L24 18 M16 22 L24 22",
  },
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
  flip,
  onSelect,
  disabled,
}: {
  num: number;
  state: ToothState;
  flip?: boolean;
  onSelect: (s: ToothState) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const meta = STATE_META[state];
  const t = toothType(num);
  const paths = TOOTH_PATHS[t];
  const gradId = `tg-${num}`;
  const rootGradId = `rg-${num}`;

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex flex-col items-center gap-0.5 group focus:outline-none"
          aria-label={`Dente ${num} - ${meta.label}`}
        >
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
            {num}
          </span>
          <svg
            viewBox="0 0 40 58"
            className={cn(
              "w-7 h-10 transition-transform group-hover:scale-110 drop-shadow-sm",
              !disabled && "cursor-pointer",
            )}
            style={{
              transform: flip ? "scaleY(-1)" : undefined,
              opacity: meta.opacity ?? 1,
            }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor={meta.crown} />
                <stop offset="100%" stopColor={meta.crown} stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id={rootGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.root} />
                <stop offset="100%" stopColor={meta.root} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {/* Root */}
            <path
              d={paths.root}
              fill={`url(#${rootGradId})`}
              stroke={meta.rootStroke}
              strokeWidth="1"
              strokeLinejoin="round"
            />
            {/* Crown */}
            <path
              d={paths.crown}
              fill={`url(#${gradId})`}
              stroke={meta.crownStroke}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Cusp/occlusal detail */}
            {paths.cusps && (
              <path
                d={paths.cusps}
                fill="none"
                stroke={meta.crownStroke}
                strokeOpacity="0.45"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            )}
            {/* Gum line highlight */}
            <path
              d={paths.crown}
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.5"
              strokeWidth="0.6"
              strokeLinejoin="round"
              transform="translate(0 0.5)"
            />
            {state === "extracao" && (
              <>
                <line x1="6" y1="6" x2="34" y2="52" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
                <line x1="34" y1="6" x2="6" y2="52" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
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

  const row = (nums: number[], flip = false) => (
    <div className="flex gap-1 items-end">
      {nums.map((n) => (
        <Tooth
          key={n}
          num={n}
          flip={flip}
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
          <div className="flex items-end gap-3">
            {row(UPPER_RIGHT, true)}
            <div className="w-px h-10 bg-border" />
            {row(UPPER_LEFT, true)}
          </div>
          <div className="h-px w-full bg-border" />
          <div className="flex items-start gap-3">
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
