interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Icône par défaut : étincelle (SVG inline, jamais d'emoji). */
function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-12 w-12 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </svg>
  );
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 flex items-center justify-center rounded-full bg-primary-light p-4">
        {icon ?? <DefaultIcon />}
      </span>
      <h3 className="mb-2 text-subheading font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mb-4 max-w-sm text-body text-foreground-muted leading-body">{description}</p>
      )}
      {action}
    </div>
  );
}
