export type SMSProviderType = 'smslocal' | 'mock' | 'msg91' | 'aws_sns';

export type NotificationStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RETRYING';

export type NotificationType = 'OTP' | 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'WELCOME' | 'CUSTOM';

export interface SMSPayload {
  to: string;
  body: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  rawResponse?: any;
}

export interface ISMSProvider {
  name: string;
  isConfigured(): boolean;
  sendSMS(payload: SMSPayload): Promise<SMSResponse>;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  bodyTemplate: string;
}

export interface NotificationRecord {
  id: string;
  recipientMobile: string;
  type: NotificationType;
  message: string;
  status: NotificationStatus;
  provider: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
  messageId?: string;
  createdAt: string;
  sentAt?: string;
  failedAt?: string;
}

export interface OTPRecord {
  id: string;
  mobileNumber: string;
  hashedOtp: string;
  type: 'LOGIN' | 'REDEMPTION' | 'REGISTRATION';
  expiresAt: string;
  isVerified: boolean;
  attempts: number;
  maxAttempts: number;
  lastRequestedAt: string;
  createdAt: string;
  // Included in dev mode for testing/inspection without revealing in public logs
  plainOtpForDev?: string;
}
