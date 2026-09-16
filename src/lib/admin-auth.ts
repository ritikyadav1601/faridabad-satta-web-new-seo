import "server-only";

import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { MongoClient } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;
export const ADMIN_SESSION_COOKIE = "faridabad_admin_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.TOP_GAMES_MONGODB_URI;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createAdminSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email: email.trim().toLowerCase(), expires: Date.now() + SESSION_AGE_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function adminSessionCookie(token: string) {
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_AGE_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearAdminSessionCookie() {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function hasValidAdminSession(request: Request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const token = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${ADMIN_SESSION_COOKIE}=`))?.slice(ADMIN_SESSION_COOKIE.length + 1);
    if (!token) return false;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;
    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data.email === "string" && Number(data.expires) > Date.now();
  } catch { return false; }
}

function getClient() {
  const uri = process.env.TOP_GAMES_MONGODB_URI;
  if (!uri) throw new Error("TOP_GAMES_MONGODB_URI is not configured");

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

export async function authenticateAdmin(email?: string, password?: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return false;

  const client = await getClient();
  const db = client.db(process.env.TOP_GAMES_MONGODB_DB || undefined);
  const user = await db.collection<{ email?: string; password?: string }>("users").findOne(
    { email: normalizedEmail },
    { projection: { password: 1 } }
  );

  if (!user?.password) return false;
  return bcrypt.compare(password, user.password);
}
