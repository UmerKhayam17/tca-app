import eventSports from "@/assets/event-sports.jpg";
import eventScience from "@/assets/event-sciencefair.jpg";
import eventPtm from "@/assets/event-ptm.jpg";
import blogMdcat from "@/assets/blog-mdcat.jpg";
import blogStudy from "@/assets/blog-studyhabits.jpg";
import blogMentor from "@/assets/blog-mentor.jpg";
import type { EventItem } from "@/components/EventCard";
import type { BlogItem } from "@/components/BlogCard";

export const events: EventItem[] = [
  {
    image: eventSports,
    date: "16 May",
    year: "2026",
    title: "Annual Sports Gala 2026",
    location: "Main Campus Ground",
    description:
      "A full day of athletics, team sports and house competitions across all three institutions.",
  },
  {
    image: eventScience,
    date: "08 Jun",
    year: "2026",
    title: "Inter-House Science Fair",
    location: "College Auditorium",
    description:
      "Students showcase original projects in physics, chemistry, biology and computing — judged by industry experts.",
  },
  {
    image: eventPtm,
    date: "24 May",
    year: "2026",
    title: "Parent–Teacher Meeting",
    location: "All Campuses",
    description:
      "Term-end progress review with subject teachers, mentors and academic coordinators.",
  },
  {
    image: eventSports,
    date: "12 Jul",
    year: "2026",
    title: "MDCAT Mock Test Marathon",
    location: "Academy Block",
    description:
      "Six full-length, full-syllabus mock tests in three days with detailed performance analytics.",
  },
];

export const blogs: BlogItem[] = [
  {
    image: blogMdcat,
    category: "Exam Prep",
    title: "How to Crack MDCAT in Your First Attempt — A 12-Month Plan",
    excerpt:
      "A realistic month-by-month strategy from our top MDCAT mentors covering syllabus, mocks and stress control.",
    author: "Dr. Hassan Raza",
    readTime: "8 min read",
  },
  {
    image: blogStudy,
    category: "Study Skills",
    title: "Five Study Habits That Separate A-Graders from the Rest",
    excerpt:
      "Active recall, spaced repetition, deep work — the proven techniques our toppers use every single day.",
    author: "Ms. Samina Khan",
    readTime: "6 min read",
  },
  {
    image: blogMentor,
    category: "Parenting",
    title: "Why Personal Mentorship Outperforms Bigger Class Sizes",
    excerpt:
      "Research-backed insight into how one-to-one mentorship transforms outcomes from primary years onward.",
    author: "Mr. Imran Ali",
    readTime: "5 min read",
  },
  {
    image: blogMdcat,
    category: "Career",
    title: "Choosing Between Pre-Medical & Pre-Engineering — A Decision Guide",
    excerpt:
      "A clear framework to help students and parents make the right intermediate stream choice.",
    author: "Counselling Desk",
    readTime: "7 min read",
  },
];
