import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface InstitutionCardProps {
  title: string;
  tagline: string;
  description: string;
  image: string;
  to: string;
  index?: number;
}

const InstitutionCard = ({ title, tagline, description, image, to, index = 0 }: InstitutionCardProps) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-2xl shadow-card hover:shadow-elegant transition-smooth animate-fade-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <div className="aspect-[4/5] overflow-hidden">
      <img
        src={image}
        alt={`${title} — ${tagline}`}
        loading="lazy"
        width={1024}
        height={768}
        className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-700"
      />
    </div>
    <div className="absolute inset-0 bg-overlay-gradient" />
    <div className="absolute inset-0 p-7 flex flex-col justify-end text-primary-foreground">
      <span className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{tagline}</span>
      <h3 className="font-display text-3xl font-bold mb-3">{title}</h3>
      <p className="text-sm text-primary-foreground/85 mb-5 line-clamp-3">{description}</p>
      <span className="inline-flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-smooth">
        Explore <ArrowRight className="h-4 w-4" />
      </span>
    </div>
  </Link>
);

export default InstitutionCard;
