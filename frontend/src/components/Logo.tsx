interface LogoProps {
  /** logo horizontal complet (icône + wordmark) ; false = icône seule */
  withWordmark?: boolean;
  height?: number;
  className?: string;
}

/**
 * Logo Lumio. Assets vectoriels dans public/brand/ (voir scripts/generate-brand.py).
 * Le wordmark est en chemins SVG (Lexend 700 vectorisé) : rendu identique partout.
 */
export function Logo({
  withWordmark = true,
  height = 40,
  className = "",
}: LogoProps) {
  return (
    <img
      src={withWordmark ? "/brand/lumio-logo.svg" : "/brand/lumio-icon.svg"}
      alt="Lumio"
      height={height}
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}
