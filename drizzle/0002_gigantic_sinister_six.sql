PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_commentary` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`minute` integer NOT NULL,
	`sequence` integer NOT NULL,
	`period` text,
	`event_type` text NOT NULL,
	`actor` text,
	`team` text,
	`message` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`tags` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_commentary`("id", "match_id", "minute", "sequence", "period", "event_type", "actor", "team", "message", "metadata", "tags", "created_at", "updated_at") SELECT "id", "match_id", "minute", "sequence", "period", "event_type", "actor", "team", "message", "metadata", "tags", "created_at", "updated_at" FROM `commentary`;--> statement-breakpoint
DROP TABLE `commentary`;--> statement-breakpoint
ALTER TABLE `__new_commentary` RENAME TO `commentary`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `commentary_match_timeline_idx` ON `commentary` (`match_id`,`minute`,`sequence`);