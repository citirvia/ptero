import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Container } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { GlowOrb, GridBackdrop } from "@/components/decor";
import { formatDate } from "@/lib/utils";
import { POSTS, getPost } from "../_components/posts";
import { CodeBlock } from "../../docs/_components/code-block";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article — Ptero" };
  return { title: `${post.title} — Ptero Blog`, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <section className="relative overflow-hidden border-b border-hairline">
        <GridBackdrop />
        <GlowOrb className="-top-32 left-1/2 size-[520px] -translate-x-1/2" />
        <Container className="relative py-14 sm:py-16">
          <div className="mx-auto flex max-w-3xl flex-col items-start gap-5">
            <Link
              href="/blog"
              className="focus-ring inline-flex items-center gap-1.5 rounded-md text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              All posts
            </Link>
            <Badge variant="accent">{post.tag}</Badge>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <span className="flex items-center gap-2.5">
                <Avatar name={post.author} className="size-8" />
                <span className="flex flex-col">
                  <span className="font-medium text-ink-secondary">{post.author}</span>
                  <span className="text-xs">{post.authorRole}</span>
                </span>
              </span>
              <Separator orientation="vertical" className="h-8" />
              <span>{formatDate(post.date)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {post.readMin} min read
              </span>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        <article className="mx-auto flex max-w-3xl flex-col gap-6">
          {post.body.map((block, i) => {
            switch (block.type) {
              case "h2":
                return (
                  <h2
                    key={i}
                    className="mt-4 text-2xl font-semibold tracking-tight text-ink"
                  >
                    {block.text}
                  </h2>
                );
              case "code":
                return (
                  <CodeBlock key={i} lang={block.lang} code={block.text ?? ""} />
                );
              case "quote":
                return (
                  <blockquote
                    key={i}
                    className="border-l-2 border-accent-soft bg-accent/5 py-4 pl-5 pr-4 text-pretty text-lg italic leading-relaxed text-ink-secondary"
                  >
                    {block.text}
                  </blockquote>
                );
              case "list":
                return (
                  <ul key={i} className="flex flex-col gap-2.5 text-[17px] text-ink-secondary">
                    {block.items?.map((item, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent-soft" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              default:
                return (
                  <p
                    key={i}
                    className="text-pretty text-[17px] leading-[1.75] text-ink-secondary"
                  >
                    {block.text}
                  </p>
                );
            }
          })}

          <Separator className="my-6" />

          <div className="flex items-center gap-3">
            <Avatar name={post.author} className="size-11" />
            <div>
              <p className="font-medium text-ink">{post.author}</p>
              <p className="text-sm text-ink-muted">{post.authorRole} · Ptero</p>
            </div>
          </div>
        </article>

        {/* Related */}
        <div className="mx-auto mt-16 max-w-3xl">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Keep reading
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group block h-full">
                <div className="card-base flex h-full flex-col gap-3 p-5 transition-all duration-300 hover:border-hairline2 hover:shadow-glow">
                  <Badge variant="outline" className="w-fit">
                    {p.tag}
                  </Badge>
                  <h3 className="text-balance font-semibold leading-snug text-ink transition-colors group-hover:text-accent-soft">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {p.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </>
  );
}
