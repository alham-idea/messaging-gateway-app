import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

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
      try {
        const existingEmail = await db.getUserByEmail(input.email);
        if (existingEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already exists",
          });
        }

        // Create new user
        const result = await db.createUser({
          name: input.name,
          email: input.email,
          loginMethod: input.loginMethod,
        });

        // Create user subscription
        await db.createUserSubscription({
          userId: result.id,
          planId: input.planId,
          billingCycle: "monthly",
          autoRenew: true,
        });

        // Generate JWT token
        const user = await db.getUserById(result.id);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user",
          });
        }

        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Registration failed",
        });
      }
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
      try {
        let user = await db.getUserByEmail(input.email);
        
        // Create user if doesn't exist
        if (!user) {
          const result = await db.createUser({
            name: input.name,
            email: input.email,
            loginMethod: input.loginMethod,
          });

          // Create default subscription
          await db.createUserSubscription({
            userId: result.id,
            planId: 1, // Default plan
            billingCycle: "monthly",
            autoRenew: true,
          });

          user = await db.getUserById(result.id);
        } else {
          // Update login method if provided
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

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          token,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed",
        });
      }
    }),

  /**
   * Get current user profile
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

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
      try {
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
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update profile",
        });
      }
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
      try {
        const currentSubscription = await db.getUserSubscription(ctx.user.id);
        if (!currentSubscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User has no active subscription",
          });
        }

        const newPlan = await db.getSubscriptionPlan(input.newPlanId);
        if (!newPlan) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Plan not found",
          });
        }

        const currentPlan = await db.getSubscriptionPlan(currentSubscription.planId);
        const changeType = currentPlan && newPlan.monthlyPrice > currentPlan.monthlyPrice ? "upgrade" : "downgrade";

        await db.upgradeSubscription(ctx.user.id, input.newPlanId, changeType);

        return {
          success: true,
          message: `Successfully ${changeType}d to ${newPlan.name}`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upgrade subscription",
        });
      }
    }),
});
