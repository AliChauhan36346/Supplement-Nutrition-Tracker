import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

import { db, userDataTable } from "@workspace/db";

import { requireAuth } from "./auth";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: string }).userId;
  const rows = await db
    .select()
    .from(userDataTable)
    .where(eq(userDataTable.userId, userId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    res.json({
      supplements: [],
      doseLogs: [],
      profile: {},
      updatedAt: new Date().toISOString(),
    });
    return;
  }
  res.json({
    supplements: row.supplements ?? [],
    doseLogs: row.doseLogs ?? [],
    profile: row.profile ?? {},
    updatedAt: row.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
});

router.put("/", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: string }).userId;
  const supplements = Array.isArray(req.body?.supplements)
    ? req.body.supplements
    : [];
  const doseLogs = Array.isArray(req.body?.doseLogs) ? req.body.doseLogs : [];
  const profile =
    req.body?.profile && typeof req.body.profile === "object"
      ? req.body.profile
      : {};

  const now = new Date();
  await db
    .insert(userDataTable)
    .values({
      userId,
      supplements,
      doseLogs,
      profile,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userDataTable.userId,
      set: {
        supplements,
        doseLogs,
        profile,
        updatedAt: now,
      },
    });

  res.json({
    supplements,
    doseLogs,
    profile,
    updatedAt: now.toISOString(),
  });
});

export default router;
