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
      className={`rounded-card bg-surface p-6 shadow-card ${
        onClick
          ? "cursor-pointer text-left transition-all duration-fast ease-out hover:shadow-modal hover:-translate-y-0.5 focus:outline-none active:translate-y-0"
          : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
