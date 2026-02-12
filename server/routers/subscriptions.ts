import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = router({
  /**
   * Get all available subscription plans
   */
  getPlans: publicProcedure.query(async () => {
    try {
      const plans = await db.getAllSubscriptionPlans();
      return plans.map(plan => ({
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription plans",
      });
    }
  }),

  /**
   * Get a specific subscription plan
   */
  getPlan: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const plan = await db.getSubscriptionPlan(input.id);
        if (!plan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan not found",
          });
        }
        return {
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : [],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch plan",
        });
      }
    }),

  /**
   * Get current user's subscription
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription) {
        return null;
      }

      const plan = await db.getSubscriptionPlan(subscription.planId);
      return {
        ...subscription,
        plan: plan ? {
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : [],
        } : null,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription",
      });
    }
  }),

  /**
   * Upgrade or downgrade subscription
   */
  changeSubscription: protectedProcedure
    .input(
      z.object({
        newPlanId: z.number(),
        billingCycle: z.enum(["monthly", "yearly"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const newPlan = await db.getSubscriptionPlan(input.newPlanId);
        if (!newPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan not found",
          });
        }

        const currentSubscription = await db.getUserSubscription(ctx.user.id);
        if (!currentSubscription) {
          // Create new subscription if user doesn't have one
          await db.createUserSubscription({
            userId: ctx.user.id,
            planId: input.newPlanId,
            billingCycle: input.billingCycle || "monthly",
            autoRenew: true,
          });

          return {
            success: true,
            message: `Successfully subscribed to ${newPlan.name}`,
          };
        }

        const currentPlan = await db.getSubscriptionPlan(currentSubscription.planId);
        const changeType = currentPlan && newPlan.monthlyPrice > currentPlan.monthlyPrice ? "upgrade" : "downgrade";

        await db.upgradeSubscription(ctx.user.id, input.newPlanId, changeType);

        return {
          success: true,
          message: `Successfully ${changeType}d to ${newPlan.name}`,
          changeType,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change subscription",
        });
      }
    }),

  /**
   * Get subscription history
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      // TODO: Implement subscription history retrieval
      return [];
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription history",
      });
    }
  }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found",
        });
      }

      await db.updateUserSubscription(subscription.id, {
        status: "cancelled",
      });

      return {
        success: true,
        message: "Subscription cancelled successfully",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Get usage statistics for current plan
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription) {
        return null;
      }

      const plan = await db.getSubscriptionPlan(subscription.planId);
      const stats = await db.getUserUsageStatistics(ctx.user.id, 30);

      const totalWhatsapp = stats.reduce((sum, s) => sum + (s.whatsappMessagesSent || 0), 0);
      const totalSms = stats.reduce((sum, s) => sum + (s.smsMessagesSent || 0), 0);

      return {
        subscription,
        plan,
        usage: {
          whatsappUsed: totalWhatsapp,
          whatsappLimit: plan?.whatsappMessagesLimit || 0,
          whatsappRemaining: Math.max(0, (plan?.whatsappMessagesLimit || 0) - totalWhatsapp),
          smsUsed: totalSms,
          smsLimit: plan?.smsMessagesLimit || 0,
          smsRemaining: Math.max(0, (plan?.smsMessagesLimit || 0) - totalSms),
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch usage statistics",
      });
    }
  }),
});
