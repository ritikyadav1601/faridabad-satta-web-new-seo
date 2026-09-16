import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedBlogBySlug } from "@/lib/blogs-mongodb";
import { SITE_URL } from "@/lib/site";

type BlogPageProps = { params: Promise<{ slug: string }> };

export const revalidate = 20;

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogBySlug(decodeURIComponent(slug));
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || plainText(post.content).slice(0, 160);
  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const image = absoluteUrl(post.image);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: post.createdAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      images: image ? [image] : [],
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, images: image ? [image] : [] },
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogBySlug(decodeURIComponent(slug));
  if (!post) notFound();

  const publishedDate = post.createdAt ? new Date(post.createdAt) : null;
  const hasValidDate = publishedDate && !Number.isNaN(publishedDate.getTime());
  const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || plainText(post.content).slice(0, 160),
    image: absoluteUrl(post.image) || undefined,
    datePublished: post.createdAt || undefined,
    dateModified: post.updatedAt || post.createdAt || undefined,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Faridabad Satta", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Faridabad Satta", url: SITE_URL },
  };

  return (
    <main className="mx-auto max-w-4xl px-3 py-8 sm:px-5 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <article className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {post.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt={post.title} className="max-h-[34rem] w-full object-cover" />
        )}
        <div className="p-5 md:p-9">
          {hasValidDate && (
            <time className="text-xs font-semibold uppercase tracking-wide text-gray-400" dateTime={post.createdAt}>
              {new Intl.DateTimeFormat("en-IN", {
                timeZone: "Asia/Kolkata",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(publishedDate)}
            </time>
          )}
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-5xl">{post.title}</h1>
          <div
            className="mt-6 text-base leading-8 text-gray-700 [&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-4 [&_ul]:list-disc"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>
    </main>
  );
}

function absoluteUrl(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

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
