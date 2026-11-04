/** Medidor semicircular (0–150%) — equivalente ao “% Realizado” do relatório original. */
export function Medidor({ valor, rotulo }: { valor: number; rotulo: string }) {
  const MAX = 150;
  const v = Math.max(0, Math.min(valor, MAX));
  const R = 70;
  const C = Math.PI * R; // comprimento do semicírculo
  const cor = valor >= 100 ? "var(--ok)" : valor >= 85 ? "var(--warn)" : "var(--bad)";
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${rotulo}: ${Math.round(valor)}%`}>
      <svg viewBox="0 0 180 100" className="w-full max-w-52">
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="var(--border)" strokeWidth="16" strokeLinecap="round" />
        <path
          d="M20 90 A70 70 0 0 1 160 90"
          fill="none"
          stroke={cor}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(v / MAX) * C} ${C}`}
        />
        {/* marca de 100% */}
        <line x1="90" y1="14" x2="90" y2="28" stroke="var(--muted)" strokeWidth="2" transform={`rotate(${(100 / MAX) * 180 - 90} 90 90)`} />
        <text x="90" y="82" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--fg)">
          {Math.round(valor)}%
        </text>
      </svg>
      <span className="-mt-1 text-sm font-medium text-muted">{rotulo}</span>
    </div>
  );
}
