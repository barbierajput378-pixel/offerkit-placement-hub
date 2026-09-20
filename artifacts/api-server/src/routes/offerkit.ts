import { Router, type IRouter, type Request } from "express";
import { gte } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  analyticsEventsTable,
  contactSubmissionsTable,
  newsletterSignupsTable,
  plannerPlansTable,
  quizResultsTable,
  resumeChecksTable,
} from "@workspace/db";
import {
  CheckResumeBody,
  CheckResumeResponse,
  CreateAdminSessionBody,
  CreateAdminSessionResponse,
  ExportAnalyticsHeader,
  GeneratePlannerBody,
  GeneratePlannerResponse,
  GetAnalyticsHeader,
  GetAnalyticsQueryParams,
  GetAnalyticsResponse,
  GetPostParams,
  GetPostResponse,
  ListPostsResponse,
  ListResourcesQueryParams,
  ListResourcesResponse,
  SubmitContactBody,
  SubmitContactResponse,
  SubmitQuizResultBody,
  SubmitQuizResultResponse,
  SubscribeNewsletterBody,
  SubscribeNewsletterResponse,
  TrackEventBody,
  TrackEventResponse,
} from "@workspace/api-zod";
import { posts, resources } from "../lib/content";

const router: IRouter = Router();

const success = (message: string) => ({ message });

function stringParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function isAdminPassword(password: string | undefined): boolean {
  return Boolean(password && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

function analyticsPassword(req: Request): string | undefined {
  return req.header("x-admin-password") ?? undefined;
}

router.get("/posts", (_req, res) => {
  res.json(ListPostsResponse.parse(posts));
});

router.get("/posts/:slug", (req, res) => {
  const params = GetPostParams.safeParse({ slug: stringParam(req.params.slug) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const post = posts.find((item) => item.slug === params.data.slug);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(GetPostResponse.parse(post));
});

router.get("/resources", (req, res) => {
  const query = ListResourcesQueryParams.safeParse({
    category: typeof req.query.category === "string" ? req.query.category : undefined,
  });
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const filtered = query.data.category
    ? resources.filter((resource) => resource.category === query.data.category)
    : resources;
  res.json(ListResourcesResponse.parse(filtered));
});

router.post("/newsletter", async (req, res): Promise<void> => {
  const parsed = SubscribeNewsletterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    await db.insert(newsletterSignupsTable).values({
      email: parsed.data.email,
      source: parsed.data.source ?? "footer",
    }).onConflictDoNothing();
    res.status(201).json(SubscribeNewsletterResponse.parse(success("You’re on the list. Watch your inbox for the next useful drop.")));
  } catch (error) {
    req.log.error({ err: error }, "Newsletter signup failed");
    res.status(500).json({ error: "We could not save your signup right now." });
  }
});

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SubmitContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    await db.insert(contactSubmissionsTable).values(parsed.data);
    res.status(201).json(SubmitContactResponse.parse(success("Thanks for reaching out. We’ll get back to you soon.")));
  } catch (error) {
    req.log.error({ err: error }, "Contact submission failed");
    res.status(500).json({ error: "We could not save your message right now." });
  }
});

router.post("/quiz/results", async (req, res): Promise<void> => {
  const parsed = SubmitQuizResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { score, level } = parsed.data;
  const nextSteps = score >= 80
    ? ["Run two timed mocks this week.", "Polish your project stories.", "Start targeted applications."]
    : score >= 55
      ? ["Use the 30-day planner for your weakest area.", "Complete three timed practice sets.", "Book one peer mock interview."]
      : ["Start with fundamentals before adding more resources.", "Build a daily 45-minute practice block.", "Recheck your score in two weeks."];
  try {
    await db.insert(quizResultsTable).values(parsed.data);
    res.status(201).json(SubmitQuizResultResponse.parse({ score, level, nextSteps }));
  } catch (error) {
    req.log.error({ err: error }, "Quiz result save failed");
    res.status(500).json({ error: "We could not save your quiz result right now." });
  }
});

router.post("/resume/check", async (req, res): Promise<void> => {
  const parsed = CheckResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const text = parsed.data.resumeText.trim();
  const lower = text.toLowerCase();
  const keywords = ["java", "python", "javascript", "typescript", "sql", "react", "api", "git", "dsa", "dbms", "project", "internship"];
  const headings = ["education", "skills", "projects", "experience", "achievements"];
  const keywordHits = keywords.filter((keyword) => lower.includes(keyword)).length;
  const headingHits = headings.filter((heading) => lower.includes(heading)).length;
  const score = Math.max(18, Math.min(96, 24 + keywordHits * 4 + headingHits * 5 + (text.split(/\s+/).length >= 180 ? 8 : 0)));
  const strengths = [
    keywordHits >= 4 ? "Your resume mentions relevant technical terms recruiters search for." : "You have a clear starting point to build from.",
    headingHits >= 3 ? "The document has a recognisable structure." : "Your content can become stronger with clearer section labels.",
  ];
  const improvements = [
    keywordHits < 6 ? "Mirror the role’s honest keywords inside project and experience bullets." : "Tie each important skill to a specific result or project.",
    headingHits < 4 ? "Add clear headings for skills, projects, education, and experience." : "Replace generic responsibilities with scope and measurable outcomes.",
    text.split(/\s+/).length < 140 ? "Add two or three evidence-rich bullets; the current draft is too light." : "Trim repeated phrases so the strongest proof is easier to scan.",
  ];
  try {
    await db.insert(resumeChecksTable).values({ visitorId: parsed.data.visitorId, score });
    res.json(CheckResumeResponse.parse({ score, strengths, improvements }));
  } catch (error) {
    req.log.error({ err: error }, "Resume check save failed");
    res.status(500).json({ error: "We could not save your resume check right now." });
  }
});

