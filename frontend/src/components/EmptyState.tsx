interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "\u{1F4ED}",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 text-[3rem]">{icon}</span>
      <h3 className="mb-2 text-subheading font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mb-4 max-w-sm text-body text-foreground-muted">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
