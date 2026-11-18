CREATE TABLE `artists` (
	`id` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`city` varchar(80) NOT NULL,
	`genre` varchar(100) NOT NULL,
	`lineup` varchar(160) NOT NULL,
	`pricePaise` int NOT NULL,
	`status` enum('draft','published','paused') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `availabilityRequests` (
	`id` varchar(64) NOT NULL,
	`eventPlanId` varchar(64) NOT NULL,
	`status` enum('draft','submitted','pending','available','unavailable','expired','error') NOT NULL DEFAULT 'draft',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `availabilityRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` varchar(64) NOT NULL,
	`eventPlanId` varchar(64) NOT NULL,
	`quoteId` varchar(64) NOT NULL,
	`paymentId` varchar(64) NOT NULL,
	`status` enum('confirmed','cancel_requested','cancelled','completed') NOT NULL DEFAULT 'confirmed',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventPlans` (
	`id` varchar(64) NOT NULL,
	`userId` int,
	`occasion` varchar(100) NOT NULL,
	`city` varchar(80) NOT NULL,
	`eventDate` varchar(32) NOT NULL,
	`guestCount` int NOT NULL,
	`budgetPaise` int NOT NULL,
	`style` varchar(100) NOT NULL,
	`selectedVenueId` varchar(64),
	`selectedArtistId` varchar(64),
	`status` enum('draft','requested','quoted','confirmed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(64) NOT NULL,
	`quoteId` varchar(64) NOT NULL,
	`amountPaise` int NOT NULL,
	`mode` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
	`status` enum('pending','succeeded','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`idempotencyKey` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(64) NOT NULL,
	`eventPlanId` varchar(64) NOT NULL,
	`venueFeePaise` int NOT NULL,
	`artistFeePaise` int NOT NULL,
	`productionFeePaise` int NOT NULL,
	`platformFeePaise` int NOT NULL,
	`taxPaise` int NOT NULL,
	`depositPaise` int NOT NULL,
	`validUntil` timestamp NOT NULL,
	`status` enum('draft','sent','accepted','expired','rejected') NOT NULL DEFAULT 'sent',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venues` (
	`id` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`city` varchar(80) NOT NULL,
	`area` varchar(120) NOT NULL,
	`type` varchar(80) NOT NULL,
	`capacity` int NOT NULL,
	`pricePaise` int NOT NULL,
	`availabilityMode` enum('instant','partner','manual') NOT NULL DEFAULT 'partner',
	`status` enum('draft','published','paused') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venues_id` PRIMARY KEY(`id`)
);
