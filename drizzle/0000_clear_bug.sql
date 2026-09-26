CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`slot` integer NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`z` real DEFAULT 8 NOT NULL,
	`heading` real DEFAULT 0 NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`shots` integer DEFAULT 0 NOT NULL,
	`weapon` text DEFAULT 'PULSE_SIDEARM' NOT NULL,
	`perk` text DEFAULT 'NONE' NOT NULL,
	`last_shot_at` integer DEFAULT 0 NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_token` ON `players` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_room_name` ON `players` (`room_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_players_room` ON `players` (`room_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`device_key` text NOT NULL,
	`name` text NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`best_level` integer DEFAULT 1 NOT NULL,
	`matches` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_device_key` ON `profiles` (`device_key`);--> statement-breakpoint
CREATE INDEX `idx_profiles_score` ON `profiles` (`total_score`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`host_player_id` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`started_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rooms_code` ON `rooms` (`code`);--> statement-breakpoint
CREATE TABLE `targets` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`level` integer NOT NULL,
	`target_index` integer NOT NULL,
	`x` real NOT NULL,
	`z` real NOT NULL,
	`hp` integer NOT NULL,
	`max_hp` integer NOT NULL,
	`kind` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_targets_room_index` ON `targets` (`room_id`,`target_index`);--> statement-breakpoint
CREATE INDEX `idx_targets_room_level` ON `targets` (`room_id`,`level`);