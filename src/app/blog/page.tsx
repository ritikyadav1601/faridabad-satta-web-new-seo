import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPublishedBlogs } from "@/lib/blogs-mongodb";
import { SITE_URL } from "@/lib/site";

// Full blog archive index. Previously there was no page like this — the
// only place posts were linked from was the homepage's "Latest Blogs"
// section, capped at 12 and newest-first, so older posts had no page
// linking to them at all (orphaned from both crawlers and visitors) even
// though each post's own page was individually reachable. This page and
// its sitemap entries (src/app/sitemap.ts) fix that: every published post
// stays discoverable regardless of how many newer posts get added.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog | Faridabad Satta",
  description:
    "Articles and updates about Faridabad, Gali, Ghaziabad, Desawar and other regional satta result charts, explained.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

function plainText(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function BlogIndexPage() {
  const posts = await getAllPublishedBlogs();

  return (
    <main className="min-h-screen bg-[var(--surface-page)] px-2.5 py-4 md:px-5 md:py-6">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-blue-700">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-gray-800">Blog</li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Blog
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Articles and updates about Faridabad, Gali, Ghaziabad, Desawar and other regional
            satta result charts.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            No articles published yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              if (!post.slug) return null;
              const excerpt = plainText(post.content);
              const preview =
                excerpt.length > 160 ? `${excerpt.slice(0, 160).trimEnd()}…` : excerpt;
              const publishedDate = post.createdAt ? new Date(post.createdAt) : null;
              const hasValidDate = publishedDate && !Number.isNaN(publishedDate.getTime());

              return (
                <Link
                  key={post.id}
                  href={`/blog/${encodeURIComponent(post.slug)}`}
                  className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
                >
                  <article>
                    {post.image && (
                      <div className="relative h-44 w-full">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          loading="lazy"
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="p-4 md:p-5">
                      {hasValidDate && (
                        <time
                          className="text-[11px] font-bold uppercase tracking-wide text-slate-400"
                          dateTime={post.createdAt}
                        >
                          {new Intl.DateTimeFormat("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(publishedDate!)}
                        </time>
                      )}
                      <h2 className="mt-1.5 text-base font-black leading-snug text-slate-900 group-hover:text-amber-700">
                        {post.title}
                      </h2>
                      {preview && (
                        <p className="mt-2 line-clamp-3 text-sm text-slate-500">{preview}</p>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
