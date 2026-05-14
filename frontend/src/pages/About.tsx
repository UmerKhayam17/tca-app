import { Target, Eye, Heart, BookOpenCheck, Users2, LineChart, ShieldCheck, GraduationCap, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import ceo from "@/assets/ceo.jpg";

const whyUs = [
  {
    icon: BookOpenCheck,
    title: "Result-Driven Curriculum",
    text: "Every course is reverse-engineered from the latest MDCAT, ECAT, NUST, NET, ETEA, GRE and FAST entry tests — so students study exactly what wins marks.",
  },
  {
    icon: Users2,
    title: "Personal Mentorship",
    text: "Small batches, named mentors and one-to-one doubt-clearing sessions ensure no student drifts unseen — a level of attention impossible at mega-academies.",
  },
  {
    icon: LineChart,
    title: "Weekly Performance Analytics",
    text: "Full-length mocks every week with detailed score reports, percentile rankings and chapter-wise weakness mapping shared with both student and parent.",
  },
  {
    icon: ShieldCheck,
    title: "Disciplined, Safe Environment",
    text: "Monitored campuses, vetted faculty and a culture of mutual respect — a place parents trust and students feel genuinely at home in.",
  },
  {
    icon: GraduationCap,
    title: "Proven Alumni Network",
    text: "Five thousand-plus graduates now studying at AKU, KEMU, NUST, GIKI, FAST, LUMS, QAU and across the world's leading universities.",
  },
  {
    icon: Sparkles,
    title: "Top-Tier Academic Council",
    text: "Curriculum and pedagogy guided by an Academic Council of senior educators, subject heads and exam-board specialists.",
  },
];

const About = () => (
  <>
    <SEO
      title="About Us — The Concept Educational System"
      description="Learn about The Concept Educational System — our story, vision, mission, and a personal message from CEO Mian Imran Khaliq."
    />
    <PageHeader
      eyebrow="About"
      title="Two decades of building futures."
      description="The Concept Educational System is more than a brand — it is a community committed to academic excellence, character, and the genuine success of every student."
    />

    {/* Intro */}
    <section className="py-20 md:py-28">
      <div className="container max-w-4xl">
        <SectionHeading
          eyebrow="Our Story"
          title="An institution built around the student."
        />
        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>
            The Concept Educational System was founded with a simple but powerful idea: education should not be fragmented. A child should be able to grow within one trusted environment — from the first day of school all the way through professional exam preparation.
          </p>
          <p>
            From that vision, three institutions were born — <span className="text-primary font-semibold">The Concept School</span>, <span className="text-primary font-semibold">The Concept College</span>, and <span className="text-primary font-semibold">The Concept Academy</span>. Each is a specialist in its own right, yet all share the same standard of academic rigour, mentorship, and care.
          </p>
          <p>
            Today, thousands of alumni carry the values learned at The Concept into universities and professions across Pakistan and beyond. Our greatest pride is not in numbers, but in the lives we help shape.
          </p>
        </div>
      </div>
    </section>

    {/* Vision Mission Values */}
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <SectionHeading eyebrow="What We Stand For" title="Vision, Mission & Values" />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Eye,
              title: "Our Vision",
              text: "To be Pakistan's most trusted educational ecosystem — where every student discovers their potential and the courage to pursue it.",
            },
            {
              icon: Target,
              title: "Our Mission",
              text: "To deliver consistent academic excellence across all stages of learning, nurturing knowledge, character, and confidence in equal measure.",
            },
            {
              icon: Heart,
              title: "Our Values",
              text: "Integrity, mentorship, discipline, and a deep, personal commitment to every student's growth — academically and personally.",
            },
          ].map((v, i) => (
            <div
              key={v.title}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-smooth animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-14 w-14 rounded-xl bg-gold-gradient grid place-items-center mb-5 shadow-gold">
                <v.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary mb-3">{v.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CEO Message */}
    <section className="py-20 md:py-28">
      <div className="container grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
        <div className="lg:col-span-2">
          <div className="relative">
            <div className="absolute -inset-4 bg-gold-gradient rounded-3xl rotate-3 opacity-20" />
            <img
              src={ceo}
              alt="Mian Imran Khaliq, CEO of The Concept Educational System"
              loading="lazy"
              width={768}
              height={896}
              className="relative rounded-3xl shadow-elegant w-full"
            />
          </div>
        </div>
        <div className="lg:col-span-3">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
            Message from the CEO
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6 text-balance">
            "Every child who walks through our doors carries a future worth our very best work."
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              At The Concept, we have always believed that education is a deeply personal responsibility. It is not enough to teach a syllabus — we must teach the student. We must understand who they are, what they dream of, and what stands in their way.
            </p>
            <p>
              For more than two decades, our teachers, mentors, and staff have committed themselves to that idea. The result is an institution where excellence is the standard, not the exception, and where every student is seen, heard, and supported.
            </p>
            <p>
              Whether your child is starting their very first class or preparing for the most competitive exams of their career, you have my personal commitment that they will receive an education worthy of their potential.
            </p>
          </div>
          <div className="mt-7 pt-6 border-t border-border">
            <div className="font-display text-xl font-bold text-primary">Mian Imran Khaliq</div>
            <div className="text-sm text-muted-foreground">Chief Executive Officer · The Concept Educational System</div>
          </div>
        </div>
      </div>
    </section>

    {/* Why Choose The Concept Academy */}
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <SectionHeading
          eyebrow="The Concept Advantage"
          title="Why parents and students choose The Concept Academy."
          description="Six concrete reasons our students consistently outperform — every batch, every board, every entry test."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyUs.map((w, i) => (
            <article
              key={w.title}
              className="group relative bg-card rounded-2xl p-7 border border-border shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth animate-fade-up overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gold-gradient opacity-10 group-hover:opacity-20 transition-smooth" />
              <div className="relative h-12 w-12 rounded-xl bg-primary/10 grid place-items-center mb-5 group-hover:bg-gold-gradient transition-smooth">
                <w.icon className="h-6 w-6 text-primary group-hover:text-accent-foreground transition-smooth" />
              </div>
              <h3 className="relative font-display text-xl font-bold text-primary mb-2">{w.title}</h3>
              <p className="relative text-muted-foreground leading-relaxed text-sm">{w.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default About;
