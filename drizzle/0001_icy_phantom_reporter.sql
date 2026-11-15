ALTER TABLE `users` ADD `api_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_api_key_unique` ON `users` (`api_key`);