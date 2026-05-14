import { Trophy, Star, Quote, Medal, Crown } from "lucide-react";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";

type Topper = {
  name: string;
  marks: string;
  exam: string;
  university: string;
  initials: string;
  highlight?: boolean;
};

const mdcatToppers: Topper[] = [
  { name: "Ayesha Tariq",     marks: "192/200", exam: "MDCAT 2025", university: "AKU Karachi",    initials: "AT", highlight: true },
  { name: "Hamza Sheikh",     marks: "189/200", exam: "MDCAT 2025", university: "KEMU Lahore",    initials: "HS" },
  { name: "Maryam Iqbal",     marks: "187/200", exam: "MDCAT 2025", university: "RMU Rawalpindi", initials: "MI" },
  { name: "Bilal Ahmad",      marks: "185/200", exam: "MDCAT 2025", university: "AIMC Lahore",    initials: "BA" },
  { name: "Fatima Noor",      marks: "184/200", exam: "MDCAT 2025", university: "Nishtar Multan", initials: "FN" },
  { name: "Zain ul Abideen",  marks: "183/200", exam: "MDCAT 2025", university: "SMC Karachi",    initials: "ZA" },
  { name: "Rabia Hassan",     marks: "182/200", exam: "MDCAT 2025", university: "QAMC Bahawalpur",initials: "RH" },
  { name: "Usman Riaz",       marks: "181/200", exam: "MDCAT 2025", university: "PMC Faisalabad", initials: "UR" },
  { name: "Hira Saleem",      marks: "180/200", exam: "MDCAT 2025", university: "DG Khan Medical",initials: "HS" },
  { name: "Ali Hamza",        marks: "179/200", exam: "MDCAT 2025", university: "Sahiwal Medical",initials: "AH" },
];

const ecatToppers: Topper[] = [
  { name: "Saad Mehmood",     marks: "395/400", exam: "ECAT 2025", university: "NUST Islamabad", initials: "SM", highlight: true },
  { name: "Arif Khan",        marks: "388/400", exam: "ECAT 2025", university: "GIKI Topi",      initials: "AK" },
  { name: "Mahnoor Javed",    marks: "382/400", exam: "ECAT 2025", university: "FAST Lahore",    initials: "MJ" },
  { name: "Rehan Aslam",      marks: "379/400", exam: "ECAT 2025", university: "UET Lahore",     initials: "RA" },
  { name: "Sana Yousaf",      marks: "375/400", exam: "ECAT 2025", university: "PIEAS",          initials: "SY" },
  { name: "Daniyal Munir",    marks: "371/400", exam: "ECAT 2025", university: "COMSATS",        initials: "DM" },
];

const parents = [
  {
    name: "Mrs. Asma Tariq",
    relation: "Parent · MDCAT 2025",
    quote:
      "What sets The Concept Academy apart is the personal attention. My daughter was treated like a person, not a roll number. Her mentor knew her strengths, her weaknesses and her stress points — and worked through every one.",
  },
  {
    name: "Mr. Tahir Sheikh",
    relation: "Parent · ECAT 2025",
    quote:
      "We tried two large academies before. The Concept was different from the very first week — weekly mocks, honest feedback, and real teachers who returned our calls. The result speaks for itself: NUST, first attempt.",
  },
  {
    name: "Mrs. Nighat Iqbal",
    relation: "Parent · O-Level 2024",
    quote:
      "From the school years all the way to A-Level coaching, The Concept has been our second home. The discipline, the values, the academic rigour — it is exactly the environment every parent hopes for.",
  },
  {
    name: "Dr. Rashid Mahmood",
    relation: "Parent · MDCAT 2024",
    quote:
      "As a doctor myself, I appreciated how seriously the faculty took the medical syllabus. Real subject specialists, not generalists. My son cleared MDCAT comfortably and is now in his second year at AKU.",
  },
];

