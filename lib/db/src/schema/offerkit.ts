import { boolean, jsonb, pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsletterSignupsTable = pgTable("newsletter_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("footer"),
  /** True for rows inserted by the seed script — can be hidden on the dashboard. */
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  /** True for rows inserted by the seed script. */
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  score: integer("score").notNull(),
  answers: jsonb("answers").$type<number[]>().notNull(),
  level: text("level").notNull(),
  /** True for rows inserted by the seed script. */
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resumeChecksTable = pgTable("resume_checks", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  score: integer("score").notNull(),
  /** True for rows inserted by the seed script. */
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plannerPlansTable = pgTable("planner_plans", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  targetRole: text("target_role").notNull(),
  weakAreas: jsonb("weak_areas").$type<string[]>().notNull(),
  /** True for rows inserted by the seed script. */
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsEventsTable = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  event: text("event").notNull(),
  path: text("path").notNull(),
  label: text("label"),
  referrer: text("referrer"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  screen: text("screen"),
  duration: integer("duration"),
  /** True for rows inserted by the seed script. */
  isSample: boolean("is_sample").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNewsletterSignupSchema = createInsertSchema(newsletterSignupsTable).omit({ id: true, createdAt: true });
export const insertContactSubmissionSchema = createInsertSchema(contactSubmissionsTable).omit({ id: true, createdAt: true });
export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({ id: true, createdAt: true });
export const insertResumeCheckSchema = createInsertSchema(resumeChecksTable).omit({ id: true, createdAt: true });
export const insertPlannerPlanSchema = createInsertSchema(plannerPlansTable).omit({ id: true, createdAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEventsTable).omit({ id: true, createdAt: true });

export type InsertNewsletterSignup = z.infer<typeof insertNewsletterSignupSchema>;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type InsertResumeCheck = z.infer<typeof insertResumeCheckSchema>;
export type InsertPlannerPlan = z.infer<typeof insertPlannerPlanSchema>;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;