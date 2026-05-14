import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";

type Member = { name: string; role: string; subject?: string; initials: string };

const groups: { title: string; members: Member[] }[] = [
  {
    title: "Leadership",
    members: [
      { name: "Mian Imran Khaliq", role: "Chief Executive Officer", initials: "IK" },
      { name: "Prof. Dr. Saima Riaz", role: "Director Academics", initials: "SR" },
      { name: "Mr. Adnan Mehmood", role: "Director Operations", initials: "AM" },
    ],
  },
  {
    title: "School Faculty",
    members: [
      { name: "Ms. Nadia Hussain", role: "Principal · School", subject: "English Literature", initials: "NH" },
      { name: "Mr. Bilal Akhtar", role: "Senior Teacher", subject: "Mathematics", initials: "BA" },
      { name: "Ms. Hira Sheikh", role: "Coordinator · Primary", subject: "General Science", initials: "HS" },
      { name: "Mr. Farhan Qureshi", role: "Senior Teacher", subject: "Computer Studies", initials: "FQ" },
    ],
  },
  {
    title: "College Faculty",
    members: [
      { name: "Prof. Tariq Mahmood", role: "HOD · Physics", subject: "Physics", initials: "TM" },
      { name: "Dr. Sana Javed", role: "Senior Lecturer", subject: "Biology", initials: "SJ" },
      { name: "Mr. Usman Ali", role: "Senior Lecturer", subject: "Chemistry", initials: "UA" },
      { name: "Ms. Mehreen Iqbal", role: "Senior Lecturer", subject: "Mathematics", initials: "MI" },
    ],
  },
  {
    title: "Academy Mentors",
    members: [
      { name: "Dr. Hassan Raza", role: "Lead Mentor · MDCAT", subject: "Biology & Chemistry", initials: "HR" },
      { name: "Engr. Zeeshan Khan", role: "Lead Mentor · ECAT", subject: "Physics & Maths", initials: "ZK" },
      { name: "Mr. Daniel James", role: "Lead Mentor · O/A Levels", subject: "Mathematics", initials: "DJ" },
      { name: "Mr. Ahmed Sultan", role: "Lead Mentor · CSS", subject: "Current Affairs & Essay", initials: "AS" },
    ],
  },
];

const Avatar = ({ initials }: { initials: string }) => (
  <div className="h-20 w-20 rounded-full bg-gold-gradient text-accent-foreground grid place-items-center font-display text-2xl font-bold shadow-gold mx-auto mb-4">
    {initials}
  </div>
);

const Faculty = () => (
  <>
    <SEO
      title="Faculty & Team — The Concept Educational System"
      description="Meet the leadership and faculty behind The Concept Educational System — experienced educators committed to excellence at every level."
    />
    <PageHeader
      eyebrow="Our People"
      title="The minds behind The Concept."
      description="Behind every result is a teacher who cared. Meet the leadership and faculty members who make our institutions what they are."
    />

    {/* Academic Council band */}
    <section className="py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="container relative grid lg:grid-cols-3 gap-10 items-center">
        <div className="lg:col-span-2">
          <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
            Academic Council
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-balance">
            A council of senior educators guiding every classroom decision.
          </h2>
          <p className="text-primary-foreground/80 leading-relaxed max-w-2xl">
            Our Academic Council brings together principals, subject heads, board examiners and entry-test specialists. Together they review syllabi, set assessment standards and mentor teaching staff — ensuring that what happens in our classrooms reflects the very best in modern pedagogy.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            ["40+", "Senior Educators"],
            ["12+", "Subject Heads"],
            ["20+", "Years Avg. Experience"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-accent">{n}</div>
              <div className="text-[11px] uppercase tracking-wider text-primary-foreground/70 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <div className="py-20 md:py-28 space-y-20">
      {groups.map((g) => (
        <section key={g.title} className="container">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary text-center mb-10">{g.title}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {g.members.map((m, i) => (
              <article
                key={m.name}
                className="bg-card border border-border rounded-2xl p-7 text-center shadow-card hover:shadow-elegant hover:-translate-y-1 transition-smooth animate-fade-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <Avatar initials={m.initials} />
                <h3 className="font-display text-lg font-semibold text-primary">{m.name}</h3>
                <p className="text-sm text-accent font-medium mt-1">{m.role}</p>
                {m.subject && <p className="text-xs text-muted-foreground mt-1">{m.subject}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  </>
);

export default Faculty;
