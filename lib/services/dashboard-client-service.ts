import { apiGet, apiPost } from './api-client';

export interface DashboardStats {
  whatsappMessages: number;
  smsMessages: number;
  totalMessages: number;
  balance: number;
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'inactive' | 'expired';
  messagesRemaining: number;
  messagesLimit: number;
}

export interface Payment {
  id: number;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  invoiceId?: number;
}

class DashboardClientService {
  async getStats(): Promise<DashboardStats> {
    return apiGet<DashboardStats>('/api/dashboard/stats');
  }

  async getPayments(limit: number = 10): Promise<Payment[]> {
    return apiGet<Payment[]>(`/api/dashboard/payments?limit=${limit}`);
  }

  async addCredit(amount: number): Promise<{ success: boolean; newBalance: number }> {
    return apiPost<{ success: boolean; newBalance: number }>('/api/dashboard/add-credit', { amount });
  }

  async upgradeSubscription(planId: string): Promise<{ success: boolean; newPlan: string }> {
    return apiPost<{ success: boolean; newPlan: string }>('/api/dashboard/upgrade-plan', { planId });
  }
}

export const dashboardService = new DashboardClientService();
