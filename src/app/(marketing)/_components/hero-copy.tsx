"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

export function HeroCopy() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-start gap-6">

      <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl">
        {t("home.headlineA")}{" "}
        <span className="accent-text">{t("home.headlineAccent")}</span>{" "}
        {t("home.headlineB")}
      </h1>
      <p className="max-w-lg text-pretty text-lg leading-relaxed text-ink-muted">
        {t("home.sub")}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard/overview">
            {t("home.deploy")} <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/pricing">{t("home.viewPricing")}</Link>
        </Button>
      </div>
    </div>
  );
}
