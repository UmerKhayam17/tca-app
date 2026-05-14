import schoolImg from "@/assets/school.jpg";
import collegeImg from "@/assets/college.jpg";
import academyImg from "@/assets/academy.jpg";

export type Institution = {
  slug: string;
  title: string;
  tagline: string;
  shortDescription: string;
  overview: string;
  programs: string[];
  facilities: string[];
  timings: { label: string; hours: string }[];
  image: string;
};

export const institutions: Institution[] = [
  {
    slug: "school",
    title: "The Concept School",
    tagline: "Foundation Years · Pre-Nursery to Matric",
    shortDescription:
      "A nurturing environment where curiosity is sparked, character is shaped, and lifelong learning begins.",
    overview:
      "The Concept School builds strong academic foundations from the very first years. Our integrated curriculum balances the national syllabus with critical thinking, creativity, and moral development — preparing every child for a confident future.",
    programs: [
      "Pre-Nursery to KG",
      "Primary (Class 1 – 5)",
      "Middle (Class 6 – 8)",
      "Matric — Science & Computer (9 – 10)",
    ],
    facilities: [
      "Spacious, air-conditioned classrooms",
      "Science, computer & language labs",
      "Dedicated junior play & activity zones",
      "Daily transport on safe, monitored routes",
      "Qualified, vetted teaching faculty",
    ],
    timings: [
      { label: "Classes", hours: "Monday – Friday · 8:00 AM – 2:00 PM" },
      { label: "Office", hours: "Monday – Saturday · 8:00 AM – 5:00 PM" },
    ],
    image: schoolImg,
  },
  {
    slug: "college",
    title: "The Concept College",
    tagline: "Intermediate · FSc, ICS, I.Com & FA",
    shortDescription:
      "Where intermediate students transform into board toppers and university-ready scholars.",
    overview:
      "The Concept College delivers a rigorous intermediate program with a sharp focus on Federal Board excellence and entry-test readiness. Small batches, expert subject specialists, and continuous assessment create a culture of consistent achievement.",
    programs: [
      "FSc Pre-Medical",
      "FSc Pre-Engineering",
      "ICS (Physics · Maths · Computer)",
      "I.Com & FA Humanities",
    ],
    facilities: [
      "Well-equipped Physics, Chemistry & Biology labs",
      "Digital classrooms with smart boards",
      "Library with research-grade reference material",
      "Dedicated entry-test (MDCAT/ECAT) coaching",
      "Career counselling & university guidance",
    ],
    timings: [
      { label: "Morning Session", hours: "Monday – Saturday · 8:00 AM – 2:00 PM" },
      { label: "Evening Session", hours: "Monday – Saturday · 4:00 PM – 7:00 PM" },
    ],
    image: collegeImg,
  },
  {
    slug: "academy",
    title: "The Concept Academy",
    tagline: "Test Prep · MDCAT, ECAT, O/A Levels, CSS",
    shortDescription:
      "Result-driven coaching for the country's most competitive entrance and professional exams.",
    overview:
      "The Concept Academy is our flagship coaching wing — a focused environment designed for high performers. From MDCAT and ECAT to O/A Levels and CSS foundation, our expert mentors deliver structured curriculum, weekly mocks, and one-to-one mentorship.",
    programs: [
      "MDCAT Comprehensive Preparation",
      "ECAT Engineering Preparation",
      "O Levels & A Levels Coaching",
      "CSS / PMS Foundation Course",
      "IELTS Preparation",
    ],
    facilities: [
      "Weekly full-length mock examinations",
      "Detailed performance analytics for every student",
      "One-to-one doubt-clearing sessions",
      "Curated test-prep notes and question banks",
      "Quiet study halls with extended hours",
    ],
    timings: [
      { label: "Day Sessions", hours: "Monday – Saturday · 9:00 AM – 1:00 PM" },
      { label: "Evening Sessions", hours: "Monday – Saturday · 4:00 PM – 9:00 PM" },
    ],
    image: academyImg,
  },
];

export const getInstitution = (slug: string) =>
  institutions.find((i) => i.slug === slug);
