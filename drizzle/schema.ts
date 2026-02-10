import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  datetime
} from "drizzle-orm/mysql-core";

/**
 * Core user table for authentication and user management.
 * Extended with subscription and billing information.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  // Business information
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessAddress: text("businessAddress"),
  businessPhone: varchar("businessPhone", { length: 20 }),
  // User credentials
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  // Subscription info
  subscriptionPlanId: int("subscriptionPlanId").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "inactive", "suspended", "expired"]).default("active").notNull(),
  subscriptionStartDate: timestamp("subscriptionStartDate").defaultNow().notNull(),
  subscriptionEndDate: timestamp("subscriptionEndDate"),
  // Balance and usage
  accountBalance: decimal("accountBalance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  messagesUsedWhatsapp: int("messagesUsedWhatsapp").default(0).notNull(),
  messagesUsedSms: int("messagesUsedSms").default(0).notNull(),
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Subscription plans table
 */
export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPrice: decimal("monthlyPrice", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearlyPrice", { precision: 10, scale: 2 }),
  whatsappMessagesLimit: int("whatsappMessagesLimit").notNull(),
  smsMessagesLimit: int("smsMessagesLimit").notNull(),
  supportLevel: mysqlEnum("supportLevel", ["basic", "standard", "premium"]).default("basic").notNull(),
  features: text("features"), // JSON string of features
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * Payments table for tracking all transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("SAR").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["credit_card", "bank_transfer", "wallet", "other"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 255 }).unique(),
  description: text("description"),
  invoiceId: int("invoiceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Invoices table for billing records
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("SAR").notNull(),
  invoiceStatus: mysqlEnum("invoiceStatus", ["draft", "issued", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  billingPeriodStart: datetime("billingPeriodStart").notNull(),
  billingPeriodEnd: datetime("billingPeriodEnd").notNull(),
  dueDate: datetime("dueDate"),
  paidDate: datetime("paidDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Usage statistics table for tracking message usage
 */
export const usageStatistics = mysqlTable("usageStatistics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: datetime("date").notNull(),
  whatsappMessagesSent: int("whatsappMessagesSent").default(0).notNull(),
  whatsappMessagesFailed: int("whatsappMessagesFailed").default(0).notNull(),
  smsMessagesSent: int("smsMessagesSent").default(0).notNull(),
  smsMessagesFailed: int("smsMessagesFailed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsageStatistic = typeof usageStatistics.$inferSelect;
export type InsertUsageStatistic = typeof usageStatistics.$inferInsert;

/**
 * Coupons and discounts table
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  maxUses: int("maxUses"),
  currentUses: int("currentUses").default(0).notNull(),
  expiryDate: datetime("expiryDate"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

/**
 * Admin users table for dashboard access
 */
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["super_admin", "admin", "moderator"]).default("admin").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
