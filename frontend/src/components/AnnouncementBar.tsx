import { Megaphone, Sparkles, CalendarDays, Trophy, GraduationCap } from "lucide-react";

const items = [
  { icon: GraduationCap, text: "Admissions Open 2026 — Apply now for School, College & Academy" },
  { icon: Trophy, text: "Concept toppers secured 1,180+ in MDCAT 2025" },
  { icon: CalendarDays, text: "Annual Sports Gala — Saturday, 16 May 2026" },
  { icon: Sparkles, text: "New ECAT Crash Course starts 1 June" },
  { icon: Megaphone, text: "Parent–Teacher Meeting · 24 May 2026" },
];

const Row = ({ ariaHidden = false }: { ariaHidden?: boolean }) => (
  <div
    aria-hidden={ariaHidden}
    className="flex shrink-0 items-center gap-12 px-6"
  >
    {items.map(({ icon: Icon, text }, i) => (
      <span key={i} className="flex items-center gap-2 text-xs md:text-sm font-medium whitespace-nowrap">
        <Icon className="h-4 w-4 text-accent" />
        <span>{text}</span>
        <span className="text-accent/70 ml-8">•</span>
      </span>
    ))}
  </div>
);

const AnnouncementBar = () => (
  <div className="bg-primary text-primary-foreground border-b border-primary-glow/40">
    <div className="relative overflow-hidden mask-fade-x">
      <div className="flex w-max animate-marquee py-2.5">
        <Row />
        <Row ariaHidden />
      </div>
    </div>
  </div>
);

export default AnnouncementBar;
