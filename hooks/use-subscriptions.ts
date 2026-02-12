import { useState, useCallback, useEffect } from "react";
import { subscriptionClientService } from "@/lib/services/subscription-client-service";

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

interface SubscriptionState {
  plans: Plan[];
  currentSubscription: UserSubscription | null;
  usageStats: {
    subscription: UserSubscription;
    plan: Plan;
    usage: UsageStats;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  plans: [],
  currentSubscription: null,
  usageStats: null,
  loading: false,
  error: null,
};

export function useSubscriptions() {
  const [state, setState] = useState<SubscriptionState>(initialState);

  /**
   * Fetch all available plans
   */
  const fetchPlans = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const plans = await subscriptionClientService.getPlans();
      setState((prev) => ({ ...prev, plans, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch plans";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  /**
   * Fetch current subscription
   */
  const fetchCurrentSubscription = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const subscription = await subscriptionClientService.getCurrentSubscription();
      setState((prev) => ({ ...prev, currentSubscription: subscription, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch subscription";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  /**
   * Fetch usage statistics
   */
  const fetchUsageStats = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const stats = await subscriptionClientService.getUsageStats();
      setState((prev) => ({ ...prev, usageStats: stats, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch usage stats";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  /**
   * Change subscription
   */
  const changeSubscription = useCallback(
    async (newPlanId: number, billingCycle?: "monthly" | "yearly") => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const result = await subscriptionClientService.changeSubscription(newPlanId, billingCycle);
        
        // Refresh current subscription and usage stats
        await fetchCurrentSubscription();
        await fetchUsageStats();
        
        setState((prev) => ({ ...prev, loading: false }));
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to change subscription";
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [fetchCurrentSubscription, fetchUsageStats]
  );

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const result = await subscriptionClientService.cancel();
      
      // Refresh current subscription
      await fetchCurrentSubscription();
      
      setState((prev) => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel subscription";
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [fetchCurrentSubscription]);

  /**
   * Check if user can send message
   */
  const canSendMessage = useCallback(async (type: "whatsapp" | "sms") => {
    try {
      return await subscriptionClientService.canSendMessage(type);
    } catch (error) {
      console.error("Failed to check message limit:", error);
      return false;
    }
  }, []);

  /**
   * Get remaining messages
   */
  const getRemainingMessages = useCallback(async () => {
    try {
      return await subscriptionClientService.getRemainingMessages();
    } catch (error) {
      console.error("Failed to get remaining messages:", error);
      return null;
    }
  }, []);

  /**
   * Initialize subscriptions data
   */
  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
    fetchUsageStats();
  }, [fetchPlans, fetchCurrentSubscription, fetchUsageStats]);

  return {
    // State
    plans: state.plans,
    currentSubscription: state.currentSubscription,
    usageStats: state.usageStats,
    loading: state.loading,
    error: state.error,

    // Methods
    fetchPlans,
    fetchCurrentSubscription,
    fetchUsageStats,
    changeSubscription,
    cancelSubscription,
    canSendMessage,
    getRemainingMessages,
  };
}
