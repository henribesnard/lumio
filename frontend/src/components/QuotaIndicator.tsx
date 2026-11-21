interface QuotaIndicatorProps {
  remaining: number;
  total: number;
  className?: string;
}

/**
 * Quota du jour, présenté positivement : jauge prisme + phrase encourageante.
 * Jamais de rouge, jamais de compte à rebours ; à zéro, on dit « à demain ».
 */
export function QuotaIndicator({
  remaining,
  total,
  className = "",
}: QuotaIndicatorProps) {
  const safeTotal = Math.max(1, total);
  const clamped = Math.max(0, Math.min(remaining, safeTotal));
  const percent = Math.round((clamped / safeTotal) * 100);
  const label =
    clamped > 0
      ? `Encore ${clamped} message${clamped > 1 ? "s" : ""} aujourd'hui`
      : "À demain pour de nouvelles questions !";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-[0.45em] w-[5.5em] overflow-hidden rounded-full bg-surface-alt"
        role="progressbar"
        aria-label="Messages restants aujourd'hui"
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={clamped}
        aria-valuetext={label}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-med ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-tiny text-foreground-muted">{label}</p>
    </div>
  );
}
