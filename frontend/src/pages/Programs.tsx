import {
  BookOpen, GraduationCap, FlaskConical, Calculator, Globe, Code,
  Microscope, Languages, Brain, BookMarked, ScrollText, Atom,
} from "lucide-react";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import ProgramCard from "@/components/ProgramCard";

const groups = [
  {
    label: "School Programs",
    items: [
      { icon: BookOpen, title: "Pre-Nursery to KG", description: "A warm, play-based introduction to learning, language and social skills.", level: "Foundation" },
      { icon: BookMarked, title: "Primary (Class 1–5)", description: "Building strong literacy, numeracy and curiosity using an integrated curriculum.", level: "Primary" },
      { icon: ScrollText, title: "Middle (Class 6–8)", description: "Subject specialisation begins with focus on critical thinking and writing.", level: "Middle" },
      { icon: Atom, title: "Matric Science / Computer", description: "Federal Board Class 9–10 with rigorous practice and consistent assessment.", level: "Matric" },
    ],
  },
  {
    label: "College Programs",
    items: [
      { icon: Microscope, title: "FSc Pre-Medical", description: "Biology, Chemistry, Physics with embedded MDCAT readiness throughout.", level: "FSc" },
      { icon: Calculator, title: "FSc Pre-Engineering", description: "Maths, Physics, Chemistry with ECAT-aligned problem solving.", level: "FSc" },
      { icon: Code, title: "ICS — Computer Science", description: "Physics, Maths and Computer Science for future engineers and developers.", level: "ICS" },
      { icon: Languages, title: "I.Com / FA Humanities", description: "Strong commerce and humanities streams for diverse university pathways.", level: "Intermediate" },
    ],
  },
  {
    label: "Academy Programs",
    items: [
      { icon: FlaskConical, title: "MDCAT Preparation", description: "Comprehensive year-long medical entry-test program with weekly mocks.", level: "Test Prep" },
      { icon: Calculator, title: "ECAT Preparation", description: "Engineering entry-test coaching tailored for top universities.", level: "Test Prep" },
      { icon: Globe, title: "O / A Levels Coaching", description: "Cambridge curriculum specialists for every major subject.", level: "Cambridge" },
      { icon: Brain, title: "CSS / PMS Foundation", description: "Structured foundation for civil services aspirants — essay, current affairs, optional subjects.", level: "Civil Services" },
      { icon: GraduationCap, title: "IELTS Preparation", description: "Targeted training for Academic and General IELTS modules.", level: "Language" },
    ],
  },
];

const Programs = () => (
  <>
    <SEO
      title="Programs & Courses — The Concept Educational System"
      description="Explore all programs across The Concept School, College and Academy — from Pre-Nursery and Matric to MDCAT, ECAT, O/A Levels, IELTS, and CSS preparation."
    />
    <PageHeader
      eyebrow="Programs"
      title="A pathway for every ambition."
      description="From a child's first lessons to the country's toughest professional exams — explore our full catalogue across all three institutions."
    />

    <div className="py-20 md:py-28 space-y-20">
      {groups.map((g) => (
        <section key={g.label} className="container">
          <SectionHeading eyebrow={g.label.split(" ")[0]} title={g.label} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {g.items.map((item, i) => (
              <ProgramCard key={item.title} {...item} index={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  </>
);

export default Programs;
