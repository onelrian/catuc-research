import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questionsTable, responsesTable, answersTable } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = auth(async (req, context) => {
  // Check auth and admin role
  if (!req.auth || !(req.auth.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Next.js 15: Handle async params from context
  const params = await (context as any).params;
  const surveyIdStr = params?.surveyId;
  const id = parseInt(surveyIdStr, 10);
  
  if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.surveyId, id))
    .orderBy(questionsTable.orderIndex);

  const responses = await db
    .select()
    .from(responsesTable)
    .where(eq(responsesTable.surveyId, id));

  const questionIds = questions.map((q) => q.id);
  let allAnswers: any[] = [];
  if (questionIds.length > 0 && responses.length > 0) {
    allAnswers = await db
      .select()
      .from(answersTable)
      .where(inArray(answersTable.questionId, questionIds));
  }

  // Generate CSV
  const header = ["Timestamp", ...questions.map((q) => `"${q.text.replace(/"/g, '""')}"`)];
  const rows = responses.map((r) => {
    const rAnswers = allAnswers.filter((a) => a.responseId === r.id);
    const row = [
      r.submittedAt.toISOString(),
      ...questions.map((q) => {
        const ans = rAnswers.find((a) => a.questionId === q.id);
        if (!ans) return "";
        const val = ans.values?.length ? ans.values.join("; ") : ans.value || "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }),
    ];
    return row.join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="survey-results-${id}.csv"`,
    },
  });
}) as any;
