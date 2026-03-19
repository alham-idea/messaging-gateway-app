import * as SQLite from 'expo-sqlite';
import { MessagePayload } from './socket-service';

const DB_NAME = 'messaging_gateway.db';

export interface DBMessage extends MessagePayload {
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'received';
  direction: 'outbound' | 'inbound';
  error?: string;
  createdAt: number;
  updatedAt: number;
  retryCount: number;
}

export interface MessageCounts {
  whatsapp: number;
  sms: number;
  total: number;
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
      await this.migrateTables();
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
        direction TEXT NOT NULL DEFAULT 'outbound',
        error TEXT,
        retryCount INTEGER DEFAULT 0,
        timestamp INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
  }

  /**
   * Migrate tables to add new columns
   */
  private async migrateTables(): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    try {
      // Check if direction column exists
      const result = await this.db.getAllAsync("PRAGMA table_info(messages)");
      const hasDirection = result.some((col: any) => col.name === 'direction');

      if (!hasDirection) {
        console.log('🔄 Adding direction column to messages table...');
        await this.db.execAsync("ALTER TABLE messages ADD COLUMN direction TEXT NOT NULL DEFAULT 'outbound'");
      }
    } catch (error) {
      console.error('Error migrating tables:', error);
    }
  }

  /**
   * Add message to queue
   */
  public async addMessage(payload: MessagePayload, direction: 'outbound' | 'inbound' = 'outbound'): Promise<void> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const now = Date.now();
    const status = direction === 'inbound' ? 'received' : 'pending';
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO messages (id, type, phoneNumber, message, status, direction, timestamp, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.id,
        payload.type,
        payload.phoneNumber,
        payload.message,
        status,
        direction,
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
       SET status = ?, 
           error = ?, 
           updatedAt = ?, 
           retryCount = CASE WHEN ? = 'failed' THEN retryCount + 1 ELSE retryCount END
       WHERE id = ?`,
      [status, error || null, now, status, id]
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
   * Get sent messages counts within a period
   */
  public async getSentCounts(periodStart: number, periodEnd: number): Promise<MessageCounts> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const row = await this.db.getFirstAsync(
      `
      SELECT
        SUM(CASE WHEN type = 'whatsapp' AND status = 'sent' AND direction = 'outbound' AND updatedAt BETWEEN ? AND ? THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type = 'sms' AND status = 'sent' AND direction = 'outbound' AND updatedAt BETWEEN ? AND ? THEN 1 ELSE 0 END) AS sms
      FROM messages
      `,
      [periodStart, periodEnd, periodStart, periodEnd]
    ) as any;

    const whatsapp = Number(row?.whatsapp ?? 0);
    const sms = Number(row?.sms ?? 0);
    return {
      whatsapp,
      sms,
      total: whatsapp + sms,
    };
  }

  /**
   * Get received messages counts within a period
   */
  public async getReceivedCounts(periodStart: number, periodEnd: number): Promise<MessageCounts> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const row = await this.db.getFirstAsync(
      `
      SELECT
        SUM(CASE WHEN type = 'whatsapp' AND direction = 'inbound' AND updatedAt BETWEEN ? AND ? THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type = 'sms' AND direction = 'inbound' AND updatedAt BETWEEN ? AND ? THEN 1 ELSE 0 END) AS sms
      FROM messages
      `,
      [periodStart, periodEnd, periodStart, periodEnd]
    ) as any;

    const whatsapp = Number(row?.whatsapp ?? 0);
    const sms = Number(row?.sms ?? 0);
    return {
      whatsapp,
      sms,
      total: whatsapp + sms,
    };
  }

  /**
   * Get recent messages
   */
  public async getRecentMessages(limit: number = 20): Promise<DBMessage[]> {
    if (!this.db) throw new Error('قاعدة البيانات غير مهيأة');

    const result = await this.db.getAllAsync(
      `SELECT * FROM messages ORDER BY createdAt DESC LIMIT ?`,
      [limit]
    );
    return result as DBMessage[];
  }

  /**
   * Clear history
   */
  public async clearHistory(): Promise<void> {
    await this.clearAll();
  }
}

export const databaseService = new DatabaseService();
