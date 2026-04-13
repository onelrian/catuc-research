import { Router } from "express";
import { db } from "@workspace/db";
import {
  surveysTable,
  questionsTable,
  responsesTable,
  answersTable,
  createSurveySchema,
  updateSurveySchema,
  submitResponseSchema,
} from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";

const router = Router();

router.get("/surveys", async (req, res) => {
  try {
    const surveys = await db.select().from(surveysTable).orderBy(desc(surveysTable.createdAt));
    const ids = surveys.map((s) => s.id);
    let countMap: Record<number, number> = {};
    if (ids.length > 0) {
      const counts = await db
        .select({
          surveyId: responsesTable.surveyId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(responsesTable)
        .where(inArray(responsesTable.surveyId, ids))
        .groupBy(responsesTable.surveyId);
      countMap = Object.fromEntries(counts.map((c) => [c.surveyId, c.count]));
    }
    return res.json(
      surveys.map((s) => ({
        ...s,
        responseCount: countMap[s.id] ?? 0,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list surveys");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/surveys", async (req, res) => {
  try {
    const parsed = createSurveySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { title, description, questions } = parsed.data;
    const [survey] = await db.insert(surveysTable).values({ title, description }).returning();
    if (questions.length > 0) {
      await db.insert(questionsTable).values(
        questions.map((q, i) => ({
          surveyId: survey.id,
          text: q.text,
          type: q.type,
          options: q.options ?? [],
          isRequired: q.isRequired ?? true,
          orderIndex: q.orderIndex ?? i,
        }))
      );
    }
    return res.status(201).json({
      ...survey,
      responseCount: 0,
      createdAt: survey.createdAt.toISOString(),
      updatedAt: survey.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create survey");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/surveys/:surveyId", async (req, res) => {
  try {
    const id = parseInt(req.params.surveyId);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid survey ID" });

    const surveys = await db.select().from(surveysTable).where(eq(surveysTable.id, id));
    if (surveys.length === 0) return res.status(404).json({ error: "Survey not found" });

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.surveyId, id))
      .orderBy(questionsTable.orderIndex);

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(responsesTable)
      .where(eq(responsesTable.surveyId, id));

    const s = surveys[0];
    return res.json({
      ...s,
      responseCount: countResult.count,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      questions: questions.map((q) => ({ ...q })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get survey");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/surveys/:surveyId", async (req, res) => {
  try {
    const id = parseInt(req.params.surveyId);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid survey ID" });

    const parsed = updateSurveySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const { questions, ...fields } = parsed.data;

    const [updated] = await db
      .update(surveysTable)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(surveysTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Survey not found" });

    if (questions) {
      await db.delete(questionsTable).where(eq(questionsTable.surveyId, id));
      if (questions.length > 0) {
        await db.insert(questionsTable).values(
          questions.map((q, i) => ({
            surveyId: id,
            text: q.text,
            type: q.type,
            options: q.options ?? [],
            isRequired: q.isRequired ?? true,
            orderIndex: q.orderIndex ?? i,
          }))
        );
      }
    }

    const [countResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(responsesTable)
      .where(eq(responsesTable.surveyId, id));

    return res.json({
      ...updated,
      responseCount: countResult.count,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update survey");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/surveys/:surveyId", async (req, res) => {
  try {
    const id = parseInt(req.params.surveyId);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid survey ID" });
    await db.delete(surveysTable).where(eq(surveysTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete survey");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/surveys/:surveyId/responses", async (req, res) => {
  try {
    const surveyId = parseInt(req.params.surveyId);
    if (isNaN(surveyId)) return res.status(400).json({ error: "Invalid survey ID" });

    const surveyRows = await db.select().from(surveysTable).where(eq(surveysTable.id, surveyId));
    if (surveyRows.length === 0) return res.status(404).json({ error: "Survey not found" });

    const parsed = submitResponseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const [response] = await db.insert(responsesTable).values({ surveyId }).returning();

    if (parsed.data.answers.length > 0) {
      await db.insert(answersTable).values(
        parsed.data.answers.map((a) => ({
          responseId: response.id,
          questionId: a.questionId,
          value: a.value ?? null,
          values: a.values ?? [],
        }))
      );
    }

    return res.status(201).json({
      id: response.id,
      surveyId: response.surveyId,
      submittedAt: response.submittedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit response");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/surveys/:surveyId/results", async (req, res) => {
  try {
    const surveyId = parseInt(req.params.surveyId);
    if (isNaN(surveyId)) return res.status(400).json({ error: "Invalid survey ID" });

    const surveyRows = await db.select().from(surveysTable).where(eq(surveysTable.id, surveyId));
    if (surveyRows.length === 0) return res.status(404).json({ error: "Survey not found" });

    const survey = surveyRows[0];

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.surveyId, surveyId))
      .orderBy(questionsTable.orderIndex);

    const responses = await db
      .select()
      .from(responsesTable)
      .where(eq(responsesTable.surveyId, surveyId));

    const totalResponses = responses.length;
    const questionIds = questions.map((q) => q.id);
    let allAnswers: typeof answersTable.$inferSelect[] = [];
    if (questionIds.length > 0 && totalResponses > 0) {
      allAnswers = await db
        .select()
        .from(answersTable)
        .where(inArray(answersTable.questionId, questionIds));
    }

    const questionResults = questions.map((q) => {
      const qAnswers = allAnswers.filter((a) => a.questionId === q.id);
      const totalAnswers = qAnswers.length;
      let textAnswers: string[] = [];
      let choiceCounts: Record<string, number> = {};
      let averageRating: number | undefined;
      let ratingDistribution: Record<string, number> = {};

      if (q.type === "text") {
        textAnswers = qAnswers.map((a) => a.value ?? "").filter(Boolean);
      } else if (q.type === "multiple_choice") {
        for (const a of qAnswers) {
          const picked = a.values?.length ? a.values : a.value ? [a.value] : [];
          for (const v of picked) {
            choiceCounts[v] = (choiceCounts[v] ?? 0) + 1;
          }
        }
      } else if (q.type === "yes_no") {
        for (const a of qAnswers) {
          const v = a.value ?? "";
          if (v) choiceCounts[v] = (choiceCounts[v] ?? 0) + 1;
        }
      } else if (q.type === "rating") {
        const ratings = qAnswers.map((a) => parseInt(a.value ?? "0")).filter((n) => !isNaN(n) && n > 0);
        if (ratings.length > 0) {
          averageRating = ratings.reduce((s, n) => s + n, 0) / ratings.length;
        }
        for (const r of ratings) {
          ratingDistribution[String(r)] = (ratingDistribution[String(r)] ?? 0) + 1;
        }
      }

      const result: Record<string, unknown> = {
        questionId: q.id,
        questionText: q.text,
        questionType: q.type,
        totalAnswers,
      };
      if (textAnswers.length) result.textAnswers = textAnswers;
      if (Object.keys(choiceCounts).length) result.choiceCounts = choiceCounts;
      if (averageRating !== undefined) result.averageRating = Math.round(averageRating * 10) / 10;
      if (Object.keys(ratingDistribution).length) result.ratingDistribution = ratingDistribution;
      return result;
    });

    const recentResponses = responses
      .slice(-10)
      .reverse()
      .map((r) => ({ id: r.id, surveyId: r.surveyId, submittedAt: r.submittedAt.toISOString() }));

    return res.json({
      surveyId,
      surveyTitle: survey.title,
      totalResponses,
      completionRate: totalResponses > 0 ? 1.0 : 0,
      questionResults,
      recentResponses,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get survey results");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/surveys/:surveyId/responses/raw", async (req, res) => {
  try {
    const surveyId = parseInt(req.params.surveyId);
    if (isNaN(surveyId)) return res.status(400).json({ error: "Invalid survey ID" });

    const responses = await db
      .select()
      .from(responsesTable)
      .where(eq(responsesTable.surveyId, surveyId))
      .orderBy(desc(responsesTable.submittedAt));

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.surveyId, surveyId));

    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));

    const result = await Promise.all(
      responses.map(async (r) => {
        const answers = await db
          .select()
          .from(answersTable)
          .where(eq(answersTable.responseId, r.id));
        return {
          id: r.id,
          surveyId: r.surveyId,
          submittedAt: r.submittedAt.toISOString(),
          answers: answers.map((a) => ({
            id: a.id,
            questionId: a.questionId,
            questionText: questionMap[a.questionId]?.text ?? "",
            value: a.value,
            values: a.values,
          })),
        };
      })
    );

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get raw responses");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/overview", async (req, res) => {
  try {
    const [totalSurveys] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(surveysTable);

    const [activeSurveys] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(surveysTable)
      .where(eq(surveysTable.isActive, true));

    const [totalResponses] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(responsesTable);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [responsesToday] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(responsesTable)
      .where(sql`submitted_at >= ${todayStart.toISOString()}`);

    const surveys = await db.select().from(surveysTable).orderBy(desc(surveysTable.createdAt)).limit(10);
    const surveyIds = surveys.map((s) => s.id);

    let recentActivity: object[] = [];
    if (surveyIds.length > 0) {
      const counts = await db
        .select({
          surveyId: responsesTable.surveyId,
          count: sql<number>`cast(count(*) as int)`,
          lastResponseAt: sql<string>`max(submitted_at)`,
        })
        .from(responsesTable)
        .where(inArray(responsesTable.surveyId, surveyIds))
        .groupBy(responsesTable.surveyId);

      const countMap = Object.fromEntries(counts.map((c) => [c.surveyId, c]));

      recentActivity = surveys.map((s) => ({
        surveyId: s.id,
        surveyTitle: s.title,
        responseCount: countMap[s.id]?.count ?? 0,
        lastResponseAt: countMap[s.id]?.lastResponseAt ?? null,
      }));
    }

    return res.json({
      totalSurveys: totalSurveys.count,
      activeSurveys: activeSurveys.count,
      totalResponses: totalResponses.count,
      responsesToday: responsesToday.count,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard overview");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
