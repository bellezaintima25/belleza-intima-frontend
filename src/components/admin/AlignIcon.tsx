/** Ícono de alineación de texto (izquierda, centro, derecha) para el editor del admin. */
export default function AlignIcon({
  variant,
  className = 'h-4 w-4',
}: {
  variant: 'left' | 'center' | 'right';
  className?: string;
}) {
  // Tres líneas de distinto largo; su posición horizontal indica la alineación.
  const rows = [
    { w: 16, y: 6 },
    { w: 10, y: 12 },
    { w: 13, y: 18 },
  ];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      {rows.map((r) => {
        const x = variant === 'left' ? 4 : variant === 'right' ? 20 - r.w : 12 - r.w / 2;
        return <path key={r.y} d={`M${x} ${r.y}h${r.w}`} />;
      })}
    </svg>
  );
}
