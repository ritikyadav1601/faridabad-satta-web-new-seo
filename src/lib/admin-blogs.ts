import "server-only";

import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

async function getDb() {
  const uri = process.env.TOP_GAMES_MONGODB_URI;
  if (!uri) throw new Error("TOP_GAMES_MONGODB_URI is not configured");
  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }
  return (await clientPromise).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
}

export function cleanBlogSlug(value = "") {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function sanitizeBlogHtml(value = "") {
  let html = String(value)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg)\b[^>]*\/?\s*>/gi, "");
  // "img" is allowed so inline images inserted through the Tiptap editor
  // survive saving — it previously wasn't in this list (left over from
  // when the old editor had no way to insert images at all), which silently
  // stripped every inline/clickable image out of post bodies on save.
  const allowed = new Set(["p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "ul", "ol", "li", "blockquote", "a", "img"]);
  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tagName, attributes) => {
    const tag = String(tagName).toLowerCase();
    if (!allowed.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;
    if (tag === "br") return "<br>";
    if (tag === "img") {
      const src = String(attributes).match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || "";
      return /^(https?:\/\/|\/)/i.test(src) ? `<img src="${src.replace(/["<>]/g, "")}" alt="">` : "";
    }
    if (tag !== "a") return `<${tag}>`;
    const href = String(attributes).match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    return /^(https?:\/\/|\/)/i.test(href) ? `<a href="${href.replace(/["<>]/g, "")}" rel="noopener noreferrer">` : "<a>";
  });
  return html.trim();
}

function serialize(post: Record<string, unknown>) {
  return { ...post, _id: String(post._id), createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt, updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt };
}

export async function listAdminBlogPosts() {
  const posts = await (await getDb()).collection<Record<string, unknown>>(process.env.BLOG_POSTS_COLLECTION || "blogposts").find({}).sort({ updatedAt: -1 }).toArray();
  return posts.map(serialize);
}

export async function saveBlogPost(input: Record<string, unknown>) {
  const db = await getDb();
  const collection = db.collection(process.env.BLOG_POSTS_COLLECTION || "blogposts");
  const slug = cleanBlogSlug(String(input.slug || input.title || ""));
  const originalSlug = cleanBlogSlug(String(input.originalSlug || slug));
  const title = String(input.title || "").trim();
  const metaTitle = String(input.metaTitle || "").trim();
  const metaDescription = String(input.metaDescription || "").trim();
  const content = sanitizeBlogHtml(String(input.content || ""));
  if (!slug || !title || !metaTitle || !metaDescription || !content.replace(/<[^>]*>/g, "").trim()) throw new Error("Complete all required blog fields.");
  if (originalSlug !== slug && await collection.findOne({ slug })) throw new Error("Another blog already uses this slug.");
  const now = new Date();
  const existing = await collection.findOne({ slug: originalSlug });
  await collection.updateOne({ slug: originalSlug }, { $set: { slug, title, metaTitle, metaDescription, content, image: String(input.image || "").trim(), published: true, updatedAt: now }, $setOnInsert: { createdAt: now } }, { upsert: true });
  return serialize((await collection.findOne({ slug })) || existing || {});
}

export async function deleteBlogPost(slug: string) {
  const result = await (await getDb()).collection(process.env.BLOG_POSTS_COLLECTION || "blogposts").findOneAndDelete({ slug: cleanBlogSlug(slug) });
  if (!result) throw new Error("Blog post not found.");
}

export async function uploadBlogImage(file: File) {
  const db = await getDb();
  const bucket = new GridFSBucket(db, { bucketName: "blog_images" });
  const upload = bucket.openUploadStream(file.name, { metadata: { contentType: file.type } });
  const buffer = Buffer.from(await file.arrayBuffer());
  await new Promise<void>((resolve, reject) => { upload.on("error", reject); upload.on("finish", () => resolve()); upload.end(buffer); });
  return `/api/blog-images/${String(upload.id as ObjectId)}`;
}
