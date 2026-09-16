import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getCustomGameDocument,
  upsertCustomGameDocument,
} from "@/lib/extra-games-mongodb";
import type { ExtraGameDocument } from "@/lib/extra-games-mongodb";
import { authenticateAdmin, hasValidAdminSession } from "@/lib/admin-auth";

// This route serves the Khaiwal contact card (name + WhatsApp number) shown
// on the site — used by the admin "Khaiwal Chart" panel and by /contact.
// It used to also store/serve per-day values for 5 "custom" games
// (kohlapur, manipur, up-bazar, palwal-city, mathura-city) that were never
// actually rendered on the homepage; their only public surface (the
// /chart/[slug] pages for those 5 games) has been removed, along with the
// game-value storage/listing logic that lived here.

// GET ?date=YYYY-MM-DD (or the special id "khaiwal-settings") -> { khaiwal }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const today = searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const data = await getCustomGameDocument(today);

    if (!data) {
      return Response.json({ success: true, khaiwal: null });
    }

    return Response.json({
      success: true,
      khaiwal: data.khaiwal || null,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Save the Khaiwal name/WhatsApp number (with simple auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password, khaiwalName, whatsapp, khaiwal, date } = body;

    if (!hasValidAdminSession(req) && !(await authenticateAdmin(email, password))) {
      return Response.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const targetDate = date || new Date().toISOString().slice(0, 10);

    const existingData: Partial<ExtraGameDocument> = await getCustomGameDocument(targetDate) || {};

    const finalKhaiwal = khaiwal || {
      name: khaiwalName ?? existingData.khaiwal?.name ?? "",
      whatsapp: whatsapp ?? existingData.khaiwal?.whatsapp ?? "",
    };

    const updatedData = {
      ...existingData,
      khaiwal: finalKhaiwal,
      updatedAt: Date.now(),
    };

    await upsertCustomGameDocument(targetDate, updatedData);
    revalidatePath("/");

    return Response.json({
      success: true,
      khaiwal: finalKhaiwal,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
