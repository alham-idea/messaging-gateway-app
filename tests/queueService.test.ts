import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// The module exports a singleton. We re-import a fresh class for each test by
// constructing a new instance via the module internals.  Because QueueService
// is the default export's constructor, we import the module and create fresh
// instances in beforeEach.

// We cannot easily get a fresh class without module gymnastics, so instead we
// use the singleton and clear its internal state between tests.

import { queueService } from "../server/services/queueService";
import type { QueueJob } from "../server/services/queueService";

describe("QueueService", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Stop any running processing and clear internal state
    queueService.stopProcessing();
    // Clear all jobs via clearCompletedJobs won't work for pending, so we access internal map
    // Instead we use public APIs only by clearing completed + relying on fresh state
  });

  afterEach(() => {
    queueService.stopProcessing();
    vi.restoreAllMocks();
  });

  describe("addJob", () => {
    it("adds a job and returns a job ID", () => {
      const jobId = queueService.addJob("email", { to: "test@example.com" });
      expect(typeof jobId).toBe("string");
      expect(jobId).toContain("email-");
    });

    it("creates a job with pending status", () => {
      const jobId = queueService.addJob("notification", { userId: 1 });
      const job = queueService.getJobStatus(jobId);

      expect(job).not.toBeNull();
      expect(job!.status).toBe("pending");
      expect(job!.type).toBe("notification");
      expect(job!.attempts).toBe(0);
      expect(job!.maxAttempts).toBe(3);
    });

    it("respects custom priority and maxAttempts", () => {
      const jobId = queueService.addJob("backup", { type: "full" }, "high", 5);
      const job = queueService.getJobStatus(jobId);

      expect(job!.priority).toBe("high");
      expect(job!.maxAttempts).toBe(5);
    });
  });

  describe("getJobStatus", () => {
    it("returns null for unknown job ID", () => {
      const job = queueService.getJobStatus("nonexistent-id");
      expect(job).toBeNull();
    });

    it("returns the job for a valid ID", () => {
      const jobId = queueService.addJob("report", { type: "monthly" });
      const job = queueService.getJobStatus(jobId);

      expect(job).not.toBeNull();
      expect(job!.id).toBe(jobId);
    });
  });

  describe("getQueueStats", () => {
    it("counts jobs by status", () => {
      queueService.addJob("email", { to: "a@b.com" });
      queueService.addJob("notification", { userId: 1 });

      const stats = queueService.getQueueStats();

      expect(stats.totalJobs).toBeGreaterThanOrEqual(2);
      expect(stats.pendingJobs).toBeGreaterThanOrEqual(2);
      expect(typeof stats.averageProcessingTime).toBe("number");
    });
  });

  describe("getRecentJobs", () => {
    it("returns jobs sorted by creation time (newest first)", () => {
      queueService.addJob("email", { to: "first@b.com" });
      queueService.addJob("email", { to: "second@b.com" });

      const recent = queueService.getRecentJobs(10);
      expect(recent.length).toBeGreaterThanOrEqual(2);

      // Newest first
      for (let i = 1; i < recent.length; i++) {
        expect(recent[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          recent[i].createdAt.getTime(),
        );
      }
    });

    it("respects the limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        queueService.addJob("cleanup", { target: `item-${i}` });
      }
      const recent = queueService.getRecentJobs(2);
      expect(recent.length).toBeLessThanOrEqual(2);
    });
  });

  describe("retryFailedJob", () => {
    it("returns false for a non-existent job", () => {
      expect(queueService.retryFailedJob("no-such-job")).toBe(false);
    });

    it("returns false for a non-failed job", () => {
      const jobId = queueService.addJob("email", { to: "a@b.com" });
      expect(queueService.retryFailedJob(jobId)).toBe(false);
    });
  });

  describe("registerHandler", () => {
    it("allows registering a custom handler for a job type", () => {
      const handler = vi.fn().mockResolvedValue({ ok: true });
      queueService.registerHandler("custom-type", handler);
      // Handler registered without error
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("startProcessing / stopProcessing", () => {
    it("starts and stops without error", () => {
      queueService.startProcessing();
      // Calling again should be a no-op
      queueService.startProcessing();
      queueService.stopProcessing();
      // Calling stop again is also safe
      queueService.stopProcessing();
    });
  });

  describe("getFailedJobs", () => {
    it("returns an array (may be empty)", () => {
      const failed = queueService.getFailedJobs();
      expect(Array.isArray(failed)).toBe(true);
    });
  });

  describe("clearCompletedJobs", () => {
    it("runs without error even with no completed jobs", () => {
      expect(() => queueService.clearCompletedJobs()).not.toThrow();
    });
  });

  describe("exportQueueState", () => {
    it("returns valid JSON with jobs and stats", () => {
      queueService.addJob("email", { to: "export@test.com" });
      const exported = queueService.exportQueueState();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty("jobs");
      expect(parsed).toHaveProperty("stats");
      expect(parsed).toHaveProperty("exportedAt");
      expect(Array.isArray(parsed.jobs)).toBe(true);
    });
  });
});
