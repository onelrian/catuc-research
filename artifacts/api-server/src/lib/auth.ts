import * as client from "openid-client";
import crypto from "crypto";
import { type Request, type Response } from "express";
import { db, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { AuthUser } from "@workspace/api-zod";
import type { CookieOptions } from "express";

// Google OIDC discovery endpoint
export const ISSUER_URL = process.env.ISSUER_URL ?? "https://accounts.google.com";
export const SESSION_COOKIE = "sid";
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
export const OIDC_COOKIE_TTL = 10 * 60 * 1000;

function shouldUseSecureCookies(): boolean {
  return process.env.NODE_ENV !== "development";
}

export function getSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  };
}

export function getTransientCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  };
}

export function checkIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map((e) => e.trim());
  return adminEmails.includes(email.toLowerCase());
}


export interface SessionData {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

let oidcConfig: client.Configuration | null = null;
let lastDiscoveryTime = 0;
const DISCOVERY_TTL = 12 * 60 * 60 * 1000; // 12 hours

export async function getOidcConfig(): Promise<client.Configuration> {
  const now = Date.now();
  if (!oidcConfig || now - lastDiscoveryTime > DISCOVERY_TTL) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
    }

    console.log("[Auth] Fetching OIDC discovery document...");
    oidcConfig = await client.discovery(
      new URL(ISSUER_URL),
      clientId,
      clientSecret,
    );
    lastDiscoveryTime = now;
  }
  return oidcConfig;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    sid,
    sess: data as unknown as Record<string, unknown>,
    expire: new Date(Date.now() + SESSION_TTL),
  });
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  console.log(`[Auth DB] Fetching session for SID: ${sid.slice(0, 8)}...`);
  const [row] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sid, sid));

  if (!row) {
    console.warn(`[Auth DB] No session row found for SID: ${sid.slice(0, 8)}...`);
    return null;
  }

  if (row.expire < new Date()) {
    console.warn(`[Auth DB] Session expired for SID: ${sid.slice(0, 8)}... (Expired at: ${row.expire.toISOString()}, Current time: ${new Date().toISOString()})`);
    await deleteSession(sid);
    return null;
  }

  console.log(`[Auth DB] Session found and active for user: ${row.sess ? (row.sess as any).user?.email : "unknown"}`);
  return row.sess as unknown as SessionData;
}

export async function updateSession(
  sid: string,
  data: SessionData,
): Promise<void> {
  await db
    .update(sessionsTable)
    .set({
      sess: data as unknown as Record<string, unknown>,
      expire: new Date(Date.now() + SESSION_TTL),
    })
    .where(eq(sessionsTable.sid, sid));
}

export async function deleteSession(sid: string): Promise<void> {
  await db.delete(sessionsTable).where(eq(sessionsTable.sid, sid));
}

export async function clearSession(
  res: Response,
  sid?: string,
): Promise<void> {
  if (sid) await deleteSession(sid);
  const { maxAge: _maxAge, ...cookieOptions } = getSessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

export function getSessionId(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.[SESSION_COOKIE];
}
