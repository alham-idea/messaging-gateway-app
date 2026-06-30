import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { trpcHandler, findOrThrow } from "../_core/router-utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

function generateToken(user: { id: number; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function createDefaultSubscription(userId: number, planId = 1) {
  await db.createUserSubscription({
    userId,
    planId,
    billingCycle: "monthly",
    autoRenew: true,
  });
}

export const authRouter = router({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        loginMethod: z.string().optional(),
        planId: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      return trpcHandler(async () => {
        const existingEmail = await db.getUserByEmail(input.email);
        if (existingEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already exists",
          });
        }

        const result = await db.createUser({
          name: input.name,
          email: input.email,
          loginMethod: input.loginMethod,
        });

        await createDefaultSubscription(result.id, input.planId);

        const user = await findOrThrow(
          () => db.getUserById(result.id),
          "User",
          "INTERNAL_SERVER_ERROR",
        );

        const token = generateToken(user);

        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email },
          token,
        };
      }, "Registration failed");
    }),

  /**
   * Login user (OAuth based)
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        openId: z.string().optional(),
        loginMethod: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return trpcHandler(async () => {
        let user = await db.getUserByEmail(input.email);

        if (!user) {
          const result = await db.createUser({
            name: input.name,
            email: input.email,
            loginMethod: input.loginMethod,
          });

          await createDefaultSubscription(result.id);
          user = await db.getUserById(result.id);
        } else {
          if (input.loginMethod) {
            await db.updateUser(user.id, {
              loginMethod: input.loginMethod,
              lastSignedIn: new Date(),
            });
          }
        }

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process login",
          });
        }

        const token = generateToken(user);

        return {
          success: true,
          user: { id: user.id, name: user.name, email: user.email },
          token,
        };
      }, "Login failed");
    }),

  /**
   * Get current user profile
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await findOrThrow(
      () => db.getUserById(ctx.user.id),
      "User",
    );

    const subscription = await db.getUserSubscription(user.id);
    const plan = subscription ? await db.getSubscriptionPlan(subscription.planId) : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      subscription: subscription ? {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextBillingDate: subscription.nextBillingDate,
        autoRenew: subscription.autoRenew,
      } : null,
      plan,
      createdAt: user.createdAt,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        await db.updateUser(ctx.user.id, {
          name: input.name,
          email: input.email,
        });

        const user = await db.getUserById(ctx.user.id);
        return {
          success: true,
          user: {
            id: user!.id,
            name: user!.name,
            email: user!.email,
          },
        };
      }, "Failed to update profile");
    }),

  /**
   * Logout user
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    // TODO: Implement logout with cookie clearing
    return {
      success: true,
    };
  }),

  /**
   * Get all subscription plans
   */
  getPlans: publicProcedure.query(async () => {
    const plans = await db.getAllSubscriptionPlans();
    return plans;
  }),

  /**
   * Upgrade subscription
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        newPlanId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return trpcHandler(async () => {
        const currentSubscription = await findOrThrow(
          () => db.getUserSubscription(ctx.user.id),
          "User has no active subscription",
        );

        const newPlan = await findOrThrow(
          () => db.getSubscriptionPlan(input.newPlanId),
          "Plan",
        );

        const currentPlan = await db.getSubscriptionPlan(currentSubscription.planId);
        const changeType = currentPlan && newPlan.monthlyPrice > currentPlan.monthlyPrice ? "upgrade" : "downgrade";

        await db.upgradeSubscription(ctx.user.id, input.newPlanId, changeType);

        return {
          success: true,
          message: `Successfully ${changeType}d to ${newPlan.name}`,
        };
      }, "Failed to upgrade subscription");
    }),
});
