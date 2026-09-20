/**
 * Seed script — inserts realistic sample analytics data so the dashboard
 * looks populated for a demo. Every row is marked isSample: true so the
 * dashboard can toggle between "all data" and "real data only".
 *
 * Run with: pnpm seed  (from repo root)
 * Or:       pnpm --filter @workspace/scripts seed
 */

// Load .env from the workspace root so DATABASE_URL and other vars are available.
import "dotenv/config";

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  analyticsEventsTable,
  contactSubmissionsTable,
  newsletterSignupsTable,
  plannerPlansTable,
  quizResultsTable,
  resumeChecksTable,
} from "../../lib/db/src/schema/offerkit.js";

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set. Check your .env file.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Return a random integer between min and max (inclusive). */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Return a date string N days before today (YYYY-MM-DD). */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a UUID-like visitor id. */
function fakeVisitorId(): string {
  return crypto.randomUUID();
}

// ──────────────────────────────────────────────────────────────────────────────
// Sample data pools
// ──────────────────────────────────────────────────────────────────────────────

const PAGES = ["/", "/blog", "/blog/8-week-placement-prep-roadmap", "/blog/ats-friendly-resume", "/blog/top-10-hr-interview-questions", "/blog/aptitude-shortcuts-save-time", "/blog/dsa-in-30-days", "/blog/group-discussion-mistakes", "/tools", "/resources", "/about", "/contact", "/prep-bootcamp"];
const DEVICES = ["mobile", "desktop", "desktop", "desktop", "mobile"]; // weight desktops higher
const BROWSERS = ["Chrome", "Chrome", "Chrome", "Firefox", "Safari", "Edge"];
const OS_LIST = ["Windows", "Android", "iOS", "macOS", "Windows", "Windows"];
const UTM_SOURCES = [null, null, null, "google", "instagram", "linkedin", "direct"];
const UTM_MEDIUMS = [null, null, "cpc", "organic", "social"];
const UTM_CAMPAIGNS = [null, "placement-prep", "resume-guide", "dsa30", null];
const REFERRERS = [null, null, "https://www.google.com", "https://www.linkedin.com", "https://www.instagram.com", "https://t.co"];
const SCREENS = ["1920x1080", "1366x768", "375x812", "390x844", "1280x800", "1440x900"];

// Pool of realistic-looking sample emails for newsletter signups.
const SAMPLE_EMAILS = [
  "arjun.sharma22@cse.ac.in", "priya.nair@vcet.edu.in", "rahul.verma@iiit.ac.in",
  "sneha.kulkarni2024@gmail.com", "dev.mishra@nit.ac.in", "aayushi.joshi@mituniversity.edu.in",
  "karthik.r@sastra.edu", "meera.pillai.cse@gmail.com", "ankur.gupta@lnmiit.ac.in",
  "divya.patel.prep@gmail.com", "siddharth.iyer22@bits.ac.in", "pooja.singh.nit@gmail.com",
  "manish.yadav@kiit.ac.in", "riya.kapoor.cse@gmail.com", "abhishek.tiwari@vit.ac.in",
];

// ──────────────────────────────────────────────────────────────────────────────
// Seeding functions
// ──────────────────────────────────────────────────────────────────────────────

