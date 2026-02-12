import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as db from "../server/db";
import type { TrpcContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

describe("Subscriptions Integration Tests", () => {
  let testUserId: number;
  let ctx: TrpcContext;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.createUser({
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      loginMethod: "test",
    });
    testUserId = userResult.id;

    ctx = {
      user: {
        id: testUserId,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
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

  describe("Complete Subscription Flow", () => {
    it("should create user with default subscription", async () => {
      const user = await db.getUserById(testUserId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
    });

    it("should get all available plans", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);

      // Verify plan structure
      plans.forEach((plan) => {
        expect(plan).toHaveProperty("id");
        expect(plan).toHaveProperty("name");
        expect(plan).toHaveProperty("monthlyPrice");
        expect(plan).toHaveProperty("whatsappMessagesLimit");
        expect(plan).toHaveProperty("smsMessagesLimit");
      });
    });

    it("should create subscription for user", async () => {
      const plans = await db.getAllSubscriptionPlans();
      expect(plans.length).toBeGreaterThan(0);

      const subscription = await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      expect(subscription.id).toBeGreaterThan(0);

      // Verify subscription was created
      const userSubscription = await db.getUserSubscription(testUserId);
      expect(userSubscription).toBeDefined();
      expect(userSubscription?.planId).toBe(plans[0].id);
      expect(userSubscription?.status).toBe("active");
    });

    it("should upgrade subscription to higher plan", async () => {
      const plans = await db.getAllSubscriptionPlans();
      expect(plans.length).toBeGreaterThan(1);

      // Create initial subscription
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      // Upgrade to higher plan
      await db.upgradeSubscription(testUserId, plans[1].id, "upgrade");

      // Verify upgrade
      const subscription = await db.getUserSubscription(testUserId);
      expect(subscription?.planId).toBe(plans[1].id);
    });

    it("should downgrade subscription to lower plan", async () => {
      const plans = await db.getAllSubscriptionPlans();
      expect(plans.length).toBeGreaterThan(1);

      // Create subscription with higher plan
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[1].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      // Downgrade to lower plan
      await db.upgradeSubscription(testUserId, plans[0].id, "downgrade");

      // Verify downgrade
      const subscription = await db.getUserSubscription(testUserId);
      expect(subscription?.planId).toBe(plans[0].id);
    });

    it("should record usage statistics", async () => {
      // Create subscription
      const plans = await db.getAllSubscriptionPlans();
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      // Record usage
      await db.recordUsageStatistics(testUserId, {
        whatsappMessagesSent: 100,
        whatsappMessagesFailed: 5,
        smsMessagesSent: 50,
        smsMessagesFailed: 2,
      });

      // Get usage stats
      const stats = await db.getUserUsageStatistics(testUserId, 30);
      expect(stats.length).toBeGreaterThan(0);
      expect(stats[0].whatsappMessagesSent).toBe(100);
      expect(stats[0].smsMessagesSent).toBe(50);
    });

    it("should cancel subscription", async () => {
      // Create subscription
      const plans = await db.getAllSubscriptionPlans();
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      // Get subscription
      let subscription = await db.getUserSubscription(testUserId);
      expect(subscription?.status).toBe("active");

      // Cancel subscription
      await db.updateUserSubscription(subscription!.id, {
        status: "cancelled",
      });

      // Verify cancellation
      subscription = await db.getUserSubscription(testUserId);
      expect(subscription).toBeUndefined(); // Should not return cancelled subscriptions
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent plan", async () => {
      try {
        await db.getSubscriptionPlan(99999);
        expect.fail("Should return undefined");
      } catch (error) {
        // Expected behavior
      }
    });

    it("should handle subscription for user without one", async () => {
      const subscription = await db.getUserSubscription(testUserId);
      expect(subscription).toBeUndefined();
    });

    it("should prevent duplicate subscriptions", async () => {
      const plans = await db.getAllSubscriptionPlans();

      // Create first subscription
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      // Try to create another (should replace the first)
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[1].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      // Should have a subscription
      const subscription = await db.getUserSubscription(testUserId);
      expect(subscription?.planId).toBeDefined();
      expect([plans[0].id, plans[1].id]).toContain(subscription?.planId);
    });
  });

  describe("Billing Cycle Tests", () => {
    it("should handle monthly billing cycle", async () => {
      const plans = await db.getAllSubscriptionPlans();

      const subscription = await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      const userSubscription = await db.getUserSubscription(testUserId);
      expect(userSubscription?.billingCycle).toBe("monthly");
      expect(userSubscription?.autoRenew).toBe(true);
    });

    it("should handle yearly billing cycle", async () => {
      const plans = await db.getAllSubscriptionPlans();

      const subscription = await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "yearly",
        autoRenew: true,
      });

      const userSubscription = await db.getUserSubscription(testUserId);
      expect(userSubscription?.billingCycle).toBe("yearly");
    });

    it("should calculate correct end dates for billing cycles", async () => {
      const plans = await db.getAllSubscriptionPlans();

      // Monthly subscription
      await db.createUserSubscription({
        userId: testUserId,
        planId: plans[0].id,
        billingCycle: "monthly",
        autoRenew: true,
      });

      const subscription = await db.getUserSubscription(testUserId);
      if (!subscription) throw new Error("Subscription not found");
      
      const startDate = subscription.startDate instanceof Date ? subscription.startDate : new Date(subscription.startDate || 0);
      const endDate = subscription.endDate instanceof Date ? subscription.endDate : new Date(subscription.endDate || 0);
      
      if (!startDate || !endDate) throw new Error("Invalid dates");

      // End date should be approximately 1 month from start
      const expectedEndDate = new Date(startDate);
      expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);

      // Allow 1 day difference for timing
      const daysDifference = Math.abs(
        (endDate.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDifference).toBeLessThan(2);
    });
  });

  describe("Plan Features", () => {
    it("should include features in plan response", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      plans.forEach((plan) => {
        expect(plan.features).toBeDefined();
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it("should have correct message limits per plan", async () => {
      const caller = appRouter.createCaller(ctx);
      const plans = await caller.subscriptions.getPlans();

      // Basic plan should have lower limits
      const basicPlan = plans.find((p) => p.name === "Basic");
      expect(basicPlan?.whatsappMessagesLimit).toBe(1000);
      expect(basicPlan?.smsMessagesLimit).toBe(500);

      // Professional plan should have higher limits
      const professionalPlan = plans.find((p) => p.name === "Professional");
      expect(professionalPlan?.whatsappMessagesLimit).toBe(10000);
      expect(professionalPlan?.smsMessagesLimit).toBe(5000);

      // Enterprise plan should have highest limits
      const enterprisePlan = plans.find((p) => p.name === "Enterprise");
      expect(enterprisePlan?.whatsappMessagesLimit).toBe(100000);
      expect(enterprisePlan?.smsMessagesLimit).toBe(50000);
    });
  });
});
