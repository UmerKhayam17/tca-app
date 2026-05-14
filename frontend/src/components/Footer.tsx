import { Link } from "react-router-dom";
import { Mail, Phone, Clock, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-24">
      <div className="container py-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="The Concept logo" className="h-12 w-auto bg-background/95 rounded p-1" width={120} height={48} loading="lazy" />
            <div>
              <div className="font-display text-xl font-bold">The Concept</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-accent">Read | Rise | Radiate</div>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/75 leading-relaxed">
            A complete educational ecosystem nurturing minds from foundation to professional excellence — School, College & Academy under one trusted brand.
          </p>
          <div className="flex gap-3 mt-6">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social media"
                className="h-9 w-9 grid place-items-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold mb-4 text-accent">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {[
              ["Home", "/"],
              ["About Us", "/about"],
              ["Programs", "/programs"],
              ["Admissions", "/admissions"],
              ["Faculty", "/faculty"],
              ["Contact", "/contact"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="text-primary-foreground/75 hover:text-accent transition-smooth">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold mb-4 text-accent">Institutions</h3>
          <ul className="space-y-2 text-sm">
            {[
              ["The Concept School", "/institutions/school"],
              ["The Concept College", "/institutions/college"],
              ["The Concept Academy", "/institutions/academy"],
            ].map(([label, to]) => (
              <li key={to}>
                <Link to={to} className="text-primary-foreground/75 hover:text-accent transition-smooth">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-semibold mb-4 text-accent">Get in Touch</h3>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-3">
              <Phone className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div>0300-1009989</div>
                <div>0306-1009989</div>
              </div>
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <a href="mailto:theconceptacademyislamabad@gmail.com" className="break-all hover:text-accent">
                theconceptacademyislamabad@gmail.com
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                <div>Morning: 8:00 AM – 2:00 PM</div>
                <div>Evening: 4:00 PM – 9:00 PM</div>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <span>Islamabad, Pakistan</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-primary-foreground/60">
          <p>© {new Date().getFullYear()} The Concept Educational System. All rights reserved.</p>
          <p>Read | Rise | Radiate</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
