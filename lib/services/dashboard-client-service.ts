import { authService } from './auth-client-service';

const API_BASE_URL = 'http://localhost:3000/api';

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
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: authService.getAuthHeader(),
      });

      if (!response.ok) {
        throw new Error('فشل في الحصول على الإحصائيات');
      }

      return await response.json();
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  }

  async getPayments(limit: number = 10): Promise<Payment[]> {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(
        `${API_BASE_URL}/dashboard/payments?limit=${limit}`,
        {
          headers: authService.getAuthHeader(),
        }
      );

      if (!response.ok) {
        throw new Error('فشل في الحصول على المدفوعات');
      }

      return await response.json();
    } catch (error) {
      console.error('Get payments error:', error);
      throw error;
    }
  }

  async addCredit(amount: number): Promise<{ success: boolean; newBalance: number }> {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/add-credit`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('فشل في إضافة الرصيد');
      }

      return await response.json();
    } catch (error) {
      console.error('Add credit error:', error);
      throw error;
    }
  }

  async upgradeSubscription(planId: string): Promise<{ success: boolean; newPlan: string }> {
    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('غير مصرح');
      }

      const response = await fetch(`${API_BASE_URL}/dashboard/upgrade-plan`, {
        method: 'POST',
        headers: authService.getAuthHeader(),
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('فشل في ترقية الباقة');
      }

      return await response.json();
    } catch (error) {
      console.error('Upgrade subscription error:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardClientService();
