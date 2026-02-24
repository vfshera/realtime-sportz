import { env } from "~/env.server";
import * as schema from "./schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

export const db = drizzle({ connection: env.DB_FILE_NAME, schema });

await db.run(sql`PRAGMA journal_mode = WAL;`);

export type DB = typeof db;
