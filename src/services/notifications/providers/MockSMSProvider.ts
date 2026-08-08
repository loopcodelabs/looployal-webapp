import { ISMSProvider, SMSPayload, SMSResponse } from '../types';

export class MockSMSProvider implements ISMSProvider {
  public name = 'mock';

  public isConfigured(): boolean {
    return true;
  }

  public async sendSMS(payload: SMSPayload): Promise<SMSResponse> {
    const mockSid = `MOCK-MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log(`[MockSMSProvider] 📱 DISPATCHED SMS to ${payload.to}: "${payload.body}" (Ref SID: ${mockSid})`);
    
    return {
      success: true,
      messageId: mockSid,
      provider: this.name,
      rawResponse: {
        sid: mockSid,
        status: 'delivered_mock',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
