import { SMSPayload } from '../../types';
import { SMSLocalConfig, SMSLocalSendRequest } from './smslocal.types';

export class SMSLocalMapper {
  public static mapToAPIRequest(payload: SMSPayload, config: SMSLocalConfig): SMSLocalSendRequest {
    // Format destination mobile number (ensure 10-digit or Indian 91 format)
    let formattedMobile = payload.to.trim().replace(/\D/g, '');
    if (formattedMobile.length === 10) {
      formattedMobile = `91${formattedMobile}`;
    }

    // Resolve DLT Template ID based on notification type metadata or explicit override
    let templateId = payload.metadata?.templateId;
    const msgType = payload.metadata?.type;

    if (!templateId) {
      if (msgType === 'OTP') {
        templateId = config.otpTemplateId;
      } else if (msgType === 'POINTS_EARNED' || msgType === 'POINTS_REDEEMED') {
        templateId = config.transactionTemplateId;
      } else if (msgType === 'WELCOME') {
        templateId = config.welcomeTemplateId;
      }
    }

    return {
      apiKey: config.apiKey,
      sender: config.senderId,
      numbers: formattedMobile,
      message: payload.body,
      entityId: config.entityId || undefined,
      templateId: templateId || undefined,
    };
  }
}
