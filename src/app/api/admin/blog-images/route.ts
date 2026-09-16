import { authenticateAdmin, hasValidAdminSession } from "@/lib/admin-auth";
import { uploadBlogImage } from "@/lib/admin-blogs";

export async function POST(request: Request) {
  if (!hasValidAdminSession(request) && !(await authenticateAdmin(request.headers.get("x-admin-email") || "", request.headers.get("x-admin-password") || ""))) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const file = (await request.formData()).get("image");
    if (!(file instanceof File) || !file.type.startsWith("image/")) return Response.json({ success: false, error: "Select a valid image." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return Response.json({ success: false, error: "Image must be 5 MB or smaller." }, { status: 400 });
    return Response.json({ success: true, url: await uploadBlogImage(file) });
  } catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 500 }); }
}
