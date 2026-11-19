interface BadgeProps {
  variant?: "info" | "warning" | "critical" | "success";
  children: React.ReactNode;
}

export function Badge({ variant = "info", children }: BadgeProps) {
  const styles = {
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
    critical: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
