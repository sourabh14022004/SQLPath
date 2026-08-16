export default function Icon({
  name,
  className = '',
  filled = false,
  size,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
        ...(size ? { fontSize: size } : {}),
      }}
    >
      {name}
    </span>
  );
}
