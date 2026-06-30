import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { trpcHandler, findOrThrow } from "../_core/router-utils";

export const subscriptionsRouter = router({
  /**
   * Get all available subscription plans
   */
  getPlans: publicProcedure.query(async () => {
    return trpcHandler(async () => {
      const plans = await db.getAllSubscriptionPlans();
      return plans.map(plan => ({
        ...plan,
        features: plan.features ? JSON.parse(plan.features) : [],
      }));
    }, "Failed to fetch subscription plans");
  }),

  /**
   * Get a specific subscription plan
   */
  getPlan: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return trpcHandler(async () => {
        const plan = await findOrThrow(
          () => db.getSubscriptionPlan(input.id),
          "Plan",
        );
        return {
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : [],
        };
      }, "Failed to fetch plan");
    }),

  /**
   * Get current user's subscription
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    return trpcHandler(async () => {
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
    }, "Failed to fetch subscription");
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
      return trpcHandler(async () => {
        const newPlan = await findOrThrow(
          () => db.getSubscriptionPlan(input.newPlanId),
          "Plan",
        );

        const currentSubscription = await db.getUserSubscription(ctx.user.id);
        if (!currentSubscription) {
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
      }, "Failed to change subscription");
    }),

  /**
   * Get subscription history
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return trpcHandler(async () => {
      // TODO: Implement subscription history retrieval
      return [];
    }, "Failed to fetch subscription history");
  }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    return trpcHandler(async () => {
      const subscription = await findOrThrow(
        () => db.getUserSubscription(ctx.user.id),
        "No active subscription",
      );

      await db.updateUserSubscription(subscription.id, {
        status: "cancelled",
      });

      return {
        success: true,
        message: "Subscription cancelled successfully",
      };
    }, "Failed to cancel subscription");
  }),

  /**
   * Get usage statistics for current plan
   */
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    return trpcHandler(async () => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription) {
        return null;
      }

      const plan = await db.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return null;
      }

      const stats = await db.getUserUsageStatistics(ctx.user.id, 30);

      const totalWhatsapp = stats.reduce((sum, s) => sum + (s.whatsappMessagesSent || 0), 0);
      const totalSms = stats.reduce((sum, s) => sum + (s.smsMessagesSent || 0), 0);

      return {
        subscription,
        plan: {
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : [],
        },
        usage: {
          whatsappUsed: totalWhatsapp,
          whatsappLimit: plan.whatsappMessagesLimit || 0,
          whatsappRemaining: Math.max(0, (plan.whatsappMessagesLimit || 0) - totalWhatsapp),
          smsUsed: totalSms,
          smsLimit: plan.smsMessagesLimit || 0,
          smsRemaining: Math.max(0, (plan.smsMessagesLimit || 0) - totalSms),
        },
      };
    }, "Failed to fetch usage statistics");
  }),
});
