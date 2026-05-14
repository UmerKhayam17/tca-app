import { Phone, Mail, Clock } from "lucide-react";
import SEO from "@/components/SEO";
import PageHeader from "@/components/PageHeader";
import AdmissionForm from "@/components/AdmissionForm";

const Admissions = () => (
  <>
    <SEO
      title="Admissions — The Concept Educational System"
      description="Apply for admission to The Concept School, College or Academy. Submit our online application form and our admissions team will reach out within 24 hours."
    />
    <PageHeader
      eyebrow="Admissions Open"
      title="Begin your journey with The Concept."
      description="Fill out the form below and our admissions team will guide you through the next steps within 24 hours."
    />

    <section className="py-20 md:py-28">
      <div className="container grid lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-7 md:p-10 shadow-card">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">Application Form</h2>
            <p className="text-muted-foreground mb-7">Fields marked with * are required.</p>
            <AdmissionForm />
          </div>
        </div>

        {/* Info column */}
        <aside className="space-y-6">
          <div className="bg-hero-gradient text-primary-foreground rounded-2xl p-7 shadow-elegant">
            <h3 className="font-display text-xl font-bold mb-3 text-accent">What happens next?</h3>
            <ol className="space-y-3 text-sm text-primary-foreground/85">
              {["We review your application within 24 hours.", "Our admissions officer contacts you to schedule an assessment or visit.", "You receive an offer and complete enrolment."].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-accent text-accent-foreground font-semibold text-xs grid place-items-center">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-card border border-border rounded-2xl p-7 shadow-card space-y-4">
            <h3 className="font-display text-lg font-bold text-primary">Need help?</h3>
            <div className="flex gap-3 text-sm">
              <Phone className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div>0300-1009989</div>
                <div>0306-1009989</div>
                <div>0332-2009989</div>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <Mail className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <a href="mailto:theconceptacademyislamabad@gmail.com" className="break-all hover:text-primary">
                theconceptacademyislamabad@gmail.com
              </a>
            </div>
            <div className="flex gap-3 text-sm">
              <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div>Morning: 8:00 AM – 2:00 PM</div>
                <div>Evening: 4:00 PM – 9:00 PM</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </>
);

export default Admissions;