async function seedAnalyticsEvents() {
  console.log("  Seeding analytics events…");
  const rows: (typeof analyticsEventsTable.$inferInsert)[] = [];

  // Generate 60 days of traffic with realistic daily patterns.
  for (let day = 59; day >= 0; day--) {
    const date = daysAgo(day);
    // Weekday traffic is ~1.4× weekend traffic.
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const pageViewCount = isWeekend ? rand(18, 45) : rand(35, 90);

    // Create a pool of visitor ids for this day (some users visit multiple pages).
    const dayVisitors = Array.from({ length: Math.ceil(pageViewCount * 0.7) }, fakeVisitorId);

    for (let i = 0; i < pageViewCount; i++) {
      const visitorId = pick([...dayVisitors, fakeVisitorId()]); // some new, some returning
      const eventDate = new Date(date);
      eventDate.setHours(rand(8, 22), rand(0, 59), rand(0, 59));

      rows.push({
        visitorId,
        event: "page_view",
        path: pick(PAGES),
        label: null,
        referrer: pick(REFERRERS),
        utmSource: pick(UTM_SOURCES),
        utmMedium: pick(UTM_MEDIUMS),
        utmCampaign: pick(UTM_CAMPAIGNS),
        device: pick(DEVICES),
        browser: pick(BROWSERS),
        os: pick(OS_LIST),
        screen: pick(SCREENS),
        duration: rand(30, 420),
        isSample: true,
        createdAt: eventDate,
      });
    }

    // CTA clicks — roughly 12% of page views.
    const ctaCount = Math.ceil(pageViewCount * 0.12);
    const ctaLabels = ["bootcamp-nav", "hero-tools", "hero-bootcamp", "home-all-posts", "blog-sidebar-tools"];
    for (let i = 0; i < ctaCount; i++) {
      const eventDate = new Date(date);
      eventDate.setHours(rand(8, 22), rand(0, 59), rand(0, 59));
      rows.push({
        visitorId: pick(dayVisitors),
        event: "cta_click",
        path: pick(PAGES),
        label: pick(ctaLabels),
        referrer: null,
        utmSource: pick(UTM_SOURCES),
        utmMedium: null,
        utmCampaign: null,
        device: pick(DEVICES),
        browser: pick(BROWSERS),
        os: pick(OS_LIST),
        screen: pick(SCREENS),
        duration: null,
        isSample: true,
        createdAt: eventDate,
      });
    }

    // Blog read events — one per blog page view roughly.
    const blogReaders = rand(3, 12);
    const blogSlugs = ["8-week-placement-prep-roadmap", "ats-friendly-resume", "top-10-hr-interview-questions", "aptitude-shortcuts-save-time", "dsa-in-30-days", "group-discussion-mistakes"];
    for (let i = 0; i < blogReaders; i++) {
      const eventDate = new Date(date);
      eventDate.setHours(rand(9, 21), rand(0, 59), rand(0, 59));
      rows.push({
        visitorId: pick(dayVisitors),
        event: "blog_read",
        path: `/blog/${pick(blogSlugs)}`,
        label: pick(blogSlugs),
        referrer: pick(REFERRERS),
        utmSource: pick(UTM_SOURCES),
        utmMedium: null,
        utmCampaign: null,
        device: pick(DEVICES),
        browser: pick(BROWSERS),
        os: pick(OS_LIST),
        screen: pick(SCREENS),
        duration: rand(120, 480),
        isSample: true,
        createdAt: eventDate,
      });
    }
  }

  // Insert in batches of 100 to avoid hitting query limits.
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(analyticsEventsTable).values(rows.slice(i, i + 100));
  }
  console.log(`    ✓ Inserted ${rows.length} analytics events`);
}

async function seedNewsletterSignups() {
  console.log("  Seeding newsletter signups…");
  const sources = ["footer", "home-hero", "exit-intent", "footer", "footer"];
  let count = 0;

  for (const email of SAMPLE_EMAILS) {
    const dayOffset = rand(0, 45);
    const signupDate = daysAgo(dayOffset);
    signupDate.setHours(rand(10, 20), rand(0, 59));
    try {
      await db.insert(newsletterSignupsTable).values({
        email,
        source: pick(sources),
        isSample: true,
        createdAt: signupDate,
      }).onConflictDoNothing();
      count++;
    } catch {
      // Skip duplicate emails gracefully.
    }
  }
  console.log(`    ✓ Inserted ${count} newsletter signups`);
}

