/**
 * Queue Service
 * Handles asynchronous job processing for emails, notifications, and other tasks
 */

export interface QueueJob {
  id: string;
  type: 'email' | 'notification' | 'report' | 'backup' | 'cleanup';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
}

class QueueService {
  private jobs: Map<string, QueueJob> = new Map();
  private processingJobs: Set<string> = new Set();
  private jobHandlers: Map<string, (job: QueueJob) => Promise<any>> = new Map();
  private processInterval: ReturnType<typeof setInterval> | null = null;
  private maxConcurrentJobs = 5;

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register default job handlers
   */
  private registerDefaultHandlers() {
    this.registerHandler('email', this.handleEmailJob.bind(this));
    this.registerHandler('notification', this.handleNotificationJob.bind(this));
    this.registerHandler('report', this.handleReportJob.bind(this));
    this.registerHandler('backup', this.handleBackupJob.bind(this));
    this.registerHandler('cleanup', this.handleCleanupJob.bind(this));
  }

  /**
   * Register job handler
   */
  registerHandler(jobType: string, handler: (job: QueueJob) => Promise<any>) {
    this.jobHandlers.set(jobType, handler);
  }

  /**
   * Add job to queue
   */
  addJob(
    type: QueueJob['type'],
    data: any,
    priority: QueueJob['priority'] = 'normal',
    maxAttempts: number = 3
  ): string {
    const jobId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: QueueJob = {
      id: jobId,
      type,
      data,
      status: 'pending',
      priority,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts,
    };

    this.jobs.set(jobId, job);
    console.log(`Job added to queue: ${jobId} (${type})`);

    return jobId;
  }

  /**
   * Start processing queue
   */
  startProcessing() {
    if (this.processInterval) return;

    this.processInterval = setInterval(() => {
      this.processJobs().catch(error => {
        console.error('Error processing queue:', error);
      });
    }, 5000); // Process every 5 seconds

    console.log('Queue processing started');
  }

  /**
   * Stop processing queue
   */
  stopProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
    console.log('Queue processing stopped');
  }

  /**
   * Process jobs from queue
   */
  private async processJobs() {
    const pendingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (high > normal > low) then by creation time
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return (
          (priorityOrder[b.priority] - priorityOrder[a.priority]) ||
          (a.createdAt.getTime() - b.createdAt.getTime())
        );
      });

    const availableSlots = this.maxConcurrentJobs - this.processingJobs.size;

    for (let i = 0; i < Math.min(availableSlots, pendingJobs.length); i++) {
      const job = pendingJobs[i];
      this.processJob(job).catch(error => {
        console.error(`Error processing job ${job.id}:`, error);
      });
    }
  }

  /**
   * Process single job
   */
  private async processJob(job: QueueJob) {
    if (this.processingJobs.has(job.id)) return;

    this.processingJobs.add(job.id);
    job.status = 'processing';
    job.startedAt = new Date();
    job.attempts++;

    try {
      const handler = this.jobHandlers.get(job.type);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      const result = await handler(job);

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      console.log(`Job completed: ${job.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        job.error = errorMessage;
        console.log(`Job failed, will retry: ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
      } else {
        job.status = 'failed';
        job.error = errorMessage;
        console.error(`Job failed permanently: ${job.id} - ${errorMessage}`);
      }
    } finally {
      this.processingJobs.delete(job.id);
    }
  }

  /**
   * Handle email job
   */
  private async handleEmailJob(job: QueueJob): Promise<any> {
    // TODO: Implement email sending
    console.log(`Sending email: ${job.data.to}`);
    return { sent: true };
  }

  /**
   * Handle notification job
   */
  private async handleNotificationJob(job: QueueJob): Promise<any> {
    // TODO: Implement notification sending
    console.log(`Sending notification: ${job.data.userId}`);
    return { sent: true };
  }

  /**
   * Handle report job
   */
  private async handleReportJob(job: QueueJob): Promise<any> {
    // TODO: Implement report generation
    console.log(`Generating report: ${job.data.type}`);
    return { generated: true };
  }

  /**
   * Handle backup job
   */
  private async handleBackupJob(job: QueueJob): Promise<any> {
    // TODO: Implement backup creation
    console.log(`Creating backup: ${job.data.type}`);
    return { backed_up: true };
  }

  /**
   * Handle cleanup job
   */
  private async handleCleanupJob(job: QueueJob): Promise<any> {
    // TODO: Implement cleanup operations
    console.log(`Cleaning up: ${job.data.target}`);
    return { cleaned: true };
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): QueueJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get queue stats
   */
  getQueueStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      processingJobs: this.processingJobs.size,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      averageProcessingTime: this.calculateAverageProcessingTime(),
    };
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(): number {
    const completedJobs = Array.from(this.jobs.values()).filter(
      j => j.status === 'completed' && j.startedAt && j.completedAt
    );

    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, j) => {
      return sum + ((j.completedAt!.getTime() - j.startedAt!.getTime()) / 1000);
    }, 0);

    return totalTime / completedJobs.length;
  }

  /**
   * Get recent jobs
   */
  getRecentJobs(limit: number = 50): QueueJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get failed jobs
   */
  getFailedJobs(): QueueJob[] {
    return Array.from(this.jobs.values()).filter(j => j.status === 'failed');
  }

  /**
   * Retry failed job
   */
  retryFailedJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);

    if (!job || job.status !== 'failed') {
      return false;
    }

    job.status = 'pending';
    job.attempts = 0;
    job.error = undefined;

    console.log(`Job retry scheduled: ${jobId}`);
    return true;
  }

  /**
   * Clear completed jobs
   */
  clearCompletedJobs() {
    let clearedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' && job.completedAt) {
        const age = (Date.now() - job.completedAt.getTime()) / (1000 * 60 * 60); // hours

        if (age > 24) { // Keep completed jobs for 24 hours
          this.jobs.delete(jobId);
          clearedCount++;
        }
      }
    }

    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} old completed jobs`);
    }
  }

  /**
   * Export queue state
   */
  exportQueueState(): string {
    return JSON.stringify({
      jobs: Array.from(this.jobs.values()),
      stats: this.getQueueStats(),
      exportedAt: new Date(),
    }, null, 2);
  }
}

// Export singleton instance
export const queueService = new QueueService();
