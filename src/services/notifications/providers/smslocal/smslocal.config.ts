import { SMSLocalConfig } from './smslocal.types';

export function getSMSLocalConfig(): SMSLocalConfig {
  return {
    apiKey: process.env.SMSLOCAL_API_KEY || '',
    baseUrl: process.env.SMSLOCAL_BASE_URL || 'https://api.smslocal.com/v1/send',
    senderId: process.env.SMSLOCAL_SENDER_ID || 'LYLTYP',
    entityId: process.env.SMSLOCAL_ENTITY_ID || process.env.SMSLOCAL_DLT_ENTITY_ID || '',
    otpTemplateId: process.env.SMSLOCAL_OTP_TEMPLATE_ID || '',
    transactionTemplateId: process.env.SMSLOCAL_TRANSACTION_TEMPLATE_ID || '',
    welcomeTemplateId: process.env.SMSLOCAL_WELCOME_TEMPLATE_ID || '',
    timeoutMs: Number(process.env.SMSLOCAL_TIMEOUT || '5000'),
    retryCount: Number(process.env.SMSLOCAL_RETRY_COUNT || '3'),
  };
}