router.post("/planner", async (req, res): Promise<void> => {
  const parsed = GeneratePlannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const focus = parsed.data.weakAreas.length ? parsed.data.weakAreas : ["DSA", "Aptitude", "Core CS"];
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const area = focus[index % focus.length];
    const week = Math.floor(index / 7) + 1;
    return {
      day,
      title: day % 7 === 0 ? `Week ${week} review` : `${area} practice`,
      tasks: day % 7 === 0
        ? ["Review your error log.", "Take one timed mixed set.", "Write the next week’s adjustment."]
        : [`Complete one ${area} lesson.`, `Solve two ${area} practice prompts.`, "Write one takeaway in your prep notes."],
    };
  });
  try {
    await db.insert(plannerPlansTable).values(parsed.data);
    res.json(GeneratePlannerResponse.parse({ targetRole: parsed.data.targetRole, days }));
  } catch (error) {
    req.log.error({ err: error }, "Planner save failed");
    res.status(500).json({ error: "We could not save your plan right now." });
  }
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = TrackEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    await db.insert(analyticsEventsTable).values(parsed.data);
    res.status(202).json(TrackEventResponse.parse(success("Event accepted")));
  } catch (error) {
    req.log.error({ err: error }, "Analytics event failed");
    res.status(500).json({ error: "We could not record that event." });
  }
});

router.post("/admin/session", (req, res) => {
  const parsed = CreateAdminSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const authorized = isAdminPassword(parsed.data.password);
  if (!authorized) {
    res.status(401).json({ error: process.env.ADMIN_PASSWORD ? "Incorrect admin password." : "Analytics password is not configured." });
    return;
  }
  res.json(CreateAdminSessionResponse.parse({ authorized: true }));
});

async function buildAnalytics(range: 7 | 30) {
  const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const events = await db.select().from(analyticsEventsTable).where(gte(analyticsEventsTable.createdAt, since));
  const labelValues = (values: Array<string | null | undefined>) => {
    const counts = new Map<string, number>();
    values.forEach((value) => {
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
  };
  const pages = events.filter((event) => event.event === "page_view");
  const clicks = events.filter((event) => event.event === "cta_click" || event.event === "share_click");
  const series = Array.from({ length: range }, (_, index) => {
    const date = new Date(since.getTime() + index * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    const dayEvents = pages.filter((event) => event.createdAt.toISOString().slice(0, 10) === key);
    return { date: key, visits: dayEvents.length, uniqueVisitors: new Set(dayEvents.map((event) => event.visitorId)).size };
  });
  const visitorDurations = events.filter((event) => event.duration !== null).map((event) => event.duration ?? 0);
  const summary = {
    totalVisits: pages.length,
    uniqueVisitors: new Set(pages.map((event) => event.visitorId)).size,
    averageSessionSeconds: visitorDurations.length ? Math.round(visitorDurations.reduce((sum, value) => sum + value, 0) / visitorDurations.length) : 0,
    series,
    topPages: labelValues(pages.map((event) => event.path)),
    topClicks: labelValues(clicks.map((event) => event.label)),
    topSources: labelValues(events.map((event) => event.utmSource ?? event.referrer)),
    devices: labelValues(events.map((event) => event.device)),
    browsers: labelValues(events.map((event) => event.browser)),
    newsletterSignups: (await db.select().from(newsletterSignupsTable)).length,
    contactSubmissions: (await db.select().from(contactSubmissionsTable)).length,
    quizCompletions: (await db.select().from(quizResultsTable)).length,
    resumeChecks: (await db.select().from(resumeChecksTable)).length,
  };
  return GetAnalyticsResponse.parse(summary);
}

router.get("/admin/analytics", async (req, res): Promise<void> => {
  const header = GetAnalyticsHeader.safeParse({ "x-admin-password": analyticsPassword(req) });
  if (!header.success || !isAdminPassword(header.data["x-admin-password"])) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const rangeValue = Number(req.query.range ?? 7);
  const query = GetAnalyticsQueryParams.safeParse({ range: rangeValue === 30 ? 30 : 7 });
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  try {
    res.json(await buildAnalytics(query.data.range));
  } catch (error) {
    req.log.error({ err: error }, "Analytics dashboard failed");
    res.status(500).json({ error: "We could not load analytics right now." });
  }
});

router.get("/admin/analytics/export", async (req, res): Promise<void> => {
  const header = ExportAnalyticsHeader.safeParse({ "x-admin-password": analyticsPassword(req) });
  if (!header.success || !isAdminPassword(header.data["x-admin-password"])) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  const events = await db.select().from(analyticsEventsTable);
  const rows = [
    ["created_at", "visitor_id", "event", "path", "label", "utm_source", "device", "browser", "duration"].join(","),
    ...events.map((event) => [
      event.createdAt.toISOString(),
      event.visitorId,
      event.event,
      event.path,
      event.label ?? "",
      event.utmSource ?? "",
      event.device ?? "",
      event.browser ?? "",
      event.duration ?? "",
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")),
  ];
  res.type("text/csv").send(rows.join("\n"));
});

export default router;