const TopperCard = ({ t }: { t: Topper }) => (
  <article
    className={`group relative rounded-2xl p-5 text-center border transition-smooth hover:-translate-y-1 ${
      t.highlight
        ? "bg-gold-gradient border-accent/50 shadow-gold"
        : "bg-card border-border shadow-card hover:shadow-elegant"
    }`}
  >
    {t.highlight && (
      <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 text-accent-foreground bg-accent rounded-full p-1 shadow-gold" />
    )}
    <div
      className={`h-20 w-20 mx-auto mb-4 rounded-full grid place-items-center font-display text-2xl font-bold shadow-card ${
        t.highlight
          ? "bg-primary text-primary-foreground"
          : "bg-gold-gradient text-accent-foreground"
      }`}
    >
      {t.initials}
    </div>
    <h3 className={`font-display text-lg font-semibold ${t.highlight ? "text-accent-foreground" : "text-primary"}`}>
      {t.name}
    </h3>
    <div className={`text-xs mt-1 ${t.highlight ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
      {t.exam}
    </div>
    <div
      className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
        t.highlight
          ? "bg-primary text-primary-foreground"
          : "bg-primary/10 text-primary"
      }`}
    >
      <Star className="h-3 w-3" /> {t.marks}
    </div>
    <div className={`mt-3 text-xs font-medium ${t.highlight ? "text-accent-foreground/90" : "text-accent"}`}>
      {t.university}
    </div>
  </article>
);

const Achievements = () => (
  <>
    <SEO
      title="High Achievers — The Concept Educational System"
      description="Meet the high achievers of The Concept Academy — MDCAT, ECAT and O/A-Level toppers, plus testimonials from parents who trusted us with their children's future."
    />
    <PageHeader
      eyebrow="High Achievers"
      title="Success speaks louder than promises."
      description="Year after year, our students walk into the country's most competitive medical, engineering and professional institutions. These are some of the faces behind those results."
    />

    {/* Headline stats */}
    <section className="py-16 md:py-20 bg-secondary">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Trophy, n: "1,200+", l: "Entry-Test Selections" },
            { icon: Medal, n: "350+", l: "MDCAT Qualifiers" },
            { icon: Star, n: "180+", l: "ECAT Selections" },
            { icon: Crown, n: "60+", l: "Board Position Holders" },
          ].map((s, i) => (
            <div
              key={s.l}
              className="bg-card rounded-2xl p-7 text-center shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-12 w-12 mx-auto rounded-xl bg-gold-gradient grid place-items-center mb-4 shadow-gold">
                <s.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">{s.n}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* MDCAT toppers */}
    <section className="py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="MDCAT 2025"
          title="MDCAT Success Stories"
          description="A glimpse of the brilliant minds who topped Pakistan's most competitive medical entry test from The Concept Academy."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {mdcatToppers.map((t) => (
            <TopperCard key={t.name} t={t} />
          ))}
        </div>
      </div>
    </section>

    {/* ECAT toppers */}
    <section className="py-20 md:py-28 bg-secondary">
      <div className="container">
        <SectionHeading
          eyebrow="ECAT 2025"
          title="Engineering High Achievers"
          description="Future engineers of NUST, GIKI, FAST, UET and PIEAS — all from a single academic year at The Concept Academy."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {ecatToppers.map((t) => (
            <TopperCard key={t.name} t={t} />
          ))}
        </div>
      </div>
    </section>

    {/* Parents Speak */}
    <section className="py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Parents Speak"
          title="What parents say about The Concept Academy."
          description="Real words from the families who entrusted us with their children's most important academic years."
        />
        <div className="grid md:grid-cols-2 gap-6">
          {parents.map((p, i) => (
            <article
              key={p.name}
              className="relative bg-card border border-border rounded-2xl p-8 shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-accent/30" />
              <p className="text-muted-foreground leading-relaxed italic mb-6">"{p.quote}"</p>
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="h-12 w-12 rounded-full bg-gold-gradient text-accent-foreground grid place-items-center font-display font-bold shadow-gold">
                  {p.name.split(" ").slice(-1)[0][0]}
                </div>
                <div>
                  <div className="font-display font-semibold text-primary">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.relation}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default Achievements;
