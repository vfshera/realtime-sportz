import { env } from "~/env.server";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/libsql";

export const db = drizzle({ connection: env.DB_FILE_NAME, schema });

export type DB = typeof db;
