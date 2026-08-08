# Multi-Tenant SaaS Loyalty Platform - Production Notification Architecture

This enterprise multi-tenant customer loyalty SaaS platform features a provider-independent, non-blocking asynchronous notification architecture designed for production scale with **SMSLocal** as the primary SMS messaging gateway.

---

## 🏗️ Architecture Overview

The communication subsystem is completely decoupled from core financial and reward account business logic:

```
+-----------------------------------------------------------------------+
|                         APPLICATION LAYER                              |
|   (Customer Reg / OTP Login / Earn Points / Redeem Points / Cashier)   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         NOTIFICATION SERVICE                           |
|       (Template Engine + Cryptographic OTP + Async Queue Worker)       |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                   COMMUNICATION PROVIDER INTERFACE                     |
|                   (ISMSProvider: sendSMS / isConfigured)              |
+-----------------------------------------------------------------------+
                    |                                 |
                    v                                 v
+---------------------------------------+   +---------------------------+
|          SMSLOCAL PROVIDER            |   |     MOCK / FALLBACK       |
|  (SMSLocal HTTP REST / DLT Compliant) |   |    (Local Dev Logging)    |
+---------------------------------------+   +---------------------------+
```

### Key Architectural Guarantee
> **Non-blocking Transaction Reliability**: Database writes, point balance credits, and redemptions **never wait** for third-party SMS API responses. SMS notifications are enqueued asynchronously in the background. If a network error or provider timeout occurs, the financial transaction remains committed and the notification worker retries with exponential backoff.

---

## 📱 SMSLocal Setup & DLT Configuration Guide

1. Obtain your **SMSLocal API Key** and approved **Sender ID** from the SMSLocal portal.
2. Configure Indian DLT compliance identifiers (Entity ID, OTP Template ID, Transaction Template ID) in your environment.
3. Set the following environment variables in your environment or `.env` file:

```env
SMS_PROVIDER=smslocal
SMSLOCAL_API_KEY=your_smslocal_api_key_here
SMSLOCAL_BASE_URL=https://api.smslocal.com/v1/send
SMSLOCAL_SENDER_ID=LYLTYP
SMSLOCAL_ENTITY_ID=1001234567890123456
SMSLOCAL_OTP_TEMPLATE_ID=1107161234567890123
SMSLOCAL_TRANSACTION_TEMPLATE_ID=1107161234567890124
SMSLOCAL_WELCOME_TEMPLATE_ID=1107161234567890125
SMSLOCAL_TIMEOUT=5000
SMSLOCAL_RETRY_COUNT=3
SMS_ENABLED=true
APPLICATION_NAME=LoyaltySaaS
```

4. If `SMSLOCAL_API_KEY` is missing or unconfigured, the platform automatically falls back to `MockSMSProvider` for development testing without crashing or interrupting operations.

---

## 🔐 Cryptographic OTP & Security Infrastructure

- **Uniform 6-Digit Numeric Generation**: Powered by Node's `crypto.randomInt(100000, 1000000)` for cryptographically secure random distribution.
- **HMAC SHA-256 Hashing**: OTPs are hashed using SHA-256 HMAC (`OTP_SECRET`) before saving. Plaintext OTPs are never stored or logged in production databases.
- **Rate Limiting & Cooldown**:
  - Request cooldown: `30` seconds minimum between resend requests per mobile number.
  - Maximum limit: Max 5 requests per 10 minutes per mobile number.
- **Verification Attempt Cap**: Maximum `3` failed verification attempts before invalidating the active OTP.
- **Configurable Expiry**: Defaults to `5` minutes (`OTP_EXPIRY_MINUTES=5`).

---

## 🔄 Asynchronous Notification Queue Lifecycle

Each notification request transitions through explicit statuses:
- `PENDING`: Enqueued in worker queue.
- `PROCESSING`: Picked up by background dispatcher.
- `SENT`: Successfully delivered by provider (with provider message ID logged).
- `RETRYING`: Primary provider returned transient error; scheduled for background retry (up to 3 attempts).
- `FAILED`: Permanently failed after maximum retries.

---

## ⚙️ Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SMSLOCAL_API_KEY` | *(Empty)* | Your SMSLocal REST API Key |
| `SMSLOCAL_BASE_URL` | `https://api.smslocal.com/v1/send` | SMSLocal HTTP endpoint URL |
| `SMSLOCAL_SENDER_ID` | `LYLTYP` | Approved 6-character Header / Sender ID |
| `SMSLOCAL_ENTITY_ID` | *(Empty)* | DLT Principal Entity ID |
| `SMSLOCAL_OTP_TEMPLATE_ID` | *(Empty)* | DLT Content Template ID for OTP |
| `SMSLOCAL_TRANSACTION_TEMPLATE_ID` | *(Empty)* | DLT Content Template ID for Transactions |
| `SMSLOCAL_WELCOME_TEMPLATE_ID` | *(Empty)* | DLT Content Template ID for Welcome SMS |
| `SMSLOCAL_TIMEOUT` | `5000` | Gateway request timeout in milliseconds |
| `SMSLOCAL_RETRY_COUNT` | `3` | Internal retry attempts on HTTP failure |
| `SMS_PROVIDER` | `smslocal` | Active SMS provider (`smslocal` \| `mock`) |
| `SMS_ENABLED` | `true` | Master toggle switch for SMS dispatch |
| `APPLICATION_NAME` | `LoyaltySaaS` | Application name used in templates |

---

## 🧩 Adding Future SMS Providers (e.g., MSG91, Exotel, AWS SNS, Twilio)

To add a new provider without modifying any business logic:

1. Create a class implementing `ISMSProvider` in `src/services/notifications/providers/`:

```typescript
import { ISMSProvider, SMSPayload, SMSResponse } from '../types';

export class Msg91Provider implements ISMSProvider {
  public name = 'msg91';

  public isConfigured(): boolean {
    return Boolean(process.env.MSG91_AUTH_KEY);
  }

  public async sendSMS(payload: SMSPayload): Promise<SMSResponse> {
    // Implement MSG91 API call
  }
}
```

2. Register the class in `NotificationService.ts`:

```typescript
if (selectedProviderName === 'msg91') {
  this.primaryProvider = new Msg91Provider();
}
```

No alterations to customer registration, reward engines, or cashier flows are required!
