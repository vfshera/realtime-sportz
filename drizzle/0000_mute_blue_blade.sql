CREATE TABLE `commentary` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` integer NOT NULL,
	`minute` integer NOT NULL,
	`sequence` integer NOT NULL,
	`period` text,
	`event_type` text NOT NULL,
	`actor` text,
	`team` text,
	`message` text NOT NULL,
	`metadata` text,
	`tags` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `commentary_match_timeline_idx` ON `commentary` (`match_id`,`minute`,`sequence`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`sport` text NOT NULL,
	`home_team` text NOT NULL,
	`away_team` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer,
	`home_score` integer DEFAULT 0 NOT NULL,
	`away_score` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "status_check" CHECK("matches"."status" in ('scheduled','live','finished'))
);
