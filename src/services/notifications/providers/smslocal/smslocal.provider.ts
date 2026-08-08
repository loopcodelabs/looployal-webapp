import { ISMSProvider, SMSPayload, SMSResponse } from '../../types';
import { getSMSLocalConfig } from './smslocal.config';
import { SMSLocalClient } from './smslocal.client';
import { SMSLocalMapper } from './smslocal.mapper';
import { SMSLocalConfig } from './smslocal.types';

export class SMSLocalProvider implements ISMSProvider {
  public name = 'smslocal';
  private config: SMSLocalConfig;
  private client: SMSLocalClient;

  constructor(customConfig?: Partial<SMSLocalConfig>) {
    this.config = {
      ...getSMSLocalConfig(),
      ...customConfig,
    };
    this.client = new SMSLocalClient(this.config);
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config.apiKey &&
      !this.config.apiKey.includes('YOUR_') &&
      this.config.apiKey.trim().length > 0
    );
  }

  public async sendSMS(payload: SMSPayload): Promise<SMSResponse> {
    const requestTimestamp = new Date().toISOString();

    if (!this.isConfigured()) {
      const errMsg = 'SMSLocal credentials not configured in environment variables (SMSLOCAL_API_KEY).';
      console.warn(`[SMSLocalProvider] ${errMsg}`);
      return {
        success: false,
        provider: this.name,
        error: errMsg,
      };
    }

    try {
      const apiReq = SMSLocalMapper.mapToAPIRequest(payload, this.config);

      console.log(`[SMSLocalProvider] Dispatching transactional SMS via SMSLocal gateway to ${apiReq.numbers}...`);

      let attempt = 0;
      let lastError = '';
      let apiResponse = null;

      while (attempt <= this.config.retryCount) {
        attempt++;
        apiResponse = await this.client.sendSMS(apiReq);

        const isSuccess =
          apiResponse.status === 'success' ||
          apiResponse.status === 200 ||
          apiResponse.code === 200 ||
          Boolean(apiResponse.messageId || apiResponse.msgId || (apiResponse.data && apiResponse.data.messageId));

        if (isSuccess) {
          const msgId =
            apiResponse.messageId ||
            apiResponse.msgId ||
            apiResponse.data?.messageId ||
            `smslocal-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

          console.log(`[SMSLocalProvider] SMS delivered successfully! Provider Message ID: ${msgId}`);

          return {
            success: true,
            messageId: msgId,
            provider: this.name,
            rawResponse: {
              status: apiResponse.status,
              messageId: msgId,
              requestTimestamp,
              responseTimestamp: new Date().toISOString(),
              retryCount: attempt - 1,
            },
          };
        }

        lastError = apiResponse.error || apiResponse.message || 'SMSLocal gateway returned failure status';
        console.warn(`[SMSLocalProvider] Dispatch attempt ${attempt}/${this.config.retryCount + 1} failed: ${lastError}`);

        if (attempt < this.config.retryCount) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      return {
        success: false,
        provider: this.name,
        error: lastError,
        rawResponse: {
          requestTimestamp,
          responseTimestamp: new Date().toISOString(),
          retryCount: attempt - 1,
          failureReason: lastError,
        },
      };
    } catch (err: any) {
      console.error(`[SMSLocalProvider] Exception during SMS dispatch:`, err.message || err);
      return {
        success: false,
        provider: this.name,
        error: err.message || 'Unknown SMSLocal provider exception',
      };
    }
  }
}
