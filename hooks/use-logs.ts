import { useState, useEffect, useCallback } from 'react';
import { logService, LogMessage, LogFilter, LogStats } from '@/lib/services/log-service';

export function useLogs() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogMessage[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<LogFilter>({
    type: 'all',
    direction: 'all',
    status: 'all',
  });

  // تهيئة الخدمة
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true);
        await logService.initialize();
        
        // تحميل السجلات الأولية
        const allLogs = logService.getAllLogs();
        setLogs(allLogs);
        setFilteredLogs(allLogs);
        
        // تحديث الإحصائيات
        setStats(logService.getStats());
      } catch (error) {
        console.error('❌ خطأ في تهيئة خدمة السجل:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();

    // الاستماع لتغييرات السجلات
    const unsubscribe = logService.onLogsChange((updatedLogs) => {
      setLogs(updatedLogs);
      setStats(logService.getStats());
    });

    return () => unsubscribe();
  }, []);

  // تطبيق الفلاتر
  useEffect(() => {
    const filtered = logService.getFilteredLogs(filter);
    setFilteredLogs(filtered);
  }, [filter, logs]);

  // إضافة سجل جديد
  const addLog = useCallback(
    async (log: Omit<LogMessage, 'id'>) => {
      try {
        await logService.addLog(log);
      } catch (error) {
        console.error('❌ خطأ في إضافة السجل:', error);
      }
    },
    []
  );

  // تحديث الفلتر
  const updateFilter = useCallback((newFilter: Partial<LogFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // إعادة تعيين الفلتر
  const resetFilter = useCallback(() => {
    setFilter({
      type: 'all',
      direction: 'all',
      status: 'all',
    });
  }, []);

  // حذف سجل
  const deleteLog = useCallback(async (logId: string) => {
    try {
      await logService.deleteLog(logId);
    } catch (error) {
      console.error('❌ خطأ في حذف السجل:', error);
    }
  }, []);

  // حذف جميع السجلات
  const clearAllLogs = useCallback(async () => {
    try {
      await logService.clearAllLogs();
    } catch (error) {
      console.error('❌ خطأ في حذف السجلات:', error);
    }
  }, []);

  // البحث
  const search = useCallback((query: string) => {
    if (!query) {
      setFilteredLogs(logs);
      return;
    }

    const results = logService.searchLogs(query);
    setFilteredLogs(results);
  }, [logs]);

  // تصدير السجلات
  const exportLogs = useCallback((format: 'json' | 'csv' = 'json'): string => {
    if (format === 'csv') {
      return logService.exportLogsAsCSV();
    }
    return logService.exportLogs();
  }, []);

  return {
    logs,
    filteredLogs,
    stats,
    isLoading,
    filter,
    addLog,
    updateFilter,
    resetFilter,
    deleteLog,
    clearAllLogs,
    search,
    exportLogs,
  };
}
