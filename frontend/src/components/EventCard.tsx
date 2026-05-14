import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface EventItem {
  image: string;
  date: string; // e.g. "16 May"
  year: string;
  title: string;
  location: string;
  description: string;
  to?: string;
}

const EventCard = ({ event }: { event: EventItem }) => (
  <article className="group h-full bg-card border border-border rounded-2xl overflow-hidden shadow-card hover-lift">
    <div className="relative aspect-[16/10] overflow-hidden">
      <img
        src={event.image}
        alt={event.title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-110 transition-spring duration-700"
      />
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl px-3 py-2 text-center shadow-card border border-border">
        <div className="font-display text-xl font-bold text-primary leading-none">
          {event.date.split(" ")[0]}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {event.date.split(" ")[1]} {event.year}
        </div>
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-accent" />
          {event.date} {event.year}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-accent" />
          {event.location}
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-primary mb-2 group-hover:text-accent transition-smooth">
        {event.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {event.description}
      </p>
      <Link
        to={event.to ?? "#"}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary story-link"
      >
        Event details <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </article>
);

export default EventCard;
