import { Link } from "react-router-dom";
import {
  GraduationCap, Microscope, Users, Trophy, BookOpen, Sparkles,
  Calculator, FlaskConical, Globe, Code, ShieldCheck, HeartHandshake, ArrowRight,
} from "lucide-react";
import SEO from "@/components/SEO";
import HeroSlider from "@/components/HeroSlider";
import SectionHeading from "@/components/SectionHeading";
import InstitutionCard from "@/components/InstitutionCard";
import ProgramCard from "@/components/ProgramCard";
import TestimonialCard from "@/components/TestimonialCard";
import EventCard from "@/components/EventCard";
import BlogCard from "@/components/BlogCard";
import SwipeRow from "@/components/SwipeRow";
import { Button } from "@/components/ui/button";
import { institutions } from "@/data/institutions";
import { events, blogs } from "@/data/highlights";

const whyUs = [
  { icon: Trophy, title: "Proven Results", description: "Consistent board toppers and high MDCAT/ECAT acceptance rates year after year." },
  { icon: Users, title: "Expert Faculty", description: "Vetted, experienced mentors who treat teaching as a craft, not a job." },
  { icon: Microscope, title: "Modern Facilities", description: "Smart classrooms, fully-equipped labs, and well-stocked libraries across campuses." },
  { icon: ShieldCheck, title: "Safe Environment", description: "Monitored campuses, vetted staff, and a culture of respect and discipline." },
  { icon: HeartHandshake, title: "Personal Mentorship", description: "Small cohorts and one-to-one guidance to ensure no student is left behind." },
  { icon: Sparkles, title: "Holistic Growth", description: "Academics, character, sports, and creativity — we develop the whole student." },
];

const programs = [
  { icon: BookOpen, title: "Foundation School", description: "Pre-Nursery through Matric with a modern integrated curriculum.", level: "School" },
  { icon: GraduationCap, title: "Intermediate Sciences", description: "FSc Pre-Medical, Pre-Engineering, ICS — Federal Board.", level: "College" },
  { icon: FlaskConical, title: "MDCAT Preparation", description: "Structured year-long medical college entry-test coaching.", level: "Academy" },
  { icon: Calculator, title: "ECAT Preparation", description: "Targeted engineering college entry-test program.", level: "Academy" },
  { icon: Globe, title: "O / A Levels", description: "Cambridge curriculum coaching by subject specialists.", level: "Academy" },
  { icon: Code, title: "CSS Foundation", description: "Foundation pathway for civil services aspirants.", level: "Academy" },
];

const testimonials = [
  { quote: "The Concept gave my daughter not just grades, but the confidence to dream bigger. The mentorship here is genuine.", name: "Ayesha Saleem", role: "Parent · Class 10" },
  { quote: "I cleared MDCAT in my first attempt. The mock-test culture and individual feedback at the Academy made the difference.", name: "Hamza Tariq", role: "Alumnus · MBBS Student" },
  { quote: "Twelve years with The Concept and the same commitment to quality every single year. A truly trusted institution.", name: "Dr. Faiza Ahmed", role: "Parent of two alumni" },
];

const Index = () => {
  return (
    <>
      <SEO
        title="The Concept Academy"
        description="The Concept Academy — focused coaching for MDCAT, ECAT, O/A Levels and CSS in Islamabad."
      />
      <HeroSlider />

      {/* About overview */}
      <section className="py-20 md:py-28">
        <div className="container grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
              About The Concept
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary mb-6 text-balance">
              One trusted brand. <span className="text-accent">Three institutions.</span> A complete journey.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-5">
              The Concept Educational System is a unified ecosystem of three flagship institutions in Islamabad — a foundation School, a results-driven College, and a competitive-exam Academy.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              From a child's first day in pre-nursery to a young adult's MDCAT or CSS success, our students grow within one consistent culture of academic excellence, character, and care.
            </p>
            <Button asChild variant="default" size="lg">
              <Link to="/about">Read Our Story <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[
              ["20+", "Years of Excellence"],
              ["3", "Specialised Institutions"],
              ["5,000+", "Successful Alumni"],
              ["200+", "Expert Faculty"],
            ].map(([n, l], i) => (
              <div key={l} className="bg-card border border-border rounded-2xl p-7 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="font-display text-4xl md:text-5xl font-bold text-primary">{n}</div>
                <div className="text-sm text-muted-foreground mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutions */}
      <section className="py-20 md:py-28 bg-secondary">
        <div className="container">
          <SectionHeading
            eyebrow="Our Institutions"
            title="Three campuses. One philosophy."
            description="Each institution stands on its own merit while drawing strength from a shared standard of excellence."
          />
          <div className="grid md:grid-cols-3 gap-7">
            {institutions.map((inst, i) => (
              <InstitutionCard
                key={inst.slug}
                title={inst.title}
                tagline={inst.tagline.split("·")[0].trim()}
                description={inst.shortDescription}
                image={inst.image}
                to={`/institutions/${inst.slug}`}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="Why Choose Us"
            title="An education built on substance, not slogans."
            description="Six reasons families across Islamabad have trusted The Concept for over two decades."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyUs.map((w, i) => (
              <ProgramCard key={w.title} {...w} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Programs Highlight */}
      <section className="py-20 md:py-28 bg-secondary">
        <div className="container">
          <SectionHeading
            eyebrow="Programs"
            title="Pathways across every stage of learning."
            description="From the first lessons of childhood to the toughest professional exams, we have a program for every ambition."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p, i) => (
              <ProgramCard key={p.title} {...p} index={i} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button asChild variant="default" size="lg">
              <Link to="/programs">View All Programs <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Events — slider */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="Campus Life"
            title="Upcoming events & milestones."
            description="From sports galas to mock-test marathons — moments that shape character beyond the classroom."
          />
          <SwipeRow ariaLabel="Upcoming events">
            {events.map((e) => <EventCard key={e.title} event={e} />)}
          </SwipeRow>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-secondary">
        <div className="container">
          <SectionHeading
            eyebrow="Voices of The Concept"
            title="What students and parents say."
          />
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Blog / Insights — slider */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            eyebrow="From the Concept Journal"
            title="Insights, guides & student stories."
            description="Practical advice from our mentors and admissions team — written to help students and parents make better decisions."
          />
          <SwipeRow ariaLabel="Latest blog posts">
            {blogs.map((b) => <BlogCard key={b.title} post={b} />)}
          </SwipeRow>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-hero-gradient text-primary-foreground p-10 md:p-16 shadow-elegant">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative max-w-3xl">
              <span className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Admissions Open</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-5 text-balance">
                Begin your child's journey at The Concept today.
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl">
                Limited seats available across our School, College, and Academy programs for the new academic session.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="hero" size="lg">
                  <Link to="/admissions">Apply Now <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline-light" size="lg">
                  <Link to="/contact">Talk to Admissions</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
