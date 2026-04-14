"use server";

import { db } from "@/lib/db";
import { 
  surveysTable, 
  questionsTable, 
  responsesTable, 
  answersTable,
  submitResponseSchema,
  createSurveySchema
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/**
 * Submit a survey response.
 * Works for both authenticated users and anonymous participants.
 * Prevents multiple submissions using userId (logged in) or anonymousId (anonymous).
 */
export async function submitSurveyResponse(
  surveyId: number,
  data: { answers: any[]; anonymousId?: string }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const anonymousId = data.anonymousId ?? null;

    // Must have at least one identifier
    if (!userId && !anonymousId) {
      return { success: false, error: "Unable to identify participant. Please try again." };
    }

    // Validate input payload
    const parsed = submitResponseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid response data provided." };
    }

    const { answers } = parsed.data;

    // Check for duplicate response
    let existing: any[] = [];
    if (userId) {
      existing = await db
        .select()
        .from(responsesTable)
        .where(
          and(
            eq(responsesTable.surveyId, surveyId),
            eq(responsesTable.userId, userId)
          )
        );
    } else if (anonymousId) {
      existing = await db
        .select()
        .from(responsesTable)
        .where(
          and(
            eq(responsesTable.surveyId, surveyId),
            eq(responsesTable.anonymousId, anonymousId)
          )
        );
    }
    
    if (existing.length > 0) {
      return { success: false, error: "You have already participated in this study." };
    }

    // Insert the response record
    const [newResponse] = await db
      .insert(responsesTable)
      .values({
        surveyId,
        userId,
        anonymousId,
      })
      .returning({ id: responsesTable.id });

    // Insert answers
    if (answers.length > 0) {
      await db.insert(answersTable).values(
        answers.map((ans) => ({
          responseId: newResponse.id,
          questionId: ans.questionId,
          value: ans.value,
          values: ans.values,
        }))
      );
    }

    const resultId = newResponse.id;

    revalidatePath(`/dashboard/surveys/${surveyId}/results`);
    revalidatePath("/");
    
    return { success: true, responseId: resultId };
  } catch (error: any) {
    console.error("Failed to submit response:", error);
    return { success: false, error: error.message || "Failed to submit response." };
  }
}

/**
 * Create a new survey instrument.
 * Requires an Admin session.
 */
export async function createSurvey(data: { title: string; description?: string; questions: any[] }) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.isAdmin;
    
    if (!isAdmin) {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    // Validate input payload
    const parsed = createSurveySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid survey design data." };
    }

    const { title, description, questions } = parsed.data;

    // Step 1: Insert the survey record
    const [newSurvey] = await db
      .insert(surveysTable)
      .values({
        title,
        description,
        isActive: true,
      })
      .returning({ id: surveysTable.id });

    const surveyId = newSurvey.id;

    // Step 2: Insert questions
    if (questions.length > 0) {
      await db.insert(questionsTable).values(
        questions.map((q, idx) => ({
          surveyId,
          text: q.text,
          type: q.type,
          isRequired: q.isRequired,
          options: q.options,
          orderIndex: q.orderIndex ?? idx,
        }))
      );
    }

    revalidatePath("/dashboard/surveys");
    revalidatePath("/");
    
    return { success: true, surveyId };
  } catch (error: any) {
    console.error("Failed to create survey:", error);
    return { success: false, error: "Failed to create research instrument." };
  }
}

/**
 * Permanently delete a survey.
 */
export async function deleteSurvey(surveyId: number) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.isAdmin) {
      return { success: false, error: "Unauthorized." };
    }

    await db.delete(surveysTable).where(eq(surveysTable.id, surveyId));
    
    revalidatePath("/dashboard/surveys");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete survey:", error);
    return { success: false, error: "Failed to delete instrument." };
  }
}

/**
 * Toggle survey activation status.
 */
export async function toggleSurveyActive(surveyId: number, isActive: boolean) {
  try {
    const session = await auth();
    if (!(session?.user as any)?.isAdmin) {
      return { success: false, error: "Unauthorized." };
    }

    await db
      .update(surveysTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(surveysTable.id, surveyId));
    
    revalidatePath("/dashboard/surveys");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle survey active state:", error);
    return { success: false, error: "Failed to update instrument status." };
  }
}
