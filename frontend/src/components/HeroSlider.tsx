import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import slide1 from "@/assets/hero-campus.jpg";
import slide2 from "@/assets/hero-lab.jpg";
import slide3 from "@/assets/hero-graduation.jpg";

interface Slide {
  image: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}

const slides: Slide[] = [
  {
    image: slide1,
    eyebrow: "Trusted Educational Brand · Islamabad",
    title: (
      <>
        Where Young Minds <span className="text-accent">Read, Rise</span> & Radiate.
      </>
    ),
    description:
      "The Concept brings together a forward-thinking School, an ambitious College, and a results-driven Academy — one trusted ecosystem from foundation years to professional success.",
    primary: { label: "Apply for Admission", to: "/admissions" },
    secondary: { label: "Discover The Concept", to: "/about" },
  },
  {
    image: slide2,
    eyebrow: "Modern Labs · Real Discovery",
    title: (
      <>
        Curiosity Meets <span className="text-accent">World-Class</span> Facilities.
      </>
    ),
    description:
      "Fully equipped science, computing and language labs across our campuses — built for hands-on learning and authentic scientific inquiry.",
    primary: { label: "Explore Programs", to: "/programs" },
    secondary: { label: "Visit a Campus", to: "/contact" },
  },
  {
    image: slide3,
    eyebrow: "Class of 2025 · Proven Outcomes",
    title: (
      <>
        Shaping <span className="text-accent">Tomorrow's Leaders</span>, Today.
      </>
    ),
    description:
      "From board toppers to MDCAT, ECAT and CSS achievers — our alumni walk into the country's best institutions with confidence.",
    primary: { label: "Meet Our Alumni", to: "/about" },
    secondary: { label: "Why The Concept", to: "/about" },
  },
];

const AUTOPLAY_MS = 6500;

const HeroSlider = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  const go = (i: number) => setActive(((i % slides.length) + slides.length) % slides.length);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-primary">
      {/* Background slides — crossfade with ken-burns */}
      {slides.map((s, i) => (
        <div
          key={i}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={s.image}
            alt=""
            width={1920}
            height={1080}
            className={`absolute inset-0 w-full h-full object-cover ${
              i === active ? "animate-ken-burns" : ""
            }`}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />

      <div className="container relative z-10 py-24">
        <div className="max-w-3xl text-primary-foreground">
          {slides.map((s, i) =>
            i === active ? (
              <div key={i}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs uppercase tracking-[0.25em] bg-accent/20 text-accent rounded-full border border-accent/40 backdrop-blur-sm animate-fade-in">
                  <Award className="h-3.5 w-3.5" /> {s.eyebrow}
                </span>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 text-balance animate-fade-up">
                  {s.title}
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/85 mb-9 max-w-2xl text-balance animate-fade-up [animation-delay:120ms]">
                  {s.description}
                </p>
                <div className="flex flex-wrap gap-4 animate-fade-up [animation-delay:240ms]">
                  <Button asChild variant="hero" size="lg">
                    <Link to={s.primary.to}>
                      {s.primary.label} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline-light" size="lg">
                    <Link to={s.secondary.to}>{s.secondary.label}</Link>
                  </Button>
                </div>
              </div>
            ) : null
          )}

          <div className="mt-14 grid grid-cols-3 gap-6 max-w-xl animate-fade-up [animation-delay:360ms]">
            {[
              ["3", "Institutions"],
              ["20+", "Years of Trust"],
              ["5,000+", "Alumni"],
            ].map(([n, l]) => (
              <div key={l} className="border-l-2 border-accent pl-4">
                <div className="font-display text-3xl md:text-4xl font-bold text-accent">{n}</div>
                <div className="text-xs uppercase tracking-wider text-primary-foreground/70 mt-1">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 right-6 md:right-10 z-20 flex items-center gap-3">
        <button
          onClick={() => go(active - 1)}
          aria-label="Previous slide"
          className="h-11 w-11 grid place-items-center rounded-full border border-primary-foreground/30 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent transition-spring backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(active + 1)}
          aria-label="Next slide"
          className="h-11 w-11 grid place-items-center rounded-full border border-primary-foreground/30 text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent transition-spring backdrop-blur-sm"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === active ? "w-10 bg-accent" : "w-4 bg-primary-foreground/40 hover:bg-primary-foreground/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
