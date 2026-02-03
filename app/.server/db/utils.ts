import { createId } from "@paralleldrive/cuid2";
import { integer, text } from "drizzle-orm/sqlite-core";

/**
 * Generates a unique ID using `createId`.
 * @see https://github.com/paralleldrive/cuid2
 */
export const createIdFn = () => createId();

/**
 * Primary key using cuid2
 */
export const primaryKeyCuid2 = text("id")
  .primaryKey()
  .$defaultFn(() => createId());

/**
 * created_at timestamp (seconds)
 */
export const createdAtTimestamp = integer("created_at", {
  mode: "timestamp_ms",
})
  .notNull()
  .$defaultFn(() => new Date());

/**
 * updated_at timestamp (seconds)
 */
export const updatedAtTimestamp = integer("updated_at", {
  mode: "timestamp_ms",
})
  .notNull()
  .$defaultFn(() => new Date())
  .$onUpdateFn(() => new Date());

export const timestamps = {
  createdAt: createdAtTimestamp,
  updatedAt: updatedAtTimestamp,
};
