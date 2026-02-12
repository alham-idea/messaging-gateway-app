import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptionPlans, payments, invoices, usageStatistics, coupons, adminUsers, userSubscriptions, subscriptionHistory } from "../drizzle/schema";
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
  name?: string;
  email: string;
  loginMethod?: string;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values({
    name: userData.name,
    email: userData.email,
    loginMethod: userData.loginMethod,
    role: "user",
  });

  const insertedUser = await getUserByEmail(userData.email);
  if (!insertedUser) throw new Error("Failed to create user");
  return { id: insertedUser.id };
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
 * Subscription Plan Functions
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

export async function createSubscriptionPlan(planData: {
  name: string;
  description?: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  whatsappMessagesLimit: number;
  smsMessagesLimit: number;
  supportLevel: "basic" | "standard" | "premium";
  features?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(subscriptionPlans).values({
    name: planData.name,
    description: planData.description,
    monthlyPrice: planData.monthlyPrice,
    yearlyPrice: planData.yearlyPrice,
    whatsappMessagesLimit: planData.whatsappMessagesLimit,
    smsMessagesLimit: planData.smsMessagesLimit,
    supportLevel: planData.supportLevel,
    features: planData.features,
    isActive: true,
  });

  const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, planData.name));
  return { id: plans[plans.length - 1]?.id || 0 };
}

/**
 * User Subscription Functions
 */

export async function createUserSubscription(subscriptionData: {
  userId: number;
  planId: number;
  billingCycle: "monthly" | "yearly";
  autoRenew?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const endDate = new Date();
  if (subscriptionData.billingCycle === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const nextBillingDate = new Date(endDate);

  await db.insert(userSubscriptions).values({
    userId: subscriptionData.userId,
    planId: subscriptionData.planId,
    status: "active",
    billingCycle: subscriptionData.billingCycle,
    autoRenew: subscriptionData.autoRenew ?? true,
    endDate,
    nextBillingDate,
  });

  const subscriptions = await db.select().from(userSubscriptions).where(eq(userSubscriptions.userId, subscriptionData.userId));
  return { id: subscriptions[subscriptions.length - 1]?.id || 0 };
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, "active")
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSubscription(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userSubscriptions).set(updates).where(eq(userSubscriptions.id, id));
}

export async function upgradeSubscription(userId: number, newPlanId: number, changeType: "upgrade" | "downgrade") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentSubscription = await getUserSubscription(userId);
  if (!currentSubscription) throw new Error("User has no active subscription");

  // Record history
  await db.insert(subscriptionHistory).values({
    userId,
    fromPlanId: currentSubscription.planId,
    toPlanId: newPlanId,
    changeType,
  });

  // Update subscription
  const endDate = new Date();
  if (currentSubscription.billingCycle === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  await updateUserSubscription(currentSubscription.id, {
    planId: newPlanId,
    endDate,
    nextBillingDate: endDate,
  });
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
