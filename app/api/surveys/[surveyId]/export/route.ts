import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questionsTable, responsesTable, answersTable } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  // Check auth and admin role
  const session = await auth();
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { surveyId } = await params;
  const id = parseInt(surveyId, 10);
  
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
  const header = ["Participant ID", "Participant Type", "Timestamp", ...questions.map((q) => `"${q.text.replace(/"/g, '""')}"`)];
  const rows = responses.map((r) => {
    const rAnswers = allAnswers.filter((a) => a.responseId === r.id);
    const participantId = r.userId || r.anonymousId || `response-${r.id}`;
    const participantType = r.userId ? "Authenticated" : "Anonymous";
    const row = [
      `"${participantId}"`,
      participantType,
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
}
