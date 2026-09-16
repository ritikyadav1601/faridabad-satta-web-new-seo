import { adminSessionCookie, authenticateAdmin, clearAdminSessionCookie, createAdminSession, hasValidAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  return Response.json({ success: hasValidAdminSession(request) }, { status: hasValidAdminSession(request) ? 200 : 401 });
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const authenticated = await authenticateAdmin(email, password);

    if (!authenticated) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return Response.json({ success: true }, { headers: { "Set-Cookie": adminSessionCookie(createAdminSession(email)) } });
  } catch (error) {
    console.error("[admin-login] Login failed:", error);
    return Response.json(
      { success: false, error: "Unable to sign in right now" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return Response.json({ success: true }, { headers: { "Set-Cookie": clearAdminSessionCookie() } });
}
