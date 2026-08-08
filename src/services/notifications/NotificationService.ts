import { ISMSProvider, NotificationRecord, NotificationType } from './types';
import { SMSLocalProvider } from './providers/smslocal';
import { MockSMSProvider } from './providers/MockSMSProvider';
import { templateEngine } from './TemplateEngine';
import { NotificationQueue } from './NotificationQueue';

export class NotificationService {
  private primaryProvider: ISMSProvider;
  private fallbackProvider: ISMSProvider;
  private queue: NotificationQueue;

  constructor() {
    this.fallbackProvider = new MockSMSProvider();

    const selectedProviderName = (process.env.SMS_PROVIDER || 'smslocal').toLowerCase();
    
    if (selectedProviderName === 'smslocal') {
      this.primaryProvider = new SMSLocalProvider();
    } else {
      this.primaryProvider = this.fallbackProvider;
    }

    this.queue = new NotificationQueue(this.primaryProvider, this.fallbackProvider);
  }

  public getActiveProviderName(): string {
    if (this.primaryProvider.isConfigured()) {
      return this.primaryProvider.name;
    }
    return `${this.fallbackProvider.name} (fallback - SMSLocal unconfigured)`;
  }

  public sendNotification(
    recipientMobile: string,
    type: NotificationType,
    variables: Record<string, any>
  ): NotificationRecord {
    const message = templateEngine.render(type, variables);

    const record: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientMobile,
      type,
      message,
      status: 'PENDING',
      provider: this.primaryProvider.name,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    };

    return this.queue.enqueue(record);
  }

  public sendOTPNotification(recipientMobile: string, otp: string, type: 'LOGIN' | 'REDEMPTION' | 'REGISTRATION'): NotificationRecord {
    return this.sendNotification(recipientMobile, 'OTP', {
      otp,
      type,
      expiryMinutes: process.env.OTP_EXPIRY_MINUTES || '5',
    });
  }

  public sendPointsEarnedNotification(
    recipientMobile: string,
    details: { points: number; businessName: string; balance: number }
  ): NotificationRecord {
    return this.sendNotification(recipientMobile, 'POINTS_EARNED', details);
  }

  public sendPointsRedeemedNotification(
    recipientMobile: string,
    details: { points: number; businessName: string; balance: number }
  ): NotificationRecord {
    return this.sendNotification(recipientMobile, 'POINTS_REDEEMED', details);
  }

  public sendWelcomeNotification(
    recipientMobile: string,
    details: { customerName: string; universalQrCode: string }
  ): NotificationRecord {
    return this.sendNotification(recipientMobile, 'WELCOME', details);
  }

  public getLogs(limit = 50): NotificationRecord[] {
    return this.queue.getRecentLogs(limit);
  }
}

export const notificationService = new NotificationService();
