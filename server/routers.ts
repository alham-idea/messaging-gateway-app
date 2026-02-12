import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { subscriptionsRouter } from "./routers/subscriptions";
import * as db from "./db";


// Initialize default subscription plans if they don't exist
async function initializeDefaultPlans() {
  try {
    const existingPlans = await db.getAllSubscriptionPlans();
    if (existingPlans.length === 0) {
      // Create default plans
      const plans = [
        {
          name: "Basic",
          description: "Perfect for getting started",
          monthlyPrice: "99",
          yearlyPrice: "990",
          whatsappMessagesLimit: 1000,
          smsMessagesLimit: 500,
          supportLevel: "basic" as const,
          features: JSON.stringify(["1,000 WhatsApp messages/month", "500 SMS messages/month", "Email support", "Basic analytics"]),
        },
        {
          name: "Professional",
          description: "For growing businesses",
          monthlyPrice: "299",
          yearlyPrice: "2990",
          whatsappMessagesLimit: 10000,
          smsMessagesLimit: 5000,
          supportLevel: "standard" as const,
          features: JSON.stringify(["10,000 WhatsApp messages/month", "5,000 SMS messages/month", "Priority email support", "Advanced analytics", "API access"]),
        },
        {
          name: "Enterprise",
          description: "For large-scale operations",
          monthlyPrice: "999",
          yearlyPrice: "9990",
          whatsappMessagesLimit: 100000,
          smsMessagesLimit: 50000,
          supportLevel: "premium" as const,
          features: JSON.stringify(["100,000 WhatsApp messages/month", "50,000 SMS messages/month", "24/7 phone support", "Custom analytics", "Dedicated account manager", "Custom integrations"]),
        },
      ];

      for (const plan of plans) {
        await db.createSubscriptionPlan(plan);
      }
    }
  } catch (error) {
    console.warn("Failed to initialize default plans:", error);
  }
}

// Initialize plans on startup
initializeDefaultPlans();

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  subscriptions: subscriptionsRouter,
});

export type AppRouter = typeof appRouter;

