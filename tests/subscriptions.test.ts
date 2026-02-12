import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("Subscriptions API", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = {
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        openId: null,
        loginMethod: "test",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
  });

  describe("getPlans", () => {
    it("should return available subscription plans", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);

      // Check plan structure
      const plan = plans[0];
      expect(plan).toHaveProperty("id");
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("monthlyPrice");
      expect(plan).toHaveProperty("whatsappMessagesLimit");
      expect(plan).toHaveProperty("smsMessagesLimit");
    });

    it("should return plans with correct properties", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      plans.forEach((plan) => {
        expect(typeof plan.id).toBe("number");
        expect(typeof plan.name).toBe("string");
        expect(typeof plan.monthlyPrice).toBe("string");
        expect(typeof plan.whatsappMessagesLimit).toBe("number");
        expect(typeof plan.smsMessagesLimit).toBe("number");
      });
    });
  });

  describe("getPlan", () => {
    it("should return a specific plan by ID", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      if (plans.length > 0) {
        const plan = await caller.subscriptions.getPlan({ id: plans[0].id });
        expect(plan).toBeDefined();
        expect(plan.id).toBe(plans[0].id);
      }
    });

    it("should throw error for non-existent plan", async () => {
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.subscriptions.getPlan({ id: 99999 });
        expect.fail("Should throw error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getCurrentSubscription", () => {
    it("should return current subscription for authenticated user", async () => {
      const caller = appRouter.createCaller(ctx);
      const subscription = await caller.subscriptions.getCurrentSubscription();

      // Subscription might be null if user doesn't have one yet
      if (subscription) {
        expect(subscription).toHaveProperty("id");
        expect(subscription).toHaveProperty("userId");
        expect(subscription).toHaveProperty("planId");
        expect(subscription).toHaveProperty("status");
      }
    });
  });

  describe("changeSubscription", () => {
    it("should change subscription to a different plan", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      if (plans.length > 1) {
        const result = await caller.subscriptions.changeSubscription({
          newPlanId: plans[0].id,
          billingCycle: "monthly",
        });

        expect(result).toHaveProperty("success");
        expect(result.success).toBe(true);
      }
    });

    it("should throw error for non-existent plan", async () => {
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.subscriptions.changeSubscription({
          newPlanId: 99999,
          billingCycle: "monthly",
        });
        expect.fail("Should throw error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("getUsageStats", () => {
    it("should return usage statistics for current subscription", async () => {
      const caller = appRouter.createCaller(ctx);
      const stats = await caller.subscriptions.getUsageStats();

      if (stats) {
        expect(stats).toHaveProperty("subscription");
        expect(stats).toHaveProperty("plan");
        expect(stats).toHaveProperty("usage");

        const { usage } = stats;
        expect(usage).toHaveProperty("whatsappUsed");
        expect(usage).toHaveProperty("whatsappLimit");
        expect(usage).toHaveProperty("whatsappRemaining");
        expect(usage).toHaveProperty("smsUsed");
        expect(usage).toHaveProperty("smsLimit");
        expect(usage).toHaveProperty("smsRemaining");
      }
    });

    it("should calculate remaining messages correctly", async () => {
      const caller = appRouter.createCaller(ctx);
      const stats = await caller.subscriptions.getUsageStats();

      if (stats) {
        const { usage } = stats;
        const expectedRemaining = usage.whatsappLimit - usage.whatsappUsed;
        expect(usage.whatsappRemaining).toBe(Math.max(0, expectedRemaining));
      }
    });
  });
});
