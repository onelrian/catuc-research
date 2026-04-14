import { db } from "@/lib/db";
import { surveysTable, questionsTable } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SurveyForm } from "./survey-form";
import { Metadata } from "next";
import { auth } from "@/lib/auth";

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ surveyId: string }> 
}): Promise<Metadata> {
  const { surveyId } = await params;
  const id = parseInt(surveyId, 10);
  if (isNaN(id)) return { title: "Survey Not Found" };

  const surveyRows = await db.select().from(surveysTable).where(eq(surveysTable.id, id));
  if (surveyRows.length === 0) return { title: "Survey Not Found" };

  return {
    title: `${surveyRows[0].title} | CATUC Research`,
    description: surveyRows[0].description || "Participate in this academic research study by CATUC Bamenda.",
  };
}

export const dynamic = "force-dynamic";

export default async function SurveyParticipationPage({
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

  const session = await auth();

  const enrichedSurvey = {
    ...survey,
    questions,
  };

  return <SurveyForm survey={enrichedSurvey} initialIsAuthenticated={!!session?.user} />;
}
