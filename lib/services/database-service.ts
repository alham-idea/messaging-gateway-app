import * as SQLite from 'expo-sqlite';
import { MessagePayload } from './socket-service';

const DB_NAME = 'messaging_gateway.db';

export interface DBMessage extends MessagePayload {
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
}

class DatabaseService {
  private db: any | null = null;

  /**
   * Initialize database
   */
  public async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      console.log('✓ تم تهيئة قاعدة البيانات بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
      throw error;
    }
  }

  /**
   * Create tables if not exists
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        error TEXT,
        retryCount INTEGER DEFAULT 0,
        timestamp INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
  }

  /**
   * Add message to queue
   */
  public async addMessage(payload: MessagePayload): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const now = Date.now();
    await this.db.runAsync(
      `INSERT OR REPLACE INTO messages (id, type, phoneNumber, message, status, timestamp, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
      [
        payload.id,
        payload.type,
        payload.phoneNumber,
        payload.message,
        payload.timestamp,
        now,
        now
      ]
    );
  }

  /**
   * Get pending messages
   */
  public async getPendingMessages(limit: number = 10): Promise<DBMessage[]> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const result = await this.db.getAllAsync(
      `SELECT * FROM messages WHERE status = 'pending' ORDER BY createdAt ASC LIMIT ?`,
      [limit]
    );
    
    return result;
  }

  /**
   * Update message status
   */
  public async updateMessageStatus(
    id: string, 
    status: DBMessage['status'], 
    error?: string
  ): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const now = Date.now();
    await this.db.runAsync(
      `UPDATE messages 
       SET status = ?, error = ?, updatedAt = ?, retryCount = retryCount + 1 
       WHERE id = ?`,
      [status, error || null, now, id]
    );
  }

  /**
   * Remove message
   */
  public async removeMessage(id: string): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    await this.db.runAsync('DELETE FROM messages WHERE id = ?', [id]);
  }

  /**
   * Clear all messages
   */
  public async clearAll(): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    await this.db.runAsync('DELETE FROM messages');
  }

  /**
   * Get stats
   */
  public async getStats(): Promise<{ pending: number; failed: number; sent: number }> {
    if (!this.db) return { pending: 0, failed: 0, sent: 0 };

    const result = await this.db.getFirstAsync(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent
      FROM messages
    `) as any;

    return result || { pending: 0, failed: 0, sent: 0 };
  }

  /**
   * Clear history
   */
  public async clearHistory(): Promise<void> {
    await this.clearAll();
  }
}

export const databaseService = new DatabaseService();