async function seedContactSubmissions() {
  console.log("  Seeding contact submissions…");
  const submissions = [
    { name: "Arjun Sharma", email: "arjun.sharma22@cse.ac.in", message: "Hey, the 8-week roadmap post was super helpful. Would you add a version specifically for data analyst roles?" },
    { name: "Priya Nair", email: "priya.nair@vcet.edu.in", message: "The resume score tool is great. My resume went from 54 to 72 after following the tips. Thank you!" },
    { name: "Rahul Verma", email: "rahul.verma@iiit.ac.in", message: "Is there a way to download the 30-day planner as a PDF? That would make it much easier to follow offline." },
    { name: "Sneha Kulkarni", email: "sneha.kulkarni2024@gmail.com", message: "I shared the group discussion article with my whole placement prep group. The point about listening more was an eye-opener." },
    { name: "Karthik Ramesh", email: "karthik.r@sastra.edu", message: "Would love a post about handling placement season anxiety. The mental side is as hard as the prep itself." },
  ];

  for (const sub of submissions) {
    const dayOffset = rand(2, 50);
    const subDate = daysAgo(dayOffset);
    subDate.setHours(rand(11, 19), rand(0, 59));
    await db.insert(contactSubmissionsTable).values({
      ...sub,
      isSample: true,
      createdAt: subDate,
    });
  }
  console.log(`    ✓ Inserted ${submissions.length} contact submissions`);
}

async function seedQuizResults() {
  console.log("  Seeding quiz results…");
  const levels = ["Ready to sharpen", "Building momentum", "A strong place to start"];
  const count = rand(28, 40);

  for (let i = 0; i < count; i++) {
    const score = rand(20, 95);
    const level = score > 75 ? levels[0] : score > 40 ? levels[1] : levels[2];
    // Simulate 10 answers: 0=Not yet, 1=Sometimes, 2=Yes
    const answers = Array.from({ length: 10 }, () => rand(0, 2));
    const dayOffset = rand(0, 50);
    const resultDate = daysAgo(dayOffset);
    resultDate.setHours(rand(9, 22), rand(0, 59));

    await db.insert(quizResultsTable).values({
      visitorId: fakeVisitorId(),
      score,
      answers,
      level,
      isSample: true,
      createdAt: resultDate,
    });
  }
  console.log(`    ✓ Inserted ${count} quiz results`);
}

async function seedResumeChecks() {
  console.log("  Seeding resume checks…");
  const count = rand(20, 32);

  for (let i = 0; i < count; i++) {
    const score = rand(32, 88);
    const dayOffset = rand(0, 50);
    const checkDate = daysAgo(dayOffset);
    checkDate.setHours(rand(10, 21), rand(0, 59));

    await db.insert(resumeChecksTable).values({
      visitorId: fakeVisitorId(),
      score,
      isSample: true,
      createdAt: checkDate,
    });
  }
  console.log(`    ✓ Inserted ${count} resume checks`);
}

async function seedPlannerPlans() {
  console.log("  Seeding planner plans…");
  const roles = ["Software engineer", "Data analyst", "Product engineer", "Frontend developer"];
  const weakAreaPool = ["DSA", "Projects", "Resume", "Communication", "Aptitude", "Core CS"];
  const count = rand(14, 22);

  for (let i = 0; i < count; i++) {
    const numWeakAreas = rand(1, 3);
    const weakAreas: string[] = [];
    const pool = [...weakAreaPool];
    for (let j = 0; j < numWeakAreas; j++) {
      const idx = rand(0, pool.length - 1);
      weakAreas.push(pool.splice(idx, 1)[0]);
    }
    const dayOffset = rand(0, 50);
    const planDate = daysAgo(dayOffset);
    planDate.setHours(rand(9, 21), rand(0, 59));

    await db.insert(plannerPlansTable).values({
      visitorId: fakeVisitorId(),
      targetRole: pick(roles),
      weakAreas,
      isSample: true,
      createdAt: planDate,
    });
  }
  console.log(`    ✓ Inserted ${count} planner plans`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Seeding OfferKit database with sample data…\n");
  try {
    await seedAnalyticsEvents();
    await seedNewsletterSignups();
    await seedContactSubmissions();
    await seedQuizResults();
    await seedResumeChecks();
    await seedPlannerPlans();
    console.log("\n✅ Seed complete. All rows are marked isSample=true.\n");
    console.log('   Toggle "Show sample data" on the dashboard to hide them during your demo.\n');
  } catch (err) {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
