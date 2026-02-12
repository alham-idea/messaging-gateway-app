import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Admin Router - API endpoints for admin dashboard
 * All endpoints require admin authentication
 */

export const adminRouter = router({
  /**
   * Get dashboard statistics
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Check if user is admin
      if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins can access dashboard",
        });
      }

      // Get total users
      const users = await db.getAllUsers();
      const totalUsers = users?.length || 0;

      // Get active subscriptions
      const subscriptions = await db.getAllActiveSubscriptions();
      const activeSubscriptions = subscriptions?.length || 0;

      // Get monthly revenue
      const payments = await db.getAllPayments();
      const monthlyRevenue = payments?.reduce((sum: number, p: any) => {
        if (p.paymentStatus === "completed") {
          return sum + parseFloat(p.amount || 0);
        }
        return sum;
      }, 0) || 0;

      // Get failed payments
      const failedPayments = payments?.filter((p: any) => p.paymentStatus === "failed").length || 0;

      // Get chart data (mock for now)
      const chartData = generateChartData();

      return {
        totalUsers,
        activeSubscriptions,
        monthlyRevenue,
        failedPayments,
        chartData,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard statistics",
      });
    }
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
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access user list",
          });
        }

        const users = await db.getAllUsers();
        let filtered = users || [];

        // Apply search filter
        if (input.search) {
          filtered = filtered.filter(
            (u: any) =>
              u.name?.toLowerCase().includes(input.search!.toLowerCase()) ||
              u.email?.toLowerCase().includes(input.search!.toLowerCase())
          );
        }

        // Apply pagination
        const total = filtered.length;
        const items = filtered.slice(input.offset, input.offset + input.limit);

        return {
          items,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch users",
        });
      }
    }),

  /**
   * Get user details
   */
  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access user details",
          });
        }

        const user = await db.getUserById(input.userId);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get user subscription
        const subscription = await db.getUserSubscription(input.userId);

        // Get user payments
        const payments = await db.getUserPayments(input.userId, 100);

        // Get user invoices
        const invoices = await db.getUserInvoices(input.userId);

        return {
          user,
          subscription,
          payments,
          invoices,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user details",
        });
      }
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
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can update user status",
          });
        }

        await db.updateUser(input.userId, {
          role: input.isActive ? "user" : "user",
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user status",
        });
      }
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
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access subscriptions",
          });
        }

        const subscriptions = await db.getAllActiveSubscriptions();
        let filtered = subscriptions || [];

        // Apply status filter
        if (input.status) {
          filtered = filtered.filter((s: any) => s.status === input.status);
        }

        // Apply pagination
        const total = filtered.length;
        const items = filtered.slice(input.offset, input.offset + input.limit);

        return {
          items,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscriptions",
        });
      }
    }),

  /**
   * Get subscription details
   */
  getSubscriptionDetails: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access subscription details",
          });
        }

        const subscription = await db.getSubscriptionById(input.subscriptionId);
        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription not found",
          });
        }

        // Get plan details
        const plan = await db.getSubscriptionPlan(subscription.planId);

        // Get user details
        const user = await db.getUserById(subscription.userId);

        return {
          subscription,
          plan,
          user,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscription details",
        });
      }
    }),

  /**
   * Update subscription status
   */
  updateSubscriptionStatus: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        status: z.enum(["active", "cancelled", "expired", "suspended"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can update subscription status",
          });
        }

        await db.updateUserSubscription(input.subscriptionId, {
          status: input.status,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update subscription status",
        });
      }
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
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access invoices",
          });
        }

        const invoices = await db.getAllInvoices();
        let filtered = invoices || [];

        // Apply status filter
        if (input.status) {
          filtered = filtered.filter((i: any) => i.invoiceStatus === input.status);
        }

        // Apply pagination
        const total = filtered.length;
        const items = filtered.slice(input.offset, input.offset + input.limit);

        return {
          items,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch invoices",
        });
      }
    }),

  /**
   * Get invoice details
   */
  getInvoiceDetails: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access invoice details",
          });
        }

        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found",
          });
        }

        // Get user details
        const user = await db.getUserById(invoice.userId);

        // Get related payments
        const payments = await db.getUserPayments(invoice.userId, 100);
        const relatedPayments = payments?.filter((p: any) => p.invoiceId === input.invoiceId) || [];

        return {
          invoice,
          user,
          relatedPayments,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch invoice details",
        });
      }
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
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can update invoice status",
          });
        }

        await db.updateInvoiceStatus(input.invoiceId, input.status);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update invoice status",
        });
      }
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
      try {
        if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Only admins can access usage statistics",
          });
        }

        const stats = await db.getAllUsageStatistics();
        const total = stats?.length || 0;
        const items = stats?.slice(input.offset, input.offset + input.limit) || [];

        return {
          items,
          total,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch usage statistics",
        });
      }
    }),

  /**
   * Get system health and statistics
   */
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user?.role !== "admin" && (ctx.user?.role as any) !== "super_admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only admins can access system health",
        });
      }

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
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch system health",
      });
    }
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
