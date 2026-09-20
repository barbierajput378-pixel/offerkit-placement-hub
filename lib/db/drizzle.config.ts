import { defineConfig } from "drizzle-kit";
import { fileURLToPath } from "url";
import path from "path";

// Load .env from the workspace root so DATABASE_URL is available when running
// drizzle-kit commands directly (e.g. pnpm --filter @workspace/db migrate).
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your .env file.");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: "./src/schema/offerkit.ts",
  out: path.join(__dirname, "./drizzle"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
