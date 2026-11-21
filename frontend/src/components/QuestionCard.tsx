import type { ReactNode } from "react";
import { PedagogyCard } from "./PedagogyCard";

interface QuestionCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

/** Question guide de Lumio — halo soleil, « Question pour toi ». */
export function QuestionCard({ children, footer }: QuestionCardProps) {
  return (
    <PedagogyCard tone="question" label="Question pour toi" footer={footer}>
      {children}
    </PedagogyCard>
  );
}
