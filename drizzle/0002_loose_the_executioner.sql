CREATE TABLE `agentMemories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scope` varchar(32) NOT NULL,
	`memoryKey` varchar(120) NOT NULL,
	`value` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agentMemories_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_memories_user_scope_key_unique` UNIQUE(`userId`,`scope`,`memoryKey`)
);
--> statement-breakpoint
CREATE INDEX `agent_memories_user_updated_idx` ON `agentMemories` (`userId`,`updatedAt`);