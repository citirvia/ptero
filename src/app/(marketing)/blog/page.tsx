import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Container, Section } from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { formatDate } from "@/lib/utils";
import { POSTS } from "./_components/posts";

export const metadata: Metadata = {
  title: "Blog — Ptero",
  description:
    "Product updates, engineering deep-dives and practical guides from the team building Ptero.",
};

function Byline({
  author,
  date,
  readMin,
}: {
  author: string;
  date: string;
  readMin: number;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-muted">
      <span className="flex items-center gap-2">
        <Avatar name={author} className="size-6" />
        <span className="text-ink-secondary">{author}</span>
      </span>
      <span>·</span>
      <span>{formatDate(date)}</span>
      <span>·</span>
      <span className="flex items-center gap-1">
        <Clock className="size-3" />
        {readMin} min
      </span>
    </div>
  );
}

export default function BlogPage() {
  const featured = POSTS.find((p) => p.featured) ?? POSTS[0];
  const rest = POSTS.filter((p) => p.slug !== featured.slug);

  return (
    <>
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-32 left-1/2 size-[560px] -translate-x-1/2" />
        <Container className="relative py-16 sm:py-20">
          <div className="flex flex-col items-start gap-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-accent-soft">
              <span className="size-1.5 rounded-full bg-accent-soft" />
              The Ptero Blog
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Building reliable <span className="accent-text">infrastructure</span>,
              in public
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
              Product launches, engineering deep-dives and practical guides from
              the team running bots and services on bare-metal.
            </p>
          </div>
        </Container>
      </section>

      <Section className="py-14 sm:py-16">
        <Container className="flex flex-col gap-12">
          {/* Featured */}
          <Reveal>
            <Link href={`/blog/${featured.slug}`} className="group block">
              <Card hover className="grid items-stretch gap-0 overflow-hidden lg:grid-cols-2">
                <div className="relative hidden min-h-[280px] overflow-hidden bg-gradient-to-br from-accent/25 via-accent-deep/10 to-card lg:block">
                  <GridBackdrop />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[120px] font-bold leading-none text-accent-soft/20">
                      {featured.tag.slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-7 sm:p-9">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{featured.tag}</Badge>
                    <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-muted">
                      Featured
                    </span>
                  </div>
                  <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent-soft sm:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="text-pretty leading-relaxed text-ink-muted">
                    {featured.excerpt}
                  </p>
                  <div className="mt-auto flex flex-col gap-4">
                    <Byline
                      author={featured.author}
                      date={featured.date}
                      readMin={featured.readMin}
                    />
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-soft">
                      Read article
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </Reveal>

          {/* Grid */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 0.06}>
                <Link href={`/blog/${post.slug}`} className="group block h-full">
                  <Card hover className="flex h-full flex-col gap-4 p-6">
                    <Badge variant="outline" className="w-fit">
                      {post.tag}
                    </Badge>
                    <h3 className="text-balance text-lg font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-accent-soft">
                      {post.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-muted">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto pt-2">
                      <Byline
                        author={post.author}
                        date={post.date}
                        readMin={post.readMin}
                      />
                    </div>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
