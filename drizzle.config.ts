import { env } from "~/env.server";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./app/.server/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DB_FILE_NAME,
  },
});
