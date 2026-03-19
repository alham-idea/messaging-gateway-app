import apiClient from './api';

/**
 * Admin API Service
 * Provides methods to interact with admin endpoints
 */

export const adminApi = {
  /**
   * Dashboard Statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getDashboardStats');
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Users Management
   */
  getUsers: async (limit = 10, offset = 0, search?: string, status?: string) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getUsers', {
        json: { limit, offset, search, status },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  getUserDetails: async (userId: number) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getUserDetails', {
        json: { userId },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId: number, isActive: boolean) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.updateUserStatus', {
        json: { userId, isActive },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  /**
   * Subscriptions Management
   */
  getSubscriptions: async (limit = 10, offset = 0, status?: string) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getSubscriptions', {
        json: { limit, offset, status },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },

  getSubscriptionDetails: async (subscriptionId: number) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getSubscriptionDetails', {
        json: { subscriptionId },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      throw error;
    }
  },

  updateSubscriptionStatus: async (subscriptionId: number, status: string) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.updateSubscriptionStatus', {
        json: { subscriptionId, status },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  },

  updateSubscriptionPlan: async (subscriptionId: number, planId: number) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.updateSubscriptionPlan', {
        json: { subscriptionId, planId },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      throw error;
    }
  },

  extendSubscription: async (subscriptionId: number, days: number) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.extendSubscription', {
        json: { subscriptionId, days },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error extending subscription:', error);
      throw error;
    }
  },

  resetSubscriptionQuota: async (userId: number) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.resetSubscriptionQuota', {
        json: { userId },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error resetting quota:', error);
      throw error;
    }
  },

  /**
   * Invoices Management
   */
  getInvoices: async (limit = 10, offset = 0, status?: string) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getInvoices', {
        json: { limit, offset, status },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  getInvoiceDetails: async (invoiceId: number) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getInvoiceDetails', {
        json: { invoiceId },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  },

  updateInvoiceStatus: async (invoiceId: number, status: string) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.updateInvoiceStatus', {
        json: { invoiceId, status },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  },

  /**
   * Usage Statistics
   */
  getUsageStatistics: async (limit = 10, offset = 0) => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getUsageStatistics', {
        json: { limit, offset },
      });
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      throw error;
    }
  },

  /**
   * System Health
   */
  getSystemHealth: async () => {
    try {
      const response = await apiClient.post('/api/trpc/admin.getSystemHealth');
      return response.data.result.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  },
};
