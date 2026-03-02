/**
 * Monitoring and Alerting Service
 * Tracks system health, performance metrics, and sends alerts
 */

export interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  requestsPerSecond: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: any;
}

class MonitoringService {
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private metricsInterval: ReturnType<typeof setInterval> | null = null;
  private maxMetricsHistory = 1000;

  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.metricsInterval) return;

    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Collect metrics every minute

    console.log('Monitoring service started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('Monitoring service stopped');
  }

  /**
   * Collect system metrics
   */
  private collectMetrics() {
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // Convert to MB
      uptime: process.uptime(),
      requestsPerSecond: 0, // TODO: Calculate from request logs
      errorRate: 0, // TODO: Calculate from error logs
      averageResponseTime: 0, // TODO: Calculate from response times
    };

    this.metrics.push(metrics);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check for alerts
    this.checkAlerts(metrics);
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(metrics: SystemMetrics) {
    // Check CPU usage
    if (metrics.cpuUsage > 80) {
      this.createAlert('critical', 'High CPU Usage', `CPU usage is ${metrics.cpuUsage.toFixed(2)}%`, {
        cpuUsage: metrics.cpuUsage,
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > 512) { // 512 MB
      this.createAlert('warning', 'High Memory Usage', `Memory usage is ${metrics.memoryUsage.toFixed(2)} MB`, {
        memoryUsage: metrics.memoryUsage,
      });
    }

    // Check error rate
    if (metrics.errorRate > 5) { // 5%
      this.createAlert('critical', 'High Error Rate', `Error rate is ${metrics.errorRate.toFixed(2)}%`, {
        errorRate: metrics.errorRate,
      });
    }

    // Check response time
    if (metrics.averageResponseTime > 5000) { // 5 seconds
      this.createAlert('warning', 'Slow Response Time', `Average response time is ${metrics.averageResponseTime.toFixed(0)}ms`, {
        averageResponseTime: metrics.averageResponseTime,
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: 'critical' | 'warning' | 'info',
    title: string,
    message: string,
    metadata?: any
  ) {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);

    // Log alert
    console.log(`[ALERT] ${type.toUpperCase()}: ${title} - ${message}`);

    // TODO: Send notification to admins
    // TODO: Store alert in database
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 60): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get metrics for time range
   */
  getMetricsForTimeRange(startTime: Date, endTime: Date): SystemMetrics[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get average metrics
   */
  getAverageMetrics(limit: number = 60): Partial<SystemMetrics> {
    const recentMetrics = this.getRecentMetrics(limit);
    if (recentMetrics.length === 0) return {};

    const avg = {
      cpuUsage: recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length,
      memoryUsage: recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length,
      requestsPerSecond: recentMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0) / recentMetrics.length,
      errorRate: recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length,
      averageResponseTime: recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length,
    };

    return avg;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`Alert resolved: ${alertId}`);
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    metrics: Partial<SystemMetrics>;
    alerts: number;
  } {
    const current = this.getCurrentMetrics();
    const activeAlerts = this.getActiveAlerts();

    if (!current) {
      return {
        status: 'healthy',
        message: 'No metrics collected yet',
        metrics: {},
        alerts: 0,
      };
    }

    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    let message = 'System is healthy';

    if (activeAlerts.some(a => a.type === 'critical')) {
      status = 'critical';
      message = 'System has critical alerts';
    } else if (activeAlerts.length > 0) {
      status = 'degraded';
      message = `System has ${activeAlerts.length} warning(s)`;
    }

    return {
      status,
      message,
      metrics: {
        cpuUsage: current.cpuUsage,
        memoryUsage: current.memoryUsage,
        errorRate: current.errorRate,
        averageResponseTime: current.averageResponseTime,
      },
      alerts: activeAlerts.length,
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThan: Date) {
    const before = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan);
    console.log(`Cleared ${before - this.metrics.length} old metrics`);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      exportedAt: new Date(),
    }, null, 2);
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();
