import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  checkIsAdmin,
  SESSION_COOKIE,
  getSessionCookieOptions,
  getTransientCookieOptions,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const configuredOrigin = process.env.APP_ORIGIN?.trim().replace(/\/+$/, "");
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, getSessionCookieOptions());
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, getTransientCookieOptions());
}

function clearOidcCookies(res: Response) {
  const { maxAge: _maxAge, ...cookieOptions } = getTransientCookieOptions();
  res.clearCookie("code_verifier", cookieOptions);
  res.clearCookie("nonce", cookieOptions);
  res.clearCookie("state", cookieOptions);
  res.clearCookie("return_to", cookieOptions);
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  // Map Google OIDC claims to our user model
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.given_name as string) || (claims.first_name as string) || null,
    lastName: (claims.family_name as string) || (claims.last_name as string) || null,
    profileImageUrl: (claims.picture as string) || null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  // Use aggressive cache-busting headers to prevent Vercel/CDN caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader("Vary", "Cookie");

  const authenticated = req.isAuthenticated();
  const userId = req.user?.id ?? null;
  const email = req.user?.email ?? null;

  console.log(`[Auth Route] User lookup: authenticated=${authenticated}, email=${email}, userId=${userId}`);
  
  req.log.info(
    { authenticated, userId },
    "Auth user lookup",
  );

  res.json(
    GetCurrentAuthUserResponse.parse({
      user: authenticated ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    const returnTo = getSafeReturnTo(req.query.returnTo);
    req.log.info({ returnTo }, "User already authenticated, skipping login");
    return res.redirect(returnTo);
  }

  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  req.log.info({ callbackUrl }, "Auth login initiated");

  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);

  res.redirect(redirectTo.href);
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  req.log.info(
    {
      callbackUrl,
      rawCookies: req.headers.cookie,
      parsedCookies: req.cookies,
      hasCookies: !!(codeVerifier && expectedState),
      hasCodeVerifier: !!codeVerifier,
      hasState: !!expectedState,
      hasNonce: !!nonce,
      queryHasCode: !!req.query.code,
      queryHasState: !!req.query.state,
    },
    "Auth callback received",
  );

  if (!codeVerifier || !expectedState) {
    req.log.warn(
      { 
        hasCodeVerifier: !!codeVerifier, 
        hasState: !!expectedState,
        availableCookies: Object.keys(req.cookies || {})
      },
      "Auth callback missing OIDC cookies — possible cookie domain mismatch or direct URL access",
    );
    clearOidcCookies(res);
    res.redirect("/api/login");
    return;
  }

  // Build the current URL by surgically extracting only OIDC relevant params
  // This prevents Vercel-internal parameters (...path, path) from polluting the callback URI
  const oidcParams = new URL(req.url, `http://${req.headers.host || "localhost"}`).searchParams;
  const filteredParams = new URLSearchParams();
  
  // Explicitly copy only expected OIDC parameters
  for (const key of ["code", "state", "iss", "session_state", "error", "error_description"]) {
    const val = oidcParams.get(key);
    if (val) filteredParams.set(key, val);
  }

  const currentUrl = new URL(`${callbackUrl}?${filteredParams.toString()}`);

  console.log(`[Auth Debug] constructed currentUrl: ${currentUrl.href}`);
  req.log.info({ currentUrl: currentUrl.href }, "Auth callback currentUrl constructed");

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch (err) {
    req.log.error(
      {
        error: err instanceof Error ? err.message : String(err),
        callbackUrl,
        currentUrl: currentUrl.href,
      },
      "Auth callback OIDC token exchange failed",
    );
    clearOidcCookies(res);
    res.redirect("/api/login");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  clearOidcCookies(res);

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
      isAdmin: checkIsAdmin(dbUser.email),
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  req.log.info(
    { userId: dbUser.id, email: dbUser.email, sessionId: sid.slice(0, 8) },
    "Auth callback completed",
  );
  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  const origin = getOrigin(req);

  const sid = getSessionId(req);
  await clearSession(res, sid);

  // Google doesn't support RP-initiated logout via end_session_endpoint,
  // so we simply clear the session and redirect home.
  res.redirect(origin);
});

export default router;
