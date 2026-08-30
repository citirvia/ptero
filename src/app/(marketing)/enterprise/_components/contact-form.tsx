"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { useSubmitSalesLead } from "@/lib/api/hooks";

const TEAM_SIZES = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

export function ContactForm() {
  const submitLead = useSubmitSalesLead();
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    submitLead.mutate(
      {
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        company: String(form.get("company") ?? "").trim(),
        teamSize: String(form.get("size") ?? "").trim(),
        message: String(form.get("message") ?? "").trim() || undefined,
        website: String(form.get("website") ?? "").trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          e.currentTarget.reset();
          toast.success("Your enterprise inquiry has been received.");
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-hairline bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required placeholder="Selim Melih" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" required placeholder="Acme Inc." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="size">Team size</Label>
          <select
            id="size"
            name="size"
            defaultValue=""
            required
            className="flex h-10 w-full rounded-xl border border-line bg-bg px-3.5 text-sm text-ink transition-colors duration-200 hover:border-line-hover focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="" disabled>
              Select…
            </option>
            {TEAM_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} people
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">What are you looking to deploy?</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Tell us about your workloads, compliance needs and timeline…"
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-fit" disabled={submitLead.isPending}>
        Talk to sales
        <ArrowRight className="size-4" />
      </Button>

      <p className="text-xs leading-relaxed text-ink-muted">
        {submitted
          ? "Thanks. We stored your request and the team can follow up from the details you sent."
          : "Submissions go straight into the sales intake queue with duplicate and spam checks enabled."}
      </p>
    </form>
  );
}
