CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`title` text NOT NULL,
	`recruitment_type` text NOT NULL,
	`locations` text NOT NULL,
	`search_text` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `jobs_company_idx` ON `jobs` (`company`);--> statement-breakpoint
CREATE INDEX `jobs_stage_idx` ON `jobs` (`recruitment_type`);