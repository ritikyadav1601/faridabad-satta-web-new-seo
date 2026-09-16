import { authenticateAdmin, hasValidAdminSession } from "@/lib/admin-auth";
import { deleteBlogPost, listAdminBlogPosts, saveBlogPost } from "@/lib/admin-blogs";

async function authorized(request: Request) {
  return hasValidAdminSession(request) || authenticateAdmin(request.headers.get("x-admin-email") || "", request.headers.get("x-admin-password") || "");
}

export async function GET(request: Request) {
  if (!(await authorized(request))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  return Response.json({ success: true, posts: await listAdminBlogPosts() });
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try { return Response.json({ success: true, post: await saveBlogPost(await request.json()) }); }
  catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await authorized(request))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try { const { slug } = await request.json(); await deleteBlogPost(slug); return Response.json({ success: true }); }
  catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 400 }); }
}
