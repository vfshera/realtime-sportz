ALTER TABLE `commentary` RENAME COLUMN "minute" TO "elapsed_time";--> statement-breakpoint
DROP INDEX `commentary_match_timeline_idx`;--> statement-breakpoint
CREATE INDEX `commentary_match_timeline_idx` ON `commentary` (`match_id`,`elapsed_time`,`sequence`);