import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { and, eq, gt } from "drizzle-orm";
import { Router, type IRouter } from "express";

import { db, sessionsTable, userDataTable, usersTable } from "@workspace/db";

const SESSION_DAYS = 30;

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return { hash: `${s}:${hash}`, salt: s };
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createSession(userId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  await db.insert(sessionsTable).values({
    userId,
    token: tokenHash(token),
    expiresAt,
  });
  return token;
}

export type AuthedRequest = {
  userId: string;
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(sessionsTable)
    .where(
      and(
        eq(sessionsTable.token, tokenHash(token)),
        gt(sessionsTable.expiresAt, new Date())
      )
    )
    .limit(1);
  const session = rows[0];
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as typeof req & { userId: string }).userId = session.userId;
  next();
};

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");
  const name = req.body?.name ? String(req.body.name).trim() : undefined;

  if (!email || !email.includes("@") || password.length < 6) {
    res.status(400).json({ error: "Valid email and password (6+) required." });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing[0]) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const { hash } = hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash: hash, name })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Could not create account." });
    return;
  }

  await db.insert(userDataTable).values({
    userId: user.id,
    supplements: [],
    doseLogs: [],
    profile: { onboardingComplete: false },
  });

  const token = await createSession(user.id);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password ?? "");

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = await createSession(user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/logout", requireAuth, async (req, res) => {
  const header = req.headers.authorization!;
  const token = header.slice(7);
  await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.token, tokenHash(token)));
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: string }).userId;
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  const user = rows[0];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name });
});

export default router;
