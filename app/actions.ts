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
 * Requires an authenticated user session.
 * Prevents multiple submissions by the same user for the same survey.
 */
export async function submitSurveyResponse(surveyId: number, data: { answers: any[] }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Please sign in to participate in the study." };
    }

    const userId = session.user.id;

    // Validate input payload
    const parsed = submitResponseSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid response data provided." };
    }

    const { answers } = parsed.data;

    const result = await db.transaction(async (tx) => {
      // Check for duplicate response
      const existing = await tx
        .select()
        .from(responsesTable)
        .where(
          and(
            eq(responsesTable.surveyId, surveyId),
            eq(responsesTable.userId, userId)
          )
        );
      
      if (existing.length > 0) {
        throw new Error("You have already participated in this study.");
      }

      const [newResponse] = await tx
        .insert(responsesTable)
        .values({
          surveyId,
          userId,
        })
        .returning({ id: responsesTable.id });

      if (answers.length > 0) {
        await tx.insert(answersTable).values(
          answers.map((ans) => ({
            responseId: newResponse.id,
            questionId: ans.questionId,
            value: ans.value,
            values: ans.values,
          }))
        );
      }

      return newResponse.id;
    });

    revalidatePath(`/dashboard/surveys/${surveyId}/results`);
    revalidatePath("/");
    
    return { success: true, responseId: result };
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

    const surveyId = await db.transaction(async (tx) => {
      const [newSurvey] = await tx
        .insert(surveysTable)
        .values({
          title,
          description,
          isActive: true,
        })
        .returning({ id: surveysTable.id });

      if (questions.length > 0) {
        await tx.insert(questionsTable).values(
          questions.map((q, idx) => ({
            surveyId: newSurvey.id,
            text: q.text,
            type: q.type,
            isRequired: q.isRequired,
            options: q.options,
            orderIndex: q.orderIndex ?? idx,
          }))
        );
      }

      return newSurvey.id;
    });

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
