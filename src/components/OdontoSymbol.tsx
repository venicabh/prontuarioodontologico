export function OdontoSymbol({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Espelho odontológico (círculo no topo) */}
      <circle cx="12" cy="4.5" r="2.5" />
      {/* Haste do espelho */}
      <line x1="12" y1="7" x2="12" y2="13" />
      {/* Serpente enrolada no cajado */}
      <path d="M9 13c-1.5 0-2.5 1-2.5 2.5S8 18 9 18s2.5-1 2.5-2.5" />
      <path d="M15 13c1.5 0 2.5 1 2.5 2.5S16 18 15 18s-2.5-1-2.5-2.5" />
      {/* Dente estilizado na base */}
      <path d="M10.5 18c0 1.3.3 3.5 1.5 3.5s1.5-2.2 1.5-3.5" />
      <path d="M13.5 18c0 1.3-.3 3.5-1.5 3.5s-1.5-2.2-1.5-3.5" />
      {/* Cajado central */}
      <line x1="12" y1="4.5" x2="12" y2="21.5" />
    </svg>
  );
}
