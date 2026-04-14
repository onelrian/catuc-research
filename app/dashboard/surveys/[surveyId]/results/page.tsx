import { db } from "@/lib/db";
import { surveysTable, questionsTable, responsesTable, answersTable } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ResultsViewer } from "./results-viewer";

export default async function SurveyResultsPage({
  params,
}: {
  params: Promise<{ surveyId: string }>;
}) {
  const { surveyId } = await params;
  const id = parseInt(surveyId, 10);
  if (isNaN(id)) notFound();

  const surveyRows = await db.select().from(surveysTable).where(eq(surveysTable.id, id));
  if (surveyRows.length === 0) notFound();
  const survey = surveyRows[0];

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.surveyId, id))
    .orderBy(questionsTable.orderIndex);

  const responses = await db
    .select()
    .from(responsesTable)
    .where(eq(responsesTable.surveyId, id));

  const totalResponses = responses.length;
  const questionIds = questions.map((q) => q.id);
  
  let allAnswers: any[] = [];
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
        for (const v of picked) choiceCounts[v] = (choiceCounts[v] ?? 0) + 1;
      }
    } else if (q.type === "yes_no") {
      for (const a of qAnswers) {
        if (a.value) choiceCounts[a.value] = (choiceCounts[a.value] ?? 0) + 1;
      }
    } else if (q.type === "rating") {
      const ratings = qAnswers.map((a) => parseInt(a.value ?? "0")).filter((n) => !isNaN(n) && n > 0);
      if (ratings.length > 0) averageRating = ratings.reduce((s, n) => s + n, 0) / ratings.length;
      for (const r of ratings) ratingDistribution[String(r)] = (ratingDistribution[String(r)] ?? 0) + 1;
    }

    return {
      questionId: q.id,
      questionText: q.text,
      questionType: q.type,
      section: q.section || "General",
      totalAnswers,
      textAnswers,
      choiceCounts,
      averageRating,
      ratingDistribution,
    };
  });

  const results = {
    surveyId: id,
    surveyTitle: survey.title,
    totalResponses,
    completionRate: totalResponses > 0
      ? responses.filter(r => {
          const rAnswers = allAnswers.filter(a => a.responseId === r.id);
          return rAnswers.length >= questions.length;
        }).length / totalResponses
      : 0,
    questionResults,
  };

  // Raw data mapping
  const responseMap = responses.map((r) => {
    const rAnswers = allAnswers.filter((a) => a.responseId === r.id);
    return {
      id: r.id,
      submittedAt: r.submittedAt.toISOString(),
      answers: rAnswers,
    };
  });

  return <ResultsViewer results={results} rawData={responseMap} surveyId={id} />;
}
