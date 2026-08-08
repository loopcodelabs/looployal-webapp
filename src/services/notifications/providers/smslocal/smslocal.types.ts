export interface SMSLocalConfig {
  apiKey: string;
  baseUrl: string;
  senderId: string;
  entityId?: string;
  otpTemplateId?: string;
  transactionTemplateId?: string;
  welcomeTemplateId?: string;
  timeoutMs: number;
  retryCount: number;
}

export interface SMSLocalSendRequest {
  apiKey: string;
  sender: string;
  numbers: string;
  message: string;
  entityId?: string;
  templateId?: string;
}

export interface SMSLocalAPIResponse {
  status: 'success' | 'failure' | 'error' | number | string;
  code?: number | string;
  message?: string;
  messageId?: string;
  msgId?: string;
  data?: {
    messageId?: string;
    status?: string;
  };
  error?: string;
}

export interface SMSLocalLogEntry {
  recipient: string;
  senderId: string;
  templateId?: string;
  requestTimestamp: string;
  responseTimestamp?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  messageId?: string;
  failureReason?: string;
  retryCount: number;
}
