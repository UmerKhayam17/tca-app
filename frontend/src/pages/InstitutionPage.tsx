import { useParams, Link, Navigate } from "react-router-dom";
import { CheckCircle2, Clock, ArrowRight, BookOpen } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { getInstitution } from "@/data/institutions";

const InstitutionPage = () => {
  const { slug } = useParams();
  const inst = slug ? getInstitution(slug) : undefined;

  if (!inst) return <Navigate to="/" replace />;

  return (
    <>
      <SEO
        title={`${inst.title} — The Concept Educational System`}
        description={inst.shortDescription}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={inst.image}
          alt={inst.title}
          loading="eager"
          width={1024}
          height={768}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        <div className="container relative py-24 md:py-32 text-primary-foreground">
          <span className="inline-block px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.25em] bg-accent/20 text-accent rounded-full border border-accent/40">
            {inst.tagline}
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-5 max-w-3xl text-balance animate-fade-up">
            {inst.title}
          </h1>
          <p className="max-w-2xl text-lg text-primary-foreground/85 animate-fade-up [animation-delay:120ms]">
            {inst.shortDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/admissions">Apply for Admission <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <Link to="/contact">Visit Campus</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20 md:py-28">
        <div className="container max-w-4xl">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">Overview</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6">A purposeful learning environment.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{inst.overview}</p>
        </div>
      </section>

      {/* Programs + Facilities */}
      <section className="py-20 md:py-28 bg-secondary">
        <div className="container grid md:grid-cols-2 gap-10">
          <div className="bg-card rounded-2xl p-8 md:p-10 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-lg bg-gold-gradient grid place-items-center shadow-gold">
                <BookOpen className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">Programs Offered</h3>
            </div>
            <ul className="space-y-3">
              {inst.programs.map((p) => (
                <li key={p} className="flex gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-2xl p-8 md:p-10 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-lg bg-gold-gradient grid place-items-center shadow-gold">
                <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">Facilities</h3>
            </div>
            <ul className="space-y-3">
              {inst.facilities.map((f) => (
                <li key={f} className="flex gap-3 text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Timings */}
      <section className="py-20 md:py-28">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">Timings</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">When we're in session.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {inst.timings.map((t) => (
              <div key={t.label} className="bg-card border border-border rounded-2xl p-7 shadow-card flex gap-4 items-start hover:shadow-elegant transition-smooth">
                <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold text-primary">{t.label}</div>
                  <div className="text-muted-foreground mt-1">{t.hours}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default InstitutionPage;
