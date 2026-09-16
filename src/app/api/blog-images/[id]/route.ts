import { getBlogImage } from "@/lib/blogs-mongodb";
import { Readable } from "node:stream";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const image = await getBlogImage(id);
    if (!image) return new Response("Image not found", { status: 404 });

    return new Response(Readable.toWeb(image.stream) as ReadableStream, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
