## migration summary
### drizzle/0000_elite_eternals.sql
1:CREATE TABLE `users` (
11:	CONSTRAINT `users_id` PRIMARY KEY(`id`),
12:	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
### drizzle/0001_rapid_shen.sql
1:CREATE TABLE `adminUsers` (
11:	CONSTRAINT `adminUsers_id` PRIMARY KEY(`id`),
12:	CONSTRAINT `adminUsers_username_unique` UNIQUE(`username`),
13:	CONSTRAINT `adminUsers_email_unique` UNIQUE(`email`)
16:CREATE TABLE `coupons` (
27:	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
28:	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
31:CREATE TABLE `invoices` (
47:	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
48:	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
51:CREATE TABLE `payments` (
63:	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
64:	CONSTRAINT `payments_transactionId_unique` UNIQUE(`transactionId`)
67:CREATE TABLE `subscriptionHistory` (
76:	CONSTRAINT `subscriptionHistory_id` PRIMARY KEY(`id`)
79:CREATE TABLE `subscriptionPlans` (
92:	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
95:CREATE TABLE `usageStatistics` (
104:	CONSTRAINT `usageStatistics_id` PRIMARY KEY(`id`)
107:CREATE TABLE `userSubscriptions` (
119:	CONSTRAINT `userSubscriptions_id` PRIMARY KEY(`id`)
122:ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
123:ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
124:ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
125:ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp;--> statement-breakpoint
126:ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
### drizzle/0002_amused_young_avengers.sql
1:CREATE TABLE `invoiceItems` (
9:	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
12:CREATE TABLE `paymentMethods` (
25:	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`)
28:CREATE TABLE `refunds` (
38:	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
41:CREATE TABLE `userCouponUsage` (
48:	CONSTRAINT `userCouponUsage_id` PRIMARY KEY(`id`)
51:ALTER TABLE `coupons` ADD `minAmount` decimal(10,2);--> statement-breakpoint
52:ALTER TABLE `coupons` ADD `maxAmount` decimal(10,2);--> statement-breakpoint
53:ALTER TABLE `coupons` ADD `validFrom` datetime;--> statement-breakpoint
54:ALTER TABLE `coupons` ADD `validUntil` datetime;
### drizzle/0003_clean_sister_grimm.sql
1:CREATE TABLE `emailQueue` (
18:	CONSTRAINT `emailQueue_id` PRIMARY KEY(`id`)
21:CREATE TABLE `notificationHistory` (
32:	CONSTRAINT `notificationHistory_id` PRIMARY KEY(`id`)
35:CREATE TABLE `notificationPreferences` (
49:	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
50:	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
53:CREATE TABLE `notifications` (
68:	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
### drizzle/0004_bright_champions.sql
1:CREATE TABLE `devices` (
10:	CONSTRAINT `devices_id` PRIMARY KEY(`id`)

## schema columns by table
16:export const users = mysqlTable("users", {
34:export const subscriptionPlans = mysqlTable("subscriptionPlans", {
55:export const userSubscriptions = mysqlTable("userSubscriptions", {
75:export const subscriptionHistory = mysqlTable("subscriptionHistory", {
92:export const payments = mysqlTable("payments", {
112:export const invoices = mysqlTable("invoices", {
136:export const usageStatistics = mysqlTable("usageStatistics", {
153:export const coupons = mysqlTable("coupons", {
176:export const adminUsers = mysqlTable("adminUsers", {
194:export const devices = mysqlTable("devices", {
211:export const paymentMethods = mysqlTable("paymentMethods", {
232:export const refunds = mysqlTable("refunds", {
250:export const invoiceItems = mysqlTable("invoiceItems", {
266:export const userCouponUsage = mysqlTable("userCouponUsage", {
282:export const notifications = mysqlTable("notifications", {
320:export const notificationPreferences = mysqlTable("notificationPreferences", {
342:export const emailQueue = mysqlTable("emailQueue", {
367:export const notificationHistory = mysqlTable("notificationHistory", {

## migration journal
{
  "version": "7",
  "dialect": "mysql",
  "entries": [
    {
      "idx": 0,
      "version": "5",
      "when": 1763372440610,
      "tag": "0000_elite_eternals",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "5",
      "when": 1770854518123,
      "tag": "0001_rapid_shen",
      "breakpoints": true
    },
    {
      "idx": 2,
      "version": "5",
      "when": 1770855687789,
      "tag": "0002_amused_young_avengers",
      "breakpoints": true
    },
    {
      "idx": 3,
      "version": "5",
      "when": 1770938943040,
      "tag": "0003_clean_sister_grimm",
      "breakpoints": true
    },
    {
      "idx": 4,
      "version": "5",
      "when": 1773888353017,
      "tag": "0004_bright_champions",
      "breakpoints": true
    }
  ]
}