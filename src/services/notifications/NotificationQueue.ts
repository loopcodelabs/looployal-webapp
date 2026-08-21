import { ISMSProvider, NotificationRecord, NotificationStatus, SMSPayload } from './types';
import { queryMySQL, formatToMySQLDateTime } from '../../db/mysql';

export class NotificationQueue {
  private queue: NotificationRecord[] = [];
  private history: NotificationRecord[] = [];
  private isProcessing = false;
  private primaryProvider: ISMSProvider;
  private fallbackProvider?: ISMSProvider;

  constructor(primaryProvider: ISMSProvider, fallbackProvider?: ISMSProvider) {
    this.primaryProvider = primaryProvider;
    this.fallbackProvider = fallbackProvider;
  }

  public setProviders(primary: ISMSProvider, fallback?: ISMSProvider) {
    this.primaryProvider = primary;
    this.fallbackProvider = fallback;
  }

  private async persistNotification(record: NotificationRecord) {
    try {
      const createdAt = formatToMySQLDateTime(record.createdAt) || formatToMySQLDateTime(new Date());
      const sentAt = formatToMySQLDateTime(record.sentAt);
      const failedAt = formatToMySQLDateTime(record.failedAt);
      await queryMySQL(
        `INSERT INTO notifications_queue (id, recipient_mobile, type, message, status, provider, attempts, max_attempts, error, message_id, created_at, sent_at, failed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status=VALUES(status), provider=VALUES(provider), attempts=VALUES(attempts), error=VALUES(error), message_id=VALUES(message_id), sent_at=VALUES(sent_at), failed_at=VALUES(failed_at)`,
        [
          record.id,
          record.recipientMobile,
          record.type,
          record.message,
          record.status,
          record.provider,
          record.attempts,
          record.maxAttempts,
          record.error ?? null,
          record.messageId ?? null,
          createdAt,
          sentAt,
          failedAt,
        ]
      );

      if (record.status === 'SENT') {
        await queryMySQL(
          `INSERT INTO sms_logs (id, recipient_mobile, message, status, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status)`,
          [record.id, record.recipientMobile, record.message, 'SENT', createdAt]
        );
      }
    } catch {
      // Non-blocking if MySQL persistence is offline
    }
  }

  /**
   * Enqueues a notification to be processed asynchronously in the background.
   */
  public enqueue(record: NotificationRecord): NotificationRecord {
    this.queue.push(record);
    this.history.unshift(record);

    // Trim history if larger than 500
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }

    this.persistNotification(record);

    // Trigger queue processing asynchronously (non-blocking)
    setImmediate(() => this.processQueue());

    return record;
  }

  public getHistory(): NotificationRecord[] {
    return [...this.history];
  }

  public getRecentLogs(limit = 50): NotificationRecord[] {
    return this.history.slice(0, limit);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const record = this.queue.shift();
      if (!record) break;

      await this.dispatchRecord(record);
    }

    this.isProcessing = false;
  }

  private async dispatchRecord(record: NotificationRecord): Promise<void> {
    record.status = 'PROCESSING';
    record.attempts += 1;

    const payload: SMSPayload = {
      to: record.recipientMobile,
      body: record.message,
      referenceId: record.id,
    };

    let activeProvider = this.primaryProvider;
    // Check if primary is configured. If not and fallback exists, use fallback.
    if (!activeProvider.isConfigured() && this.fallbackProvider) {
      activeProvider = this.fallbackProvider;
    }

    record.provider = activeProvider.name;

    try {
      const response = await activeProvider.sendSMS(payload);

      if (response.success) {
        record.status = 'SENT';
        record.sentAt = new Date().toISOString();
        record.messageId = response.messageId;
        console.log(`[NotificationQueue] Successfully sent ${record.type} notification to ${record.recipientMobile} via ${activeProvider.name}.`);
        this.persistNotification(record);
      } else {
        // If primary provider failed and fallback is available and hasn't been tried yet
        if (activeProvider !== this.fallbackProvider && this.fallbackProvider) {
          console.warn(`[NotificationQueue] Primary provider ${activeProvider.name} failed (${response.error}). Attempting fallback provider ${this.fallbackProvider.name}...`);
          const fallbackRes = await this.fallbackProvider.sendSMS(payload);
          if (fallbackRes.success) {
            record.status = 'SENT';
            record.sentAt = new Date().toISOString();
            record.provider = this.fallbackProvider.name;
            record.messageId = fallbackRes.messageId;
            this.persistNotification(record);
            return;
          }
        }

        record.error = response.error;
        if (record.attempts < record.maxAttempts) {
          record.status = 'RETRYING';
          console.warn(`[NotificationQueue] Notification dispatch failed (Attempt ${record.attempts}/${record.maxAttempts}). Will retry in background...`);
          this.persistNotification(record);
          // Re-queue with slight delay
          setTimeout(() => {
            this.queue.push(record);
            this.processQueue();
          }, 2000 * record.attempts);
        } else {
          record.status = 'FAILED';
          record.failedAt = new Date().toISOString();
          console.error(`[NotificationQueue] Notification dispatch permanently FAILED for ${record.recipientMobile} after ${record.attempts} attempts: ${record.error}`);
          this.persistNotification(record);
        }
      }
    } catch (err: any) {
      record.error = err.message || 'Dispatch Exception';
      record.status = 'FAILED';
      record.failedAt = new Date().toISOString();
      console.error(`[NotificationQueue] Exception processing notification:`, err);
      this.persistNotification(record);
    }
  }
}
