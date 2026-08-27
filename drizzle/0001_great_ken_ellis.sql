CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`prefix` varchar(32) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`scopes` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_prefix_unique` UNIQUE(`prefix`),
	CONSTRAINT `apiKeys_keyHash_unique` UNIQUE(`keyHash`)
);
