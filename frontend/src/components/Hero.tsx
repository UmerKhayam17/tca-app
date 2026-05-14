import { Link } from "react-router-dom";
import { ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-campus.jpg";

const Hero = () => (
  <section className="relative min-h-[92vh] flex items-center overflow-hidden">
    <img
      src={hero}
      alt="The Concept Educational System campus at golden hour"
      width={1920}
      height={1080}
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
    <div className="container relative z-10 py-24">
      <div className="max-w-3xl text-primary-foreground">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs uppercase tracking-[0.25em] bg-accent/20 text-accent rounded-full border border-accent/40 backdrop-blur-sm animate-fade-in">
          <Award className="h-3.5 w-3.5" /> Trusted Educational Brand · Islamabad
        </span>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 text-balance animate-fade-up">
          Where Young Minds <span className="text-accent">Read, Rise</span> & Radiate.
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/85 mb-9 max-w-2xl text-balance animate-fade-up [animation-delay:120ms]">
          The Concept brings together a forward-thinking School, an ambitious College, and a results-driven Academy — one trusted ecosystem from foundation years to professional success.
        </p>
        <div className="flex flex-wrap gap-4 animate-fade-up [animation-delay:240ms]">
          <Button asChild variant="hero" size="lg">
            <Link to="/admissions">
              Apply for Admission <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline-light" size="lg">
            <Link to="/about">Discover The Concept</Link>
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-6 max-w-xl animate-fade-up [animation-delay:360ms]">
          {[
            ["3", "Institutions"],
            ["20+", "Years of Trust"],
            ["5,000+", "Alumni"],
          ].map(([n, l]) => (
            <div key={l} className="border-l-2 border-accent pl-4">
              <div className="font-display text-3xl md:text-4xl font-bold text-accent">{n}</div>
              <div className="text-xs uppercase tracking-wider text-primary-foreground/70 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
