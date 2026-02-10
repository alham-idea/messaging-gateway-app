import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptionPlans, payments, invoices, usageStatistics, coupons, adminUsers } from "../drizzle/schema";
import { ENV } from "./_core/env";
import * as bcrypt from "bcrypt";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management Functions
 */

export async function createUser(userData: {
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  username: string;
  email: string;
  password: string;
  subscriptionPlanId: number;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);

  const result = await db.insert(users).values({
    businessName: userData.businessName,
    businessAddress: userData.businessAddress,
    businessPhone: userData.businessPhone,
    username: userData.username,
    email: userData.email,
    passwordHash,
    subscriptionPlanId: userData.subscriptionPlanId,
    subscriptionStatus: "active",
    accountBalance: "0.00",
    isActive: true,
  });

  const insertedUser = await getUserByUsername(userData.username);
  if (!insertedUser) throw new Error("Failed to create user");
  return { id: insertedUser.id };
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(updates).where(eq(users.id, id));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Subscription Functions
 */

export async function getSubscriptionPlan(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

/**
 * Payment Functions
 */

export async function createPayment(paymentData: {
  userId: number;
  amount: string;
  paymentMethod: "credit_card" | "bank_transfer" | "wallet" | "other";
  description?: string;
  invoiceId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(payments).values({
    userId: paymentData.userId,
    amount: paymentData.amount,
    paymentMethod: paymentData.paymentMethod,
    description: paymentData.description,
    invoiceId: paymentData.invoiceId,
    paymentStatus: "pending",
  });

  const userPayments = await getUserPayments(paymentData.userId);
  const lastPayment = userPayments[userPayments.length - 1];
  return { id: lastPayment?.id || 0 };
}

export async function updatePaymentStatus(id: number, status: "pending" | "completed" | "failed" | "refunded", transactionId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: any = { paymentStatus: status };
  if (transactionId) updates.transactionId = transactionId;

  await db.update(payments).set(updates).where(eq(payments.id, id));
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payments).where(eq(payments.userId, userId));
}

/**
 * Invoice Functions
 */

export async function createInvoice(invoiceData: {
  userId: number;
  invoiceNumber: string;
  amount: string;
  taxAmount?: string;
  totalAmount: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate?: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(invoices).values({
    userId: invoiceData.userId,
    invoiceNumber: invoiceData.invoiceNumber,
    amount: invoiceData.amount,
    taxAmount: invoiceData.taxAmount || "0.00",
    totalAmount: invoiceData.totalAmount,
    billingPeriodStart: invoiceData.billingPeriodStart,
    billingPeriodEnd: invoiceData.billingPeriodEnd,
    dueDate: invoiceData.dueDate,
    notes: invoiceData.notes,
    invoiceStatus: "issued",
  });

  const userInvoices = await getUserInvoices(invoiceData.userId);
  const lastInvoice = userInvoices[userInvoices.length - 1];
  return { id: lastInvoice?.id || 0 };
}

export async function getUserInvoices(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(invoices).where(eq(invoices.userId, userId));
}

/**
 * Usage Statistics Functions
 */

export async function recordUsageStatistics(userId: number, stats: {
  whatsappMessagesSent?: number;
  whatsappMessagesFailed?: number;
  smsMessagesSent?: number;
  smsMessagesFailed?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(usageStatistics).values({
    userId,
    date: new Date(),
    whatsappMessagesSent: stats.whatsappMessagesSent || 0,
    whatsappMessagesFailed: stats.whatsappMessagesFailed || 0,
    smsMessagesSent: stats.smsMessagesSent || 0,
    smsMessagesFailed: stats.smsMessagesFailed || 0,
  });
}

export async function getUserUsageStatistics(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return db.select().from(usageStatistics).where(
    and(
      eq(usageStatistics.userId, userId),
      // Add date filter if needed
    )
  );
}

/**
 * Coupon Functions
 */

export async function getCouponByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(coupons).where(
    and(
      eq(coupons.code, code),
      eq(coupons.isActive, true)
    )
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function useCoupon(couponId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const coupon = await db.select().from(coupons).where(eq(coupons.id, couponId)).limit(1);
  if (coupon.length === 0) throw new Error("Coupon not found");

  const currentUses = coupon[0].currentUses || 0;
  const maxUses = coupon[0].maxUses;

  if (maxUses && currentUses >= maxUses) {
    throw new Error("Coupon usage limit reached");
  }

  await db.update(coupons).set({
    currentUses: currentUses + 1,
  }).where(eq(coupons.id, couponId));
}

/**
 * Admin User Functions
 */

export async function createAdminUser(adminData: {
  username: string;
  email: string;
  password: string;
  role: "super_admin" | "admin" | "moderator";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await bcrypt.hash(adminData.password, 10);

  await db.insert(adminUsers).values({
    username: adminData.username,
    email: adminData.email,
    passwordHash,
    role: adminData.role,
    isActive: true,
  });

  const adminUser = await getAdminUserByUsername(adminData.username);
  if (!adminUser) throw new Error("Failed to create admin user");
  return { id: adminUser.id };
}

export async function getAdminUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// TODO: add more feature queries as your schema grows.
