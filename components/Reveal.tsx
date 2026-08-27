export function Reveal({
  delay = 0,
  children,
  className = "",
}: {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`settle ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
