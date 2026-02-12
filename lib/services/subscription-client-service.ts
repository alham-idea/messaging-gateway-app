import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

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
      console.error("Failed to fetch plans:", error);
      throw error;
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
      console.error("Failed to fetch plan:", error);
      throw error;
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
      console.error("Failed to fetch current subscription:", error);
      return null;
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
      const response = await this.apiClient.get("/api/subscriptions.getUsageStats");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch usage stats:", error);
      return null;
    }
  }

  /**
   * Check if user can send message based on plan limits
   */
  async canSendMessage(type: "whatsapp" | "sms"): Promise<boolean> {
    try {
      const stats = await this.getUsageStats();
      if (!stats) return false;

      if (type === "whatsapp") {
        return stats.usage.whatsappRemaining > 0;
      } else {
        return stats.usage.smsRemaining > 0;
      }
    } catch (error) {
      console.error("Failed to check message limit:", error);
      return false;
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
