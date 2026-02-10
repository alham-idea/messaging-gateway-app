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
        businessName: z.string().min(1),
        businessAddress: z.string().optional(),
        businessPhone: z.string().optional(),
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
        subscriptionPlanId: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await db.getUserByUsername(input.username);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username already exists",
          });
        }

        const existingEmail = await db.getUserByEmail(input.email);
        if (existingEmail) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already exists",
          });
        }

        // Create new user
        const result = await db.createUser({
          businessName: input.businessName,
          businessAddress: input.businessAddress,
          businessPhone: input.businessPhone,
          username: input.username,
          email: input.email,
          password: input.password,
          subscriptionPlanId: input.subscriptionPlanId,
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
          { userId: user.id, username: user.username, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          success: true,
          user: {
            id: user.id,
            businessName: user.businessName,
            username: user.username,
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
   * Login user
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await db.getUserByUsername(input.username);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        const isPasswordValid = await db.verifyPassword(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid username or password",
          });
        }

        // Update last signed in
        await db.updateUser(user.id, {
          lastSignedIn: new Date(),
        });

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username, email: user.email },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return {
          success: true,
          user: {
            id: user.id,
            businessName: user.businessName,
            username: user.username,
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

    const plan = await db.getSubscriptionPlan(user.subscriptionPlanId);

    return {
      id: user.id,
      businessName: user.businessName,
      businessAddress: user.businessAddress,
      businessPhone: user.businessPhone,
      username: user.username,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      accountBalance: user.accountBalance,
      messagesUsedWhatsapp: user.messagesUsedWhatsapp,
      messagesUsedSms: user.messagesUsedSms,
      subscriptionPlan: plan,
      createdAt: user.createdAt,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        businessName: z.string().optional(),
        businessAddress: z.string().optional(),
        businessPhone: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await db.updateUser(ctx.user.id, {
          businessName: input.businessName,
          businessAddress: input.businessAddress,
          businessPhone: input.businessPhone,
          email: input.email,
        });

        const user = await db.getUserById(ctx.user.id);
        return {
          success: true,
          user: {
            id: user!.id,
            businessName: user!.businessName,
            username: user!.username,
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
   * Change password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const isPasswordValid = await db.verifyPassword(input.currentPassword, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Current password is incorrect",
          });
        }

        // Hash new password and update
        const bcrypt = await import("bcrypt");
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

        await db.updateUser(ctx.user.id, {
          passwordHash: newPasswordHash,
        });

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password",
        });
      }
    }),
});
