import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(2, "Subject is required").max(150),
  message: z.string().trim().min(5, "Please write a message").max(1000),
});

type FormState = z.infer<typeof schema>;
type Errors = Partial<Record<keyof FormState, string>>;

const ContactForm = () => {
  const [data, setData] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData((d) => ({ ...d, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(data);
    if (!result.success) {
      const errs: Errors = {};
      result.error.issues.forEach((i) => (errs[i.path[0] as keyof FormState] = i.message));
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setData({ name: "", email: "", subject: "", message: "" });
      toast({ title: "Message sent", description: "We'll get back to you shortly." });
    }, 700);
  };

  const cls = (k: keyof FormState) => (errors[k] ? "border-destructive focus-visible:ring-destructive" : "");

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="cname">Name *</Label>
          <Input id="cname" value={data.name} onChange={update("name")} className={cls("name")} maxLength={100} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="cemail">Email *</Label>
          <Input id="cemail" type="email" value={data.email} onChange={update("email")} className={cls("email")} maxLength={255} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="csubject">Subject *</Label>
        <Input id="csubject" value={data.subject} onChange={update("subject")} className={cls("subject")} maxLength={150} />
        {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
      </div>
      <div>
        <Label htmlFor="cmessage">Message *</Label>
        <Textarea id="cmessage" rows={5} value={data.message} onChange={update("message")} className={cls("message")} maxLength={1000} />
        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
      </div>
      <Button type="submit" variant="hero" size="lg" disabled={submitting}>
        {submitting ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
};

export default ContactForm;
