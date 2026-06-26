import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";

/**
 * "Talk to us" — placeholder contact form. Validates with zod, shows a friendly
 * confirmation on submit, but does NOT send anywhere yet. A real endpoint
 * (Formspree/Resend/our API) drops into `onSubmit` later without UI changes.
 */
const schema = z.object({
  name: z.string().min(1, "Tell us your name."),
  email: z.string().email("Enter a valid email."),
  message: z.string().min(10, "A sentence or two helps us help you."),
});
type Values = z.infer<typeof schema>;

const inputCls =
  "h-11 w-full rounded-md border border-border bg-card px-3 text-sm transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (_values: Values) => {
    // Placeholder — no network call yet. Wire a real endpoint here later.
    await new Promise((r) => setTimeout(r, 400));
    setSent(true);
    toast.success("Thanks — we'll be in touch.");
    reset();
  };

  if (sent) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-pqc/15 text-pqc">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold tracking-tight">Thanks — we'll be in touch.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We read every message. Expect a reply at the email you gave us.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Send another →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="glass space-y-4 rounded-2xl p-6 text-left sm:p-8"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <input
            {...register("name")}
            autoComplete="name"
            className={inputCls}
            placeholder="Ada Lovelace"
          />
        </Field>
        <Field label="Work email" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            className={inputCls}
            placeholder="ada@acme.com"
          />
        </Field>
      </div>
      <Field label="What's on your mind?" error={errors.message?.message}>
        <textarea
          {...register("message")}
          rows={4}
          className={`${inputCls} h-auto resize-none py-2.5`}
          placeholder="We're mapping our post-quantum migration and want to see Aegis on our domains…"
        />
      </Field>
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:px-6"
      >
        <Send className="h-4 w-4" /> {isSubmitting ? "Sending…" : "Talk to us"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-shor">{error}</span>}
    </label>
  );
}
