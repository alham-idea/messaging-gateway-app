import { router, publicProcedure, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  createEmailQueueItem,
  getEmailQueue,
  updateEmailQueueStatus,
} from "@/server/db";

export const notificationsRouter = router({
  /**
   * Get all notifications for the current user
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().default(false),
        type: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getNotifications(ctx.user.id, {
        limit: input.limit,
        offset: input.offset,
        unreadOnly: input.unreadOnly,
        type: input.type,
      });
    }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await getUnreadNotificationCount(ctx.user.id);
  }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await markNotificationAsRead(input.notificationId, ctx.user.id);
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return await markAllNotificationsAsRead(ctx.user.id);
  }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return await deleteNotification(input.notificationId, ctx.user.id);
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return await getNotificationPreferences(ctx.user.id);
  }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        subscriptionAlerts: z.boolean().optional(),
        paymentAlerts: z.boolean().optional(),
        usageAlerts: z.boolean().optional(),
        promotionalEmails: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        monthlyReport: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await updateNotificationPreferences(ctx.user.id, input);
    }),

  /**
   * Send test notification
   */
  sendTestNotification: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "subscription_expiring",
          "payment_failed",
          "usage_limit_warning",
          "system_alert",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const testMessages: Record<string, { title: string; message: string }> = {
        subscription_expiring: {
          title: "اشتراكك سينتهي قريباً",
          message: "سينتهي اشتراكك في 7 أيام. يرجى تجديد الاشتراك لتجنب انقطاع الخدمة.",
        },
        payment_failed: {
          title: "فشل الدفع",
          message: "فشل دفع الفاتورة الأخيرة. يرجى تحديث طريقة الدفع.",
        },
        usage_limit_warning: {
          title: "تحذير حد الاستخدام",
          message: "لقد استخدمت 80% من حد الرسائل المسموح به هذا الشهر.",
        },
        system_alert: {
          title: "تنبيه النظام",
          message: "هذا تنبيه اختبار من النظام.",
        },
      };

      const message = testMessages[input.type];
      return await createNotification(ctx.user.id, {
        type: input.type as any,
        title: message.title,
        message: message.message,
        priority: "normal",
      });
    }),

  /**
   * Admin: Create notification for user
   */
  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.string(),
        title: z.string(),
        message: z.string(),
        priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
        actionUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return await createNotification(input.userId, {
        type: input.type as any,
        title: input.title,
        message: input.message,
        priority: input.priority,
        actionUrl: input.actionUrl,
      });
    }),

  /**
   * Get email queue status
   */
  getEmailQueueStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await getEmailQueue({
      limit: 100,
      status: "pending",
    });
  }),

  /**
   * Retry failed email
   */
  retryFailedEmail: protectedProcedure
    .input(z.object({ emailId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      return await updateEmailQueueStatus(input.emailId, "pending");
    }),
});
