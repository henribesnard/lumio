interface LogoProps {
  /** logo horizontal complet (prisme + wordmark) ; false = icône seule */
  withWordmark?: boolean;
  height?: number;
  className?: string;
  /** encre claire pour les fonds sombres (registre 9-14) */
  onDark?: boolean;
}

/**
 * Logo Lumio « Prisme ». Assets vectoriels dans public/brand/
 * (voir scripts/generate-brand.py) : wordmark Unbounded 800 vectorisé.
 */
export function Logo({
  withWordmark = true,
  height = 40,
  className = "",
  onDark = false,
}: LogoProps) {
  const src = withWordmark
    ? onDark
      ? "/brand/lumio-logo-dark.svg"
      : "/brand/lumio-logo.svg"
    : "/brand/lumio-icon.svg";
  return (
    <img
      src={src}
      alt="Lumio"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}
