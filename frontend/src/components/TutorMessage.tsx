import type { ReactNode } from "react";
import { ChatBubble } from "./ChatBubble";
import { ExampleCard } from "./ExampleCard";
import { HintCard, type HintLevel } from "./HintCard";
import { QuestionCard } from "./QuestionCard";
import { SafetyMessage } from "./SafetyMessage";
import { SuccessMoment } from "./SuccessMoment";

/** Types de message de Lumio exposés par l'API (`message.kind`). */
export type TutorKind =
  "question" | "hint" | "example" | "success" | "explanation" | "safety";

interface TutorMessageProps {
  kind?: string | null;
  hintLevel?: number | null;
  children: ReactNode;
  footer?: ReactNode;
  /** coupe les animations (historique rechargé) */
  animated?: boolean;
}

/**
 * Aiguille un message de Lumio vers sa carte. Repli robuste : type absent ou
 * inconnu → bulle assistant normale.
 */
export function TutorMessage({
  kind,
  hintLevel,
  children,
  footer,
  animated = true,
}: TutorMessageProps) {
  switch (kind) {
    case "question":
      return <QuestionCard footer={footer}>{children}</QuestionCard>;
    case "hint": {
      const level =
        hintLevel === 1 || hintLevel === 2 || hintLevel === 3
          ? (hintLevel as HintLevel)
          : null;
      return (
        <HintCard level={level} footer={footer}>
          {children}
        </HintCard>
      );
    }
    case "example":
      return <ExampleCard footer={footer}>{children}</ExampleCard>;
    case "success":
      return <SuccessMoment animated={animated}>{children}</SuccessMoment>;
    case "safety":
      return <SafetyMessage>{children}</SafetyMessage>;
    default:
      return (
        <div className="flex flex-col gap-2">
          <ChatBubble role="assistant">{children}</ChatBubble>
          {footer}
        </div>
      );
  }
}
