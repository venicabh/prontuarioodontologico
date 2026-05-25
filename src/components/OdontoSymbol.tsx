export function OdontoSymbol({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <img
      src="/odonto-logo.png"
      alt="Símbolo da Odontologia"
      className={`${className} object-contain`}
    />
  );
}
