import { createdByLabel, type CreatedByUser } from "@/lib/createdBy";

export default function CreatedByLine({
  createdBy,
  className = "",
}: {
  createdBy?: CreatedByUser | string | null;
  className?: string;
}) {
  const label = createdByLabel(createdBy);
  if (label === "—") return null;
  return (
    <p
      className={`text-[15px] leading-tight text-muted-foreground/90 ${className}`.trim()}
    >
      Created by <span className="text-muted-foreground">{label}</span>
    </p>
  );
}
