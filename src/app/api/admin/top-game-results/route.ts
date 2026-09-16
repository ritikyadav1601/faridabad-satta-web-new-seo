import { authenticateAdmin, hasValidAdminSession } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { declareTopGameResult, deleteTopGameResult, listTopGameResults } from "@/lib/admin-top-games";

async function authorized(request: Request) {
  return hasValidAdminSession(request) || authenticateAdmin(request.headers.get("x-admin-email") || "", request.headers.get("x-admin-password") || "");
}

export async function GET(request: Request) {
  if (!(await authorized(request))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  try {
    const date = new URL(request.url).searchParams.get("date") || "";
    return Response.json({ success: true, results: await listTopGameResults(date) });
  } catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 400 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!hasValidAdminSession(request) && !(await authenticateAdmin(body.email, body.password))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const data = await declareTopGameResult(body.game, body.date, String(body.result || "").trim());
    revalidatePath("/");
    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (!hasValidAdminSession(request) && !(await authenticateAdmin(body.email, body.password))) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    await deleteTopGameResult(body.game, body.date);
    revalidatePath("/");
    return Response.json({ success: true });
  } catch (error) { return Response.json({ success: false, error: (error as Error).message }, { status: 400 }); }
}
