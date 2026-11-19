interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-card bg-surface p-6 shadow-card ${onClick ? "cursor-pointer transition-shadow hover:shadow-modal" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
