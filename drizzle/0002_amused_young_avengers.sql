CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`methodType` enum('credit_card','debit_card','bank_account','wallet') NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`stripePaymentMethodId` varchar(255),
	`last4` varchar(4),
	`expiryMonth` int,
	`expiryYear` int,
	`cardBrand` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paymentId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reason` text,
	`refundStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`stripeRefundId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCouponUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`couponId` int NOT NULL,
	`invoiceId` int,
	`discountAmount` decimal(10,2) NOT NULL,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCouponUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `coupons` ADD `minAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `coupons` ADD `maxAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `coupons` ADD `validFrom` datetime;--> statement-breakpoint
ALTER TABLE `coupons` ADD `validUntil` datetime;