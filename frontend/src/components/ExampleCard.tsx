import type { ReactNode } from "react";
import { PedagogyCard } from "./PedagogyCard";

interface ExampleCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

/** Exemple analogue (pas le même exercice) — halo ciel. */
export function ExampleCard({ children, footer }: ExampleCardProps) {
  return (
    <PedagogyCard
      tone="example"
      label="Un exemple que tu connais"
      footer={footer}
    >
      {children}
    </PedagogyCard>
  );
}
