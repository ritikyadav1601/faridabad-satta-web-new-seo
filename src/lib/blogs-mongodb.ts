import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  metaTitle: string;
  metaDescription: string;
}

function mapBlogPost(post: Record<string, unknown>): BlogPost {
  return {
    id: String(post._id),
    slug: String(post.slug || ""),
    title: String(post.title || "Untitled"),
    content: String(post.content || ""),
    image: String(post.image || ""),
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt || ""),
    updatedAt: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : String(post.updatedAt || post.createdAt || ""),
    metaTitle: String(post.metaTitle || post.title || "Untitled"),
    metaDescription: String(post.metaDescription || ""),
  };
}

function getClient() {
  const uri = process.env.TOP_GAMES_MONGODB_URI;
  if (!uri) return null;

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
      .connect()
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

export async function getPublishedBlogs(): Promise<BlogPost[]> {
  return getPublishedBlogsInternal(12);
}

async function getPublishedBlogsInternal(limit: number): Promise<BlogPost[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const db = (await client).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
    const posts = await db
      .collection<Record<string, unknown>>(process.env.BLOG_POSTS_COLLECTION || "blogposts")
      .find({ published: true })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return posts.map(mapBlogPost);
  } catch (error) {
    console.error("[blogs-mongodb] Failed to read blog posts:", (error as Error).message);
    return [];
  }
}

export async function getPublishedBlogBySlug(slug: string): Promise<BlogPost | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const db = (await client).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
    const post = await db
      .collection<Record<string, unknown>>(process.env.BLOG_POSTS_COLLECTION || "blogposts")
      .findOne({ slug, published: true });
    if (!post) return null;

    return mapBlogPost(post);
  } catch (error) {
    console.error("[blogs-mongodb] Failed to read blog post:", (error as Error).message);
    return null;
  }
}

export async function getBlogImage(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const client = getClient();
  if (!client) return null;

  const db = (await client).db(process.env.TOP_GAMES_MONGODB_DB || undefined);
  const file = await db.collection("blog_images.files").findOne({ _id: new ObjectId(id) });
  if (!file) return null;

  return {
    stream: new GridFSBucket(db, { bucketName: "blog_images" }).openDownloadStream(file._id),
    contentType: String(file.metadata?.contentType || "application/octet-stream"),
  };
}
