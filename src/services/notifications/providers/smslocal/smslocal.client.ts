import { SMSLocalConfig, SMSLocalSendRequest, SMSLocalAPIResponse } from './smslocal.types';

export class SMSLocalClient {
  private config: SMSLocalConfig;

  constructor(config: SMSLocalConfig) {
    this.config = config;
  }

  public async sendSMS(req: SMSLocalSendRequest): Promise<SMSLocalAPIResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const requestBody = {
        apikey: req.apiKey,
        sender: req.sender,
        numbers: req.numbers,
        message: req.message,
        ...(req.entityId ? { entityid: req.entityId } : {}),
        ...(req.templateId ? { templateid: req.templateId } : {}),
      };

      const maskedKey = req.apiKey ? `${req.apiKey.slice(0, 4)}***` : 'UNCONFIGURED';
      console.log(`[SMSLocalClient] Posting SMS request to ${this.config.baseUrl} for recipient: ${req.numbers} (Sender: ${req.sender}, Key: ${maskedKey})`);

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          status: 'failure',
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        };
      }

      const json = await response.json();
      return json as SMSLocalAPIResponse;
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError';
      const errorMessage = isAbort
        ? `Request timed out after ${this.config.timeoutMs}ms`
        : err.message || 'Network request failed';

      console.error(`[SMSLocalClient] Error sending SMS via SMSLocal gateway: ${errorMessage}`);
      return {
        status: 'failure',
        error: errorMessage,
      };
    }
  }
}
