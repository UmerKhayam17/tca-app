import { LucideIcon } from "lucide-react";

interface ProgramCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  level?: string;
  index?: number;
}

const ProgramCard = ({ icon: Icon, title, description, level, index = 0 }: ProgramCardProps) => (
  <article
    className="group relative bg-card border border-border rounded-2xl p-7 hover:border-accent/60 hover:-translate-y-1 transition-smooth shadow-card hover:shadow-elegant animate-fade-up"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    {level && (
      <span className="absolute top-5 right-5 text-[10px] uppercase tracking-wider text-accent-foreground bg-accent px-2.5 py-1 rounded-full font-semibold">
        {level}
      </span>
    )}
    <div className="h-14 w-14 rounded-xl bg-gold-gradient grid place-items-center mb-5 shadow-gold group-hover:scale-110 transition-smooth">
      <Icon className="h-6 w-6 text-accent-foreground" />
    </div>
    <h3 className="font-display text-xl font-semibold text-primary mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </article>
);

export default ProgramCard;
