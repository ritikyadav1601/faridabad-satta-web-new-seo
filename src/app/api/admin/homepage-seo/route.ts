import { revalidatePath } from "next/cache";
import { authenticateAdmin, hasValidAdminSession } from "@/lib/admin-auth";
import { getHomepageSeoSettingsRaw, saveHomepageSeoSettings } from "@/lib/homepage-seo";

async function authorized(request: Request) {
  return hasValidAdminSession(request) || authenticateAdmin(request.headers.get("x-admin-email") || "", request.headers.get("x-admin-password") || "");
}

// GET -> the raw saved settings (with "{{date}}" left un-substituted, so the
// admin editor shows the literal placeholder to keep or edit).
export async function GET(request: Request) {
  if (!(await authorized(request))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await getHomepageSeoSettingsRaw();
    return Response.json({ success: true, ...settings });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await saveHomepageSeoSettings(await request.json());
    revalidatePath("/");
    return Response.json({ success: true, ...settings });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
