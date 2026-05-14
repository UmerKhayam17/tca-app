interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

const SectionHeading = ({ eyebrow, title, description, align = "center" }: SectionHeadingProps) => (
  <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""} mb-14`}>
    {eyebrow && (
      <span className="inline-block text-xs uppercase tracking-[0.25em] text-accent font-semibold mb-3">
        {eyebrow}
      </span>
    )}
    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary text-balance">
      {title}
    </h2>
    {description && (
      <p className="mt-4 text-muted-foreground text-lg text-balance">{description}</p>
    )}
  </div>
);

export default SectionHeading;
