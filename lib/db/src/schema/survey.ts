import { pgTable, text, serial, timestamp, jsonb, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { usersTable } from "./auth";

export const surveysTable = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const questionTypeEnum = ["text", "multiple_choice", "rating", "yes_no"] as const;
export type QuestionType = (typeof questionTypeEnum)[number];

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveysTable.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  type: text("type").$type<QuestionType>().notNull(),
  options: jsonb("options").$type<string[]>().notNull().default([]),
  isRequired: boolean("is_required").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  section: text("section"),
  sectionDescription: text("section_description"),
});

export const responsesTable = pgTable("responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").notNull().references(() => surveysTable.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => usersTable.id),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  responseId: integer("response_id").notNull().references(() => responsesTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  value: text("value"),
  values: jsonb("values").$type<string[]>().notNull().default([]),
});

export type Survey = typeof surveysTable.$inferSelect;
export type Question = typeof questionsTable.$inferSelect;
export type Response = typeof responsesTable.$inferSelect;
export type Answer = typeof answersTable.$inferSelect;

export const createQuestionSchema = z.object({
  text: z.string().min(1),
  type: z.enum(questionTypeEnum),
  options: z.array(z.string()).optional().default([]),
  isRequired: z.boolean().optional().default(true),
  orderIndex: z.number().optional().default(0),
});

export const createSurveySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(createQuestionSchema).min(1),
});

export const updateSurveySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  questions: z.array(createQuestionSchema).optional(),
});

export const answerInputSchema = z.object({
  questionId: z.number(),
  value: z.string().optional(),
  values: z.array(z.string()).optional().default([]),
});

export const submitResponseSchema = z.object({
  answers: z.array(answerInputSchema).min(1),
});
