import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { monitoringService } from "../server/services/monitoringService";

describe("MonitoringService", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    monitoringService.stopMonitoring();
  });

  afterEach(() => {
    monitoringService.stopMonitoring();
    vi.restoreAllMocks();
  });

  describe("startMonitoring / stopMonitoring", () => {
    it("starts and stops without error", () => {
      monitoringService.startMonitoring();
      // calling again is a no-op
      monitoringService.startMonitoring();
      monitoringService.stopMonitoring();
      monitoringService.stopMonitoring();
    });
  });

  describe("getRecentMetrics", () => {
    it("returns an array", () => {
      const metrics = monitoringService.getRecentMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it("respects limit parameter", () => {
      const metrics = monitoringService.getRecentMetrics(5);
      expect(metrics.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getCurrentMetrics", () => {
    it("returns null when no metrics collected", () => {
      // Clear old metrics to ensure empty state
      monitoringService.clearOldMetrics(new Date(Date.now() + 100000));
      const current = monitoringService.getCurrentMetrics();
      expect(current).toBeNull();
    });
  });

  describe("getAverageMetrics", () => {
    it("returns empty object when no metrics exist", () => {
      monitoringService.clearOldMetrics(new Date(Date.now() + 100000));
      const avg = monitoringService.getAverageMetrics();
      expect(Object.keys(avg).length).toBe(0);
    });
  });

  describe("getMetricsForTimeRange", () => {
    it("returns metrics within the range", () => {
      const start = new Date(Date.now() - 3600000);
      const end = new Date();
      const metrics = monitoringService.getMetricsForTimeRange(start, end);
      expect(Array.isArray(metrics)).toBe(true);
    });

    it("returns empty array for future time range", () => {
      const start = new Date(Date.now() + 100000);
      const end = new Date(Date.now() + 200000);
      const metrics = monitoringService.getMetricsForTimeRange(start, end);
      expect(metrics).toHaveLength(0);
    });
  });

  describe("alerts", () => {
    it("getActiveAlerts returns an array", () => {
      const alerts = monitoringService.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("getAllAlerts respects limit", () => {
      const alerts = monitoringService.getAllAlerts(5);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });

    it("resolveAlert does not throw for unknown id", () => {
      expect(() => monitoringService.resolveAlert("nonexistent")).not.toThrow();
    });
  });

  describe("getHealthStatus", () => {
    it("returns a health status object", () => {
      const status = monitoringService.getHealthStatus();
      expect(status).toHaveProperty("status");
      expect(status).toHaveProperty("message");
      expect(status).toHaveProperty("metrics");
      expect(status).toHaveProperty("alerts");
      expect(["healthy", "degraded", "critical"]).toContain(status.status);
    });

    it("reports healthy when no metrics collected", () => {
      monitoringService.clearOldMetrics(new Date(Date.now() + 100000));
      const status = monitoringService.getHealthStatus();
      expect(status.status).toBe("healthy");
      expect(status.message).toContain("No metrics");
    });
  });

  describe("clearOldMetrics", () => {
    it("runs without error", () => {
      expect(() => monitoringService.clearOldMetrics(new Date())).not.toThrow();
    });
  });

  describe("exportMetrics", () => {
    it("returns valid JSON with metrics and alerts", () => {
      const exported = monitoringService.exportMetrics();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty("metrics");
      expect(parsed).toHaveProperty("alerts");
      expect(parsed).toHaveProperty("exportedAt");
      expect(Array.isArray(parsed.metrics)).toBe(true);
      expect(Array.isArray(parsed.alerts)).toBe(true);
    });
  });
});
