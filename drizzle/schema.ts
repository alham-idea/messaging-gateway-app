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
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
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
 * User subscriptions table for tracking active subscriptions
 */
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended", "expired", "cancelled"]).default("active").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly").notNull(),
  nextBillingDate: timestamp("nextBillingDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * Plan upgrade/downgrade history table
 */
export const subscriptionHistory = mysqlTable("subscriptionHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromPlanId: int("fromPlanId"),
  toPlanId: int("toPlanId").notNull(),
  changeType: mysqlEnum("changeType", ["upgrade", "downgrade", "initial", "renewal", "cancellation"]).notNull(),
  reason: text("reason"),
  effectiveDate: timestamp("effectiveDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type InsertSubscriptionHistory = typeof subscriptionHistory.$inferInsert;

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
  minAmount: decimal("minAmount", { precision: 10, scale: 2 }),
  maxAmount: decimal("maxAmount", { precision: 10, scale: 2 }),
  validFrom: datetime("validFrom"),
  validUntil: datetime("validUntil"),
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

/**
 * Payment methods table for storing user payment methods
 */
export const paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  methodType: mysqlEnum("methodType", ["credit_card", "debit_card", "bank_account", "wallet"]).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 255 }),
  last4: varchar("last4", { length: 4 }),
  expiryMonth: int("expiryMonth"),
  expiryYear: int("expiryYear"),
  cardBrand: varchar("cardBrand", { length: 50 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;

/**
 * Refunds table for tracking refund transactions
 */
export const refunds = mysqlTable("refunds", {
  id: int("id").autoincrement().primaryKey(),
  paymentId: int("paymentId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  refundStatus: mysqlEnum("refundStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  stripeRefundId: varchar("stripeRefundId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = typeof refunds.$inferInsert;

/**
 * Invoices items table for detailed invoice line items
 */
export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: text("description").notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

/**
 * User coupon usage table
 */
export const userCouponUsage = mysqlTable("userCouponUsage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  couponId: int("couponId").notNull(),
  invoiceId: int("invoiceId"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp("usedAt").defaultNow().notNull(),
});

export type UserCouponUsage = typeof userCouponUsage.$inferSelect;
export type InsertUserCouponUsage = typeof userCouponUsage.$inferInsert;
