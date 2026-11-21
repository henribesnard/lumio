import { Illustration, type IllustrationName } from "./Illustration";

interface EmptyStateProps {
  /** icône personnalisée ; sinon l'illustration est utilisée */
  icon?: React.ReactNode;
  illustration?: IllustrationName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  illustration = "notes",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="mb-4 flex items-center justify-center">
        {icon ?? <Illustration name={illustration} />}
      </span>
      <h3 className="mb-2 font-display text-subheading font-bold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-body leading-body text-foreground-muted">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
