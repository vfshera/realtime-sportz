import { defineConfig } from "drizzle-kit";
import { env } from "~/env.server";

export default defineConfig({
  out: "./drizzle",
  schema: "./app/.server/db/schema",
  dialect: "sqlite",
  dbCredentials: {
    url: env.DB_FILE_NAME,
  },
});
