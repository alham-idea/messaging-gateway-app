import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogMessage {
  id: string;
  type: 'whatsapp' | 'sms' | 'system' | 'error';
  direction: 'sent' | 'received' | 'internal';
  phoneNumber?: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  metadata?: {
    messageId?: string;
    error?: string;
    retries?: number;
    duration?: number;
  };
}

export interface LogFilter {
  type?: 'whatsapp' | 'sms' | 'system' | 'error' | 'all';
  direction?: 'sent' | 'received' | 'internal' | 'all';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'all';
  phoneNumber?: string;
  startDate?: number;
  endDate?: number;
  searchText?: string;
}

export interface LogStats {
  totalMessages: number;
  sentCount: number;
  receivedCount: number;
  failedCount: number;
  successRate: number;
  averageResponseTime: number;
  messagesByType: {
    whatsapp: number;
    sms: number;
    system: number;
    error: number;
  };
  messagesByStatus: {
    pending: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

class LogService {
  private logs: LogMessage[] = [];
  private maxLogs = 1000;
  private storageKey = 'messaging_gateway_logs';
  private listeners: ((logs: LogMessage[]) => void)[] = [];

  /**
   * تهيئة خدمة السجل
   */
  public async initialize(): Promise<void> {
    try {
      console.log('📝 بدء تهيئة خدمة السجل');

      // تحميل السجلات المحفوظة
      await this.loadLogs();

      console.log(`✓ تم تحميل ${this.logs.length} سجل`);
    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة السجل:', error);
    }
  }

  /**
   * إضافة سجل جديد
   */
  public async addLog(log: Omit<LogMessage, 'id'>): Promise<LogMessage> {
    const newLog: LogMessage = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.logs.unshift(newLog);

    // الحفاظ على حد أقصى من السجلات
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // حفظ السجلات
    await this.saveLogs();

    // إخطار المستمعين
    this.notifyListeners();

    console.log(`✓ تم إضافة سجل جديد: ${newLog.id}`);

    return newLog;
  }

  /**
   * الحصول على السجلات مع الفلاتر
   */
  public getFilteredLogs(filter: LogFilter): LogMessage[] {
    let filtered = [...this.logs];

    // فلتر النوع
    if (filter.type && filter.type !== 'all') {
      filtered = filtered.filter((log) => log.type === filter.type);
    }

    // فلتر الاتجاه
    if (filter.direction && filter.direction !== 'all') {
      filtered = filtered.filter((log) => log.direction === filter.direction);
    }

    // فلتر الحالة
    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter((log) => log.status === filter.status);
    }

    // فلتر رقم الهاتف
    if (filter.phoneNumber) {
      filtered = filtered.filter((log) =>
        log.phoneNumber?.includes(filter.phoneNumber!)
      );
    }

    // فلتر التاريخ
    if (filter.startDate) {
      filtered = filtered.filter((log) => log.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filter.endDate!);
    }

    // البحث في النص
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter((log) =>
        log.message.toLowerCase().includes(searchLower) ||
        log.phoneNumber?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  /**
   * الحصول على إحصائيات السجلات
   */
  public getStats(): LogStats {
    const stats: LogStats = {
      totalMessages: this.logs.length,
      sentCount: 0,
      receivedCount: 0,
      failedCount: 0,
      successRate: 0,
      averageResponseTime: 0,
      messagesByType: {
        whatsapp: 0,
        sms: 0,
        system: 0,
        error: 0,
      },
      messagesByStatus: {
        pending: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
      },
    };

    let totalResponseTime = 0;
    let responseCount = 0;

    this.logs.forEach((log) => {
      // إحصائيات الاتجاه
      if (log.direction === 'sent') stats.sentCount++;
      if (log.direction === 'received') stats.receivedCount++;

      // إحصائيات الحالة
      if (log.status === 'failed') stats.failedCount++;
      stats.messagesByStatus[log.status]++;

      // إحصائيات النوع
      stats.messagesByType[log.type]++;

      // حساب متوسط وقت الاستجابة
      if (log.metadata?.duration) {
        totalResponseTime += log.metadata.duration;
        responseCount++;
      }
    });

    // حساب معدل النجاح
    if (stats.totalMessages > 0) {
      stats.successRate = ((stats.totalMessages - stats.failedCount) / stats.totalMessages) * 100;
    }

    // حساب متوسط وقت الاستجابة
    if (responseCount > 0) {
      stats.averageResponseTime = totalResponseTime / responseCount;
    }

    return stats;
  }

  /**
   * الحصول على السجلات حسب النوع
   */
  public getLogsByType(type: LogMessage['type']): LogMessage[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * الحصول على السجلات حسب الحالة
   */
  public getLogsByStatus(status: LogMessage['status']): LogMessage[] {
    return this.logs.filter((log) => log.status === status);
  }

  /**
   * الحصول على السجلات حسب رقم الهاتف
   */
  public getLogsByPhoneNumber(phoneNumber: string): LogMessage[] {
    return this.logs.filter((log) => log.phoneNumber === phoneNumber);
  }

  /**
   * الحصول على السجلات في نطاق زمني
   */
  public getLogsByDateRange(startDate: number, endDate: number): LogMessage[] {
    return this.logs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * البحث في السجلات
   */
  public searchLogs(query: string): LogMessage[] {
    const queryLower = query.toLowerCase();
    return this.logs.filter(
      (log) =>
        log.message.toLowerCase().includes(queryLower) ||
        log.phoneNumber?.toLowerCase().includes(queryLower) ||
        log.id.toLowerCase().includes(queryLower)
    );
  }

  /**
   * حذف سجل
   */
  public async deleteLog(logId: string): Promise<void> {
    this.logs = this.logs.filter((log) => log.id !== logId);
    await this.saveLogs();
    this.notifyListeners();
    console.log(`✓ تم حذف السجل: ${logId}`);
  }

  /**
   * حذف جميع السجلات
   */
  public async clearAllLogs(): Promise<void> {
    this.logs = [];
    await this.saveLogs();
    this.notifyListeners();
    console.log('✓ تم حذف جميع السجلات');
  }

  /**
   * تصدير السجلات كـ JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * تصدير السجلات كـ CSV
   */
  public exportLogsAsCSV(): string {
    const headers = ['ID', 'Type', 'Direction', 'Phone', 'Message', 'Status', 'Timestamp'];
    const rows = this.logs.map((log) => [
      log.id,
      log.type,
      log.direction,
      log.phoneNumber || 'N/A',
      `"${log.message.replace(/"/g, '""')}"`,
      log.status,
      new Date(log.timestamp).toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }

  /**
   * الاستماع لتغييرات السجلات
   */
  public onLogsChange(callback: (logs: LogMessage[]) => void): () => void {
    this.listeners.push(callback);

    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * إخطار المستمعين
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  /**
   * حفظ السجلات في التخزين المحلي
   */
  private async saveLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('❌ خطأ في حفظ السجلات:', error);
    }
  }

  /**
   * تحميل السجلات من التخزين المحلي
   */
  private async loadLogs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.storageKey);
      if (data) {
        this.logs = JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل السجلات:', error);
    }
  }

  /**
   * الحصول على جميع السجلات
   */
  public getAllLogs(): LogMessage[] {
    return [...this.logs];
  }

  /**
   * الحصول على عدد السجلات
   */
  public getLogCount(): number {
    return this.logs.length;
  }
}

// تصدير instance واحد من الخدمة
export const logService = new LogService();
