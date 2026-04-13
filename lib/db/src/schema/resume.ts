import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resumeTable = pgTable("resume", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  summary: text("summary").notNull(),
  linkedin: text("linkedin"),
  website: text("website"),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  experience: jsonb("experience").$type<ExperienceItem[]>().notNull().default([]),
  education: jsonb("education").$type<EducationItem[]>().notNull().default([]),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export interface ExperienceItem {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
  bullets: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  gpa?: string;
  honors?: string;
}

export const insertResumeSchema = createInsertSchema(resumeTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumeTable.$inferSelect;

export const viewsTable = pgTable("views", {
  id: serial("id").primaryKey(),
  referrer: text("referrer"),
  ipHash: text("ip_hash"),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
});

export const insertViewSchema = createInsertSchema(viewsTable).omit({ id: true, viewedAt: true });
export type InsertView = z.infer<typeof insertViewSchema>;
export type View = typeof viewsTable.$inferSelect;

export const resumeUpdateSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
    bullets: z.array(z.string()),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    startYear: z.number(),
    endYear: z.number().optional(),
    gpa: z.string().optional(),
    honors: z.string().optional(),
  })).optional(),
  certifications: z.array(z.string()).optional(),
});
