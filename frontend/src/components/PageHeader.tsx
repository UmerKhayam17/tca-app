interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

const PageHeader = ({ eyebrow, title, description }: PageHeaderProps) => (
  <section className="bg-hero-gradient text-primary-foreground relative overflow-hidden">
    <div className="absolute inset-0 opacity-20" style={{
      backgroundImage:
        "radial-gradient(circle at 20% 20%, hsl(var(--accent) / 0.5) 0%, transparent 40%), radial-gradient(circle at 80% 80%, hsl(var(--accent) / 0.3) 0%, transparent 50%)",
    }} />
    <div className="container relative py-20 md:py-28 text-center">
      {eyebrow && (
        <span className="inline-block px-4 py-1.5 mb-5 text-xs uppercase tracking-[0.25em] bg-accent/20 text-accent rounded-full border border-accent/30 animate-fade-in">
          {eyebrow}
        </span>
      )}
      <h1 className="font-display text-4xl md:text-6xl font-bold mb-5 text-balance animate-fade-up">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl mx-auto text-lg text-primary-foreground/80 text-balance animate-fade-up [animation-delay:120ms]">
          {description}
        </p>
      )}
    </div>
  </section>
);

export default PageHeader;
