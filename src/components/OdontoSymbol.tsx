export function OdontoSymbol({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 1 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Espelho odontológico */}
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="14" />
      {/* Serpente ao redor do cajado */}
      <path d="M9 14c-1.5 0-2.5 1-2.5 2.5S8 19 9 19s2.5-1 2.5-2.5" />
      <path d="M15 14c1.5 1.5 2.5 2.5 2.5 4S16 21 15 21s-2.5-1-2.5-2.5" />
      {/* Dente abaixo */}
      <path d="M10 17c0 1.5.5 4 2 4s2-2.5 2-4" />
      <path d="M14 17c-
0 1.5-.5 4-2 4s-2-2.5-2-4" />
      {/* Cajado central */}
      <line x1="12" y1="5" x2="12" y2="22" />
    </svg>
  );
}
