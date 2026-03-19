import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { databaseService } from "./database-service";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface Plan {
  id: number;
  name: string;
  description?: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  whatsappMessagesLimit: number;
  smsMessagesLimit: number;
  supportLevel: string;
  features: string[];
}

interface UserSubscription {
  id: number;
  planId: number;
  status: string;
  billingCycle: "monthly" | "yearly";
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  autoRenew: boolean;
  plan?: Plan;
}

interface UsageStats {
  whatsappUsed: number;
  whatsappLimit: number;
  whatsappRemaining: number;
  smsUsed: number;
  smsLimit: number;
  smsRemaining: number;
  
  // New Inbound Stats
  whatsappReceived: number;
  whatsappReceiveLimit: number;
  whatsappReceiveRemaining: number;
  smsReceived: number;
  smsReceiveLimit: number;
  smsReceiveRemaining: number;
}

type BillingCycle = "monthly" | "yearly";

type LocalPlan = {
  id: number;
  name: string;
  monthlyPrice: number; // عدد عشري بدون رمز
  yearlyPrice?: number;
  sendLimitTotal: number | "unlimited";
  recvLimitTotal: number | "unlimited";
  description?: string;
  features?: string[];
};

function round(n: number): number {
  return Math.round(n);
}

function computeYearly(priceMonthly: number): number {
  // خصم 17% للشراء السنوي
  return round(priceMonthly * 12 * 0.83);
}

function buildLocalPlans(): LocalPlan[] {
  // الباقة التجريبية: مجانية 14 يوم
  const trial: LocalPlan = {
    id: 0,
    name: "الباقة التجريبية",
    monthlyPrice: 0,
    sendLimitTotal: 1500,
    recvLimitTotal: 2500,
    description: "تجربة لمدة 14 يوماً",
    features: ["1500 إرسال (WA/SMS)", "2500 استقبال (WA/SMS)", "دعم أساسي"],
  };
  // الباقة الأولى: 10$
  const plan1Send = 3000;
  const plan1Recv = 5000;
  const basic: LocalPlan = {
    id: 1,
    name: "الباقة الأولى",
    monthlyPrice: 10,
    yearlyPrice: computeYearly(10),
    sendLimitTotal: plan1Send,
    recvLimitTotal: plan1Recv,
    description: "خطة شهرية أساسية",
    features: ["3000 إرسال (WA/SMS)", "5000 استقبال (WA/SMS)"],
  };
  // الباقة الثانية: ضعف الأولى + 10%
  const plan2Send = round(plan1Send * 2 * 1.1); // 6600
  const plan2Recv = round(plan1Recv * 2 * 1.1); // 11000
  const standard: LocalPlan = {
    id: 2,
    name: "الباقة الثانية",
    monthlyPrice: 20, // افتراض معقول
    yearlyPrice: computeYearly(20),
    sendLimitTotal: plan2Send,
    recvLimitTotal: plan2Recv,
    description: "ضعف الحدود مع زيادة 10%",
    features: [`${plan2Send} إرسال (WA/SMS)`, `${plan2Recv} استقبال (WA/SMS)`],
  };
  // الباقة الثالثة: ضعف الثانية + 10%
  const plan3Send = round(plan2Send * 2 * 1.1); // 14520
  const plan3Recv = round(plan2Recv * 2 * 1.1); // 24200
  const premium: LocalPlan = {
    id: 3,
    name: "الباقة الثالثة",
    monthlyPrice: 35, // افتراض معقول
    yearlyPrice: computeYearly(35),
    sendLimitTotal: plan3Send,
    recvLimitTotal: plan3Recv,
    description: "حدود أعلى للاستخدام الكثيف",
    features: [`${plan3Send} إرسال (WA/SMS)`, `${plan3Recv} استقبال (WA/SMS)`],
  };
  // الباقة الذهبية: غير محدود 50$
  const gold: LocalPlan = {
    id: 4,
    name: "الباقة الذهبية",
    monthlyPrice: 50,
    yearlyPrice: computeYearly(50),
    sendLimitTotal: "unlimited",
    recvLimitTotal: "unlimited",
    description: "إرسال واستقبال غير محدود",
    features: ["غير محدود (WA/SMS)"],
  };
  return [trial, basic, standard, premium, gold];
}

