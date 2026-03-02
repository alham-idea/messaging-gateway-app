import { eq, and, or, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptionPlans, payments, invoices, usageStatistics, coupons, adminUsers, userSubscriptions, subscriptionHistory, paymentMethods, refunds, notifications, notificationPreferences, emailQueue, notificationHistory } from "../drizzle/schema";
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

export async function getUserPayments(userId: number, limit: number = 10, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(limit).offset(offset);
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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


/**
 * Payment Method Functions
 */

export async function addPaymentMethod(methodData: {
  userId: number;
  methodType: string;
  last4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // If this is the default, unset other defaults
  if (methodData.isDefault) {
    await db.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.userId, methodData.userId));
  }

  await db.insert(paymentMethods).values({
    userId: methodData.userId,
    methodType: methodData.methodType as any,
    last4: methodData.last4,
    cardBrand: methodData.cardBrand,
    expiryMonth: methodData.expiryMonth,
    expiryYear: methodData.expiryYear,
    isDefault: methodData.isDefault,
  });

  const userMethods = await getUserPaymentMethods(methodData.userId);
  const lastMethod = userMethods[userMethods.length - 1];
  return lastMethod;
}

export async function getPaymentMethodById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserPaymentMethods(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(paymentMethods).where(and(eq(paymentMethods.userId, userId), eq(paymentMethods.isActive, true)));
}

export async function deletePaymentMethod(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(paymentMethods).set({ isActive: false }).where(eq(paymentMethods.id, id));
}

/**
 * Refund Functions
 */

export async function createRefund(refundData: {
  paymentId: number;
  userId: number;
  amount: string | number;
  reason?: string;
  refundStatus: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(refunds).values({
    paymentId: refundData.paymentId,
    userId: refundData.userId,
    amount: refundData.amount.toString(),
    reason: refundData.reason,
    refundStatus: refundData.refundStatus as any,
  });

  const userRefunds = await db.select().from(refunds).where(eq(refunds.userId, refundData.userId)).orderBy(desc(refunds.id)).limit(1);
  return userRefunds[0];
}

export async function getRefundById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(refunds).where(eq(refunds.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Invoice Functions (Additional)
 */

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateInvoiceStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { invoiceStatus: status };
  if (status === "paid") {
    updateData.paidDate = new Date();
  }

  await db.update(invoices).set(updateData).where(eq(invoices.id, id));
  return getInvoiceById(id);
}


/**
 * Invoice Generation Functions
 */

/**
 * توليد رقم فاتورة فريد
 */
function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

/**
 * إنشاء فاتورة جديدة تلقائياً
 */
export async function createInvoiceForSubscription(
  userId: number,
  subscriptionId: number
): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // جلب بيانات الاشتراك
    const subscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.id, subscriptionId))
      .limit(1);
    
    if (!subscription || subscription.length === 0) return null;

    const sub = subscription[0];

    // جلب بيانات الخطة
    const planResult = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, sub.planId)).limit(1);
    const plan = planResult.length > 0 ? planResult[0] : null;

    if (!plan) {
      console.error(`Plan not found: ${sub.planId}`);
      return null;
    }

    // توليد رقم الفاتورة
    const invoiceNumber = generateInvoiceNumber();
    const now = new Date();
    const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 يوم
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // حساب المبلغ والضريبة
    const amount = parseFloat(plan.monthlyPrice.toString());
    const taxAmount = amount * 0.15; // 15% ضريبة
    const totalAmount = amount + taxAmount;

    // إنشاء الفاتورة
    await db.insert(invoices).values({
      userId,
      invoiceNumber,
      amount: amount.toString(),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      currency: "SAR",
      invoiceStatus: "issued",
      billingPeriodStart,
      billingPeriodEnd,
      dueDate,
      notes: `اشتراك ${plan.name} - ${plan.description}`,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Invoice created: ${invoiceNumber}`);
    return invoiceNumber;
  } catch (error) {
    console.error("Error creating invoice:", error);
    return null;
  }
}

/**
 * إنشاء فواتير لجميع الاشتراكات النشطة
 */
export async function createMonthlyInvoices(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subscriptions = await db.select().from(userSubscriptions).where(eq(userSubscriptions.status, "active"));

    let count = 0;
    for (const subscription of subscriptions) {
      const result = await createInvoiceForSubscription(
        subscription.userId,
        subscription.id
      );
      if (result) {
        count++;
      }
    }

    console.log(`Created ${count} invoices`);
    return count;
  } catch (error) {
    console.error("Error creating monthly invoices:", error);
    return 0;
  }
}

/**
 * جلب الفواتير المعلقة
 */
export async function getPendingInvoices(): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.select().from(invoices).where(eq(invoices.invoiceStatus, "issued"));
  } catch (error) {
    console.error("Error getting pending invoices:", error);
    return [];
  }
}

/**
 * جلب الفواتير المتأخرة
 */
export async function getOverdueInvoices(): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db.select().from(invoices).where(eq(invoices.invoiceStatus, "overdue"));
  } catch (error) {
    console.error("Error getting overdue invoices:", error);
    return [];
  }
}


/**
 * Notification Management Functions
 */

export async function createNotification(
  userId: number,
  data: {
    type: string;
    title: string;
    message: string;
    priority?: string;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  }
): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.insert(notifications).values({
      userId,
      type: data.type as any,
      title: data.title,
      message: data.message,
      priority: (data.priority || "normal") as any,
      actionUrl: data.actionUrl,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function getNotifications(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    type?: string;
  } = {}
): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const conditions = [eq(notifications.userId, userId)];
    if (options.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    if (options.type) {
      conditions.push(eq(notifications.type, options.type as any));
    }

    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(options.limit || 20)
      .offset(options.offset || 0);
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: number): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.userId, userId));

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    return result.length;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    return 0;
  }
}

export async function getNotificationPreferences(userId: number): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    return prefs[0] || null;
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    return null;
  }
}

export async function updateNotificationPreferences(
  userId: number,
  data: Record<string, any>
): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existing = await getNotificationPreferences(userId);

    if (existing) {
      await db
        .update(notificationPreferences)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId));
    } else {
      await db.insert(notificationPreferences).values({
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
}

export async function createEmailQueueItem(data: {
  userId: number;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  notificationType?: string;
}): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.insert(emailQueue).values({
      userId: data.userId,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      htmlContent: data.htmlContent,
      textContent: data.textContent,
      notificationType: data.notificationType,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating email queue item:", error);
    throw error;
  }
}

export async function getEmailQueue(options: {
  limit?: number;
  status?: string;
}): Promise<any[]> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    if (options.status) {
      return await db
        .select()
        .from(emailQueue)
        .where(eq(emailQueue.status, options.status as any))
        .orderBy(desc(emailQueue.createdAt))
        .limit(options.limit || 50);
    }

    return await db
      .select()
      .from(emailQueue)
      .orderBy(desc(emailQueue.createdAt))
      .limit(options.limit || 50);
  } catch (error) {
    console.error("Error getting email queue:", error);
    return [];
  }
}

export async function updateEmailQueueStatus(
  emailId: number,
  status: string
): Promise<any> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(emailQueue)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(emailQueue.id, emailId));

    return { success: true };
  } catch (error) {
    console.error("Error updating email queue status:", error);
    throw error;
  }
}


/**
 * Admin Helper Functions
 */

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users);
}

export async function getAllActiveSubscriptions() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(userSubscriptions).where(eq(userSubscriptions.status, "active"));
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsageStatistics() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(usageStatistics).orderBy(desc(usageStatistics.date));
}
