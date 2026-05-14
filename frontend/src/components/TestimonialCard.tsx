import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  index?: number;
}

const TestimonialCard = ({ quote, name, role, index = 0 }: TestimonialCardProps) => (
  <figure
    className="bg-card border border-border rounded-2xl p-8 shadow-card relative animate-fade-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <Quote className="h-10 w-10 text-accent/30 mb-3" />
    <blockquote className="text-foreground/85 leading-relaxed mb-6 italic">"{quote}"</blockquote>
    <figcaption>
      <div className="font-display text-lg font-semibold text-primary">{name}</div>
      <div className="text-sm text-muted-foreground">{role}</div>
    </figcaption>
  </figure>
);

export default TestimonialCard;