class SubscriptionClientService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  constructor() {
    // Add token to requests
    this.apiClient.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<Plan[]> {
    try {
      const response = await this.apiClient.get("/api/subscriptions.getPlans");
      return response.data;
    } catch (error) {
      // Fallback to local catalog
      console.warn("Failed to fetch plans from API. Falling back to local catalog.");
      const locals = buildLocalPlans();
      return locals.map<Plan>((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        monthlyPrice: p.monthlyPrice.toString(),
        yearlyPrice: p.yearlyPrice?.toString(),
        // نعرض حدود القناة كحد إجمالي (تقريبياً) لأغراض العرض
        whatsappMessagesLimit: p.sendLimitTotal === "unlimited" ? Number.MAX_SAFE_INTEGER : (p.sendLimitTotal as number),
        smsMessagesLimit: p.sendLimitTotal === "unlimited" ? Number.MAX_SAFE_INTEGER : (p.sendLimitTotal as number),
        supportLevel: p.id >= 3 ? "Priority" : "Standard",
        features: p.features || [],
      }));
    }
  }

  /**
   * Get a specific subscription plan
   */
  async getPlan(id: number): Promise<Plan> {
    try {
      const response = await this.apiClient.get("/api/subscriptions.getPlan", {
        params: { id },
      });
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch plan from API. Using local catalog.");
      const p = buildLocalPlans().find((x) => x.id === id);
      if (!p) {
        throw error;
      }
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        monthlyPrice: p.monthlyPrice.toString(),
        yearlyPrice: p.yearlyPrice?.toString(),
        whatsappMessagesLimit: p.sendLimitTotal === "unlimited" ? Number.MAX_SAFE_INTEGER : (p.sendLimitTotal as number),
        smsMessagesLimit: p.sendLimitTotal === "unlimited" ? Number.MAX_SAFE_INTEGER : (p.sendLimitTotal as number),
        supportLevel: p.id >= 3 ? "Priority" : "Standard",
        features: p.features || [],
      };
    }
  }

  /**
   * Get current user's subscription
   */
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    try {
      const response = await this.apiClient.get("/api/subscriptions.getCurrentSubscription");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch current subscription. Falling back to local trial.");
      // Fallback: trial subscription (once) stored locally
      const key = "local_trial_started_at";
      let startedAtStr = await AsyncStorage.getItem(key);
      if (!startedAtStr) {
        startedAtStr = Date.now().toString();
        await AsyncStorage.setItem(key, startedAtStr);
      }
      const startedAt = parseInt(startedAtStr, 10);
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      const endAt = startedAt + fourteenDaysMs;
      const sub: UserSubscription = {
        id: 0,
        planId: 0, // trial
        status: Date.now() < endAt ? "active" : "expired",
        billingCycle: "monthly",
        startDate: new Date(startedAt).toISOString(),
        endDate: new Date(endAt).toISOString(),
        nextBillingDate: new Date(endAt).toISOString(),
        autoRenew: false,
      };
      return sub;
    }
  }

  /**
   * Change subscription (upgrade or downgrade)
   */
  async changeSubscription(
    newPlanId: number,
    billingCycle?: "monthly" | "yearly"
  ): Promise<{ success: boolean; message: string; changeType?: string }> {
    try {
      const response = await this.apiClient.post("/api/subscriptions.changeSubscription", {
        newPlanId,
        billingCycle,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to change subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscription history
   */
  async getHistory(): Promise<any[]> {
    try {
      const response = await this.apiClient.get("/api/subscriptions.getHistory");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch subscription history:", error);
      return [];
    }
  }

  /**
   * Cancel subscription
   */
  async cancel(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.apiClient.post("/api/subscriptions.cancel");
      return response.data;
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      throw error;
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<{
    subscription: UserSubscription;
    plan: Plan;
    usage: UsageStats;
  } | null> {
    try {
      // محاولة من الـ API أولاً
      const response = await this.apiClient.get("/api/subscriptions.getUsageStats");
      return response.data;
    } catch (error) {
      // حساب محلي: يعتمد على SQLite للفترة النشطة
      console.warn("Failed to fetch usage stats from API. Computing locally.");
      const sub = await this.getCurrentSubscription();
      if (!sub) return null;

      const plans = await this.getPlans();
      const plan = plans.find((p) => p.id === sub.planId) || plans[0];

      const start = new Date(sub.startDate).getTime();
      const end = new Date(sub.endDate).getTime();

      const counts = await databaseService.getSentCounts(start, end);
      const receivedCounts = await databaseService.getReceivedCounts(start, end);

      const localCatalog = buildLocalPlans();
      const localPlan = localCatalog.find(p => p.id === sub.planId) || localCatalog[0];

      const isSendUnlimited = String(localPlan.sendLimitTotal).toLowerCase() === 'unlimited';
      const sendLimit = isSendUnlimited ? Number.MAX_SAFE_INTEGER : Number(localPlan.sendLimitTotal);
      
      const isRecvUnlimited = String(localPlan.recvLimitTotal).toLowerCase() === 'unlimited';
      const recvLimit = isRecvUnlimited ? Number.MAX_SAFE_INTEGER : Number(localPlan.recvLimitTotal);

      const totalSent = counts.total;
      const totalRecv = receivedCounts.total;

      const usage: UsageStats = {
        whatsappUsed: counts.whatsapp,
        whatsappLimit: sendLimit,
        whatsappRemaining: Math.max(0, sendLimit - totalSent),
        smsUsed: counts.sms,
        smsLimit: sendLimit,
        smsRemaining: Math.max(0, sendLimit - totalSent),
        
        whatsappReceived: receivedCounts.whatsapp,
        whatsappReceiveLimit: recvLimit,
        whatsappReceiveRemaining: Math.max(0, recvLimit - totalRecv),
        smsReceived: receivedCounts.sms,
        smsReceiveLimit: recvLimit,
        smsReceiveRemaining: Math.max(0, recvLimit - totalRecv),
      };

      return { subscription: sub, plan, usage };
    }
  }

  /**
   * Check if user can send message based on plan limits
   */
  async canSendMessage(type: "whatsapp" | "sms"): Promise<boolean> {
    try {
      // احصل على الاشتراك الحالي
      const sub = await this.getCurrentSubscription();
      const localCatalog = buildLocalPlans();
      const plans = await this.getPlans().catch(() => [] as Plan[]);
      const activePlan =
        (plans && sub && plans.find((p) => p.id === sub.planId)) ||
        undefined;

      // خريطة إرسال إجمالي لكل باقة (مُركّب محلياً)
      const local = localCatalog.find((p) =>
        sub ? p.id === sub.planId : p.id === 0
      ) || localCatalog[0];

      // غير محدود
      if (local.sendLimitTotal === "unlimited") return true;

      // فترة الحساب
      const periodStart = sub ? new Date(sub.startDate).getTime() : Date.now();
      const periodEnd = sub ? new Date(sub.endDate).getTime() : Date.now() + 14 * 24 * 60 * 60 * 1000;

      // استخدام محلي من SQLite
      const counts = await databaseService.getSentCounts(periodStart, periodEnd);
      const totalSent = counts.total;
      
      const isUnlimited = String(local.sendLimitTotal).toLowerCase() === 'unlimited';
      const totalLimit = isUnlimited ? Number.MAX_SAFE_INTEGER : Number(local.sendLimitTotal);

      // التحقق مقابل الحد الإجمالي (WA + SMS)
      return totalSent < totalLimit;
    } catch (error) {
      console.error("Failed to check message limit:", error);
      return false;
    }
  }

  /**
   * Check if user can receive message based on plan limits
   */
  async canReceiveMessage(): Promise<boolean> {
    try {
      const sub = await this.getCurrentSubscription();
      const localCatalog = buildLocalPlans();
      
      const local = localCatalog.find((p) =>
        sub ? p.id === sub.planId : p.id === 0
      ) || localCatalog[0];

      const periodStart = sub ? new Date(sub.startDate).getTime() : Date.now();
      const periodEnd = sub ? new Date(sub.endDate).getTime() : Date.now() + 14 * 24 * 60 * 60 * 1000;

      const counts = await databaseService.getReceivedCounts(periodStart, periodEnd);
      const totalReceived = counts.total;
      
      const isUnlimited = String(local.recvLimitTotal).toLowerCase() === 'unlimited';
      const totalLimit = isUnlimited ? Number.MAX_SAFE_INTEGER : Number(local.recvLimitTotal);

      return totalReceived < totalLimit;
    } catch (error) {
      console.error("Failed to check receive limit:", error);
      return false; // Fail safe
    }
  }
  /**
   * Get remaining messages for current plan
   */
  async getRemainingMessages(): Promise<{
    whatsapp: number;
    sms: number;
  } | null> {
    try {
      const stats = await this.getUsageStats();
      if (!stats) return null;

      return {
        whatsapp: stats.usage.whatsappRemaining,
        sms: stats.usage.smsRemaining,
      };
    } catch (error) {
      console.error("Failed to get remaining messages:", error);
      return null;
    }
  }
}

// Export singleton instance
export const subscriptionClientService = new SubscriptionClientService();
