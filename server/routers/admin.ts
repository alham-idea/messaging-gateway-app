import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { requireAdmin, trpcHandler, findOrThrow, paginate } from "../_core/router-utils";

/**
 * Admin Router - API endpoints for admin dashboard
 * All endpoints require admin authentication
 */

export const adminRouter = router({
  /**
   * Get dashboard statistics
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    return trpcHandler(async () => {
      requireAdmin(ctx, "access dashboard");

      const users = await db.getAllUsers();
      const totalUsers = users?.length || 0;

      const subscriptions = await db.getAllActiveSubscriptions();
      const activeSubscriptions = subscriptions?.length || 0;

      const payments = await db.getAllPayments();
      const monthlyRevenue = payments?.reduce((sum: number, p: any) => {
        if (p.paymentStatus === "completed") {
          return sum + parseFloat(p.amount || 0);
        }
        return sum;
      }, 0) || 0;

      const failedPayments = payments?.filter((p: any) => p.paymentStatus === "failed").length || 0;

      const chartData = generateChartData();

      return {
        totalUsers,
        activeSubscriptions,
        monthlyRevenue,
        failedPayments,
        chartData,
      };
    }, "Failed to fetch dashboard statistics");
  }),

  /**
   * Get all users with pagination and filtering
   */
  getUsers: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access user list");

        const users = await db.getAllUsers();
        let filtered = users || [];

        if (input.search) {
          filtered = filtered.filter(
            (u: any) =>
              u.name?.toLowerCase().includes(input.search!.toLowerCase()) ||
              u.email?.toLowerCase().includes(input.search!.toLowerCase())
          );
        }

        const { items, total, limit, offset } = paginate(filtered, input);

        const allDevices = await db.getAllDevices();

        const itemsWithDevices = items.map((u: any) => ({
          ...u,
          devices: allDevices.filter(d => d.userId === u.id)
        }));

        return { items: itemsWithDevices, total, limit, offset };
      }, "Failed to fetch users");
    }),

  /**
   * Get user details
   */
  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access user details");

        const user = await findOrThrow(
          () => db.getUserById(input.userId),
          "User",
        );

        const subscription = await db.getUserSubscription(input.userId);
        const payments = await db.getUserPayments(input.userId, 100);
        const invoices = await db.getUserInvoices(input.userId);

        return { user, subscription, payments, invoices };
      }, "Failed to fetch user details");
    }),

  /**
   * Update user status
   */
  updateUserStatus: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "update user status");

        await db.updateUser(input.userId, {
          role: input.isActive ? "user" : "user",
        });

        return { success: true };
      }, "Failed to update user status");
    }),

  /**
   * Get all subscriptions
   */
  getSubscriptions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
        status: z.enum(["active", "cancelled", "expired"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access subscriptions");

        const subscriptions = await db.getAllActiveSubscriptions();
        let filtered = subscriptions || [];

        if (input.status) {
          filtered = filtered.filter((s: any) => s.status === input.status);
        }

        return paginate(filtered, input);
      }, "Failed to fetch subscriptions");
    }),

  /**
   * Get subscription details
   */
  getSubscriptionDetails: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access subscription details");

        const subscription = await findOrThrow(
          () => db.getSubscriptionById(input.subscriptionId),
          "Subscription",
        );

        const plan = await db.getSubscriptionPlan(subscription.planId);
        const user = await db.getUserById(subscription.userId);

        return { subscription, plan, user };
      }, "Failed to fetch subscription details");
    }),

  /**
   * Update subscription status
   */
  updateSubscriptionStatus: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        status: z.enum(["active", "inactive", "suspended", "expired", "cancelled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { userSubscriptions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await dbInstance.update(userSubscriptions)
        .set({ status: input.status })
        .where(eq(userSubscriptions.id, input.subscriptionId));

      return { success: true };
    }),

  updateSubscriptionPlan: protectedProcedure
    .input(z.object({ subscriptionId: z.number(), planId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { userSubscriptions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await dbInstance.update(userSubscriptions)
        .set({ planId: input.planId })
        .where(eq(userSubscriptions.id, input.subscriptionId));

      return { success: true };
    }),

  extendSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.number(), days: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { userSubscriptions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const sub = await dbInstance.select().from(userSubscriptions).where(eq(userSubscriptions.id, input.subscriptionId)).limit(1);
      if (!sub || sub.length === 0) throw new TRPCError({ code: "NOT_FOUND" });

      const currentEndDate = new Date(sub[0].endDate || new Date());
      currentEndDate.setDate(currentEndDate.getDate() + input.days);

      await dbInstance.update(userSubscriptions)
        .set({ endDate: currentEndDate })
        .where(eq(userSubscriptions.id, input.subscriptionId));

      return { success: true, newEndDate: currentEndDate };
    }),

  resetSubscriptionQuota: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { usageStatistics } = await import("../../drizzle/schema");
      const { eq, and, gte } = await import("drizzle-orm");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await dbInstance.update(usageStatistics)
        .set({
          whatsappMessagesSent: 0,
          smsMessagesSent: 0
        })
        .where(
          and(
            eq(usageStatistics.userId, input.userId),
            gte(usageStatistics.date, today)
          )
        );

      return { success: true };
    }),

  /**
   * Get all invoices
   */
  getInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
        status: z.enum(["issued", "paid", "overdue", "cancelled"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access invoices");

        const invoices = await db.getAllInvoices();
        let filtered = invoices || [];

        if (input.status) {
          filtered = filtered.filter((i: any) => i.invoiceStatus === input.status);
        }

        return paginate(filtered, input);
      }, "Failed to fetch invoices");
    }),

  /**
   * Get invoice details
   */
  getInvoiceDetails: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access invoice details");

        const invoice = await findOrThrow(
          () => db.getInvoiceById(input.invoiceId),
          "Invoice",
        );

        const user = await db.getUserById(invoice.userId);
        const payments = await db.getUserPayments(invoice.userId, 100);
        const relatedPayments = payments?.filter((p: any) => p.invoiceId === input.invoiceId) || [];

        return { invoice, user, relatedPayments };
      }, "Failed to fetch invoice details");
    }),

  /**
   * Update invoice status
   */
  updateInvoiceStatus: protectedProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        status: z.enum(["issued", "paid", "overdue", "cancelled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "update invoice status");

        await db.updateInvoiceStatus(input.invoiceId, input.status);

        return { success: true };
      }, "Failed to update invoice status");
    }),

  /**
   * Get usage statistics
   */
  getUsageStatistics: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        requireAdmin(ctx, "access usage statistics");

        const stats = await db.getAllUsageStatistics();
        return paginate(stats || [], input);
      }, "Failed to fetch usage statistics");
    }),

  /**
   * Get system health and statistics
   */
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    return trpcHandler(async () => {
      requireAdmin(ctx, "access system health");

      const users = await db.getAllUsers();
      const subscriptions = await db.getAllActiveSubscriptions();
      const payments = await db.getAllPayments();
      const invoices = await db.getAllInvoices();

      return {
        totalUsers: users?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalPayments: payments?.length || 0,
        totalInvoices: invoices?.length || 0,
        completedPayments: payments?.filter((p: any) => p.paymentStatus === "completed").length || 0,
        failedPayments: payments?.filter((p: any) => p.paymentStatus === "failed").length || 0,
        paidInvoices: invoices?.filter((i: any) => i.invoiceStatus === "paid").length || 0,
        pendingInvoices: invoices?.filter((i: any) => i.invoiceStatus === "issued").length || 0,
      };
    }, "Failed to fetch system health");
  }),
});

/**
 * Helper function to generate mock chart data
 */
function generateChartData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, index) => ({
    month,
    revenue: Math.floor(Math.random() * 10000) + 5000,
    users: Math.floor(Math.random() * 100) + 50,
  }));
}
