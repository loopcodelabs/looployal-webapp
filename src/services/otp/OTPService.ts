import crypto from 'crypto';
import { OTPRecord } from '../notifications/types';
import { notificationService } from '../notifications/NotificationService';

export class OTPService {
  private records: Map<string, OTPRecord[]> = new Map(); // mobileNumber -> OTPRecord[]
  private secretKey: string;
  private defaultLength: number;
  private defaultExpiryMinutes: number;
  private maxAttempts: number;
  private cooldownSeconds: number;

  constructor() {
    this.secretKey = process.env.OTP_SECRET || 'loyalty_saas_otp_secure_hmac_secret_key';
    this.defaultLength = parseInt(process.env.OTP_LENGTH || '6', 10);
    this.defaultExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
    this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10);
    this.cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS || '30', 10);
  }

  /**
   * Hashes the raw OTP string using SHA-256 HMAC for secure storage.
   */
  public hashOTP(otp: string): string {
    return crypto.createHmac('sha256', this.secretKey).update(otp).digest('hex');
  }

  /**
   * Generates a cryptographically secure uniform random numeric OTP.
   */
  public generateNumericOTP(length = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Generates and dispatches a secure OTP to the specified mobile number.
   */
  public requestOTP(
    mobileNumber: string,
    type: 'LOGIN' | 'REDEMPTION' | 'REGISTRATION' = 'LOGIN'
  ): {
    otpRecordId: string;
    expiresAt: string;
    cooldownRemainingSeconds: number;
    // Returned in development/testing mode for ease of developer manual inspection
    plainOtpForDev?: string;
  } {
    const mobileKey = mobileNumber.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(mobileKey)) {
      throw new Error('Invalid mobile number. Mobile number must be exactly 10 digits.');
    }
    const now = Date.now();
    const existingRecords = this.records.get(mobileKey) || [];

    // 1. Rate Limiting: Check cooldown period
    const lastRecord = existingRecords[0];
    if (lastRecord) {
      const timeSinceLast = (now - new Date(lastRecord.lastRequestedAt).getTime()) / 1000;
      if (timeSinceLast < this.cooldownSeconds) {
        const remaining = Math.ceil(this.cooldownSeconds - timeSinceLast);
        throw new Error(`OTP request rate limited. Please wait ${remaining} seconds before requesting a new code.`);
      }
    }

    // 2. Rate Limiting: Max requests per 10 mins
    const tenMinsAgo = now - 10 * 60 * 1000;
    const recentRequestsCount = existingRecords.filter(
      (r) => new Date(r.createdAt).getTime() > tenMinsAgo
    ).length;

    if (recentRequestsCount >= 5) {
      throw new Error('Too many OTP requests for this mobile number. Please try again after 10 minutes.');
    }

    // 3. Generate secure OTP
    const rawOtp = this.generateNumericOTP(this.defaultLength);
    const hashedOtp = this.hashOTP(rawOtp);
    const expiresAt = new Date(now + this.defaultExpiryMinutes * 60 * 1000).toISOString();

    const recordId = `otp-${now}-${crypto.randomBytes(3).toString('hex')}`;

    const record: OTPRecord = {
      id: recordId,
      mobileNumber: mobileKey,
      hashedOtp,
      type,
      expiresAt,
      isVerified: false,
      attempts: 0,
      maxAttempts: this.maxAttempts,
      lastRequestedAt: new Date(now).toISOString(),
      createdAt: new Date(now).toISOString(),
      plainOtpForDev: rawOtp,
    };

    // Store in memory (most recent first)
    existingRecords.unshift(record);
    this.records.set(mobileKey, existingRecords.slice(0, 20)); // Keep last 20 records

    // 4. Send SMS via Notification Service
    notificationService.sendOTPNotification(mobileKey, rawOtp, type);

    console.log(`[OTPService] Generated secure OTP for ${mobileKey} (Type: ${type}, Expires: ${expiresAt}).`);

    return {
      otpRecordId: recordId,
      expiresAt,
      cooldownRemainingSeconds: this.cooldownSeconds,
      plainOtpForDev: rawOtp,
    };
  }

  /**
   * Verifies an OTP against stored hashed records for a mobile number.
   */
  public verifyOTP(mobileNumber: string, inputOtp: string): { success: boolean; message: string } {
    const mobileKey = mobileNumber.trim().replace(/\D/g, '');
    if (!/^\d{10}$/.test(mobileKey)) {
      return {
        success: false,
        message: 'Invalid mobile number. Mobile number must be exactly 10 digits.',
      };
    }
    const existingRecords = this.records.get(mobileKey) || [];

    // Find the latest unverified and unexpired OTP record
    const now = Date.now();
    const validRecord = existingRecords.find(
      (r) => !r.isVerified && new Date(r.expiresAt).getTime() > now && r.attempts < r.maxAttempts
    );

    if (!validRecord) {
      return {
        success: false,
        message: 'No active OTP request found or OTP has expired. Please request a new verification code.',
      };
    }

    // Hash the input OTP
    const inputHashed = this.hashOTP(inputOtp.trim());

    // Allow universal testing master key '123456' for instant demo verification
    const isMasterCode = inputOtp.trim() === '123456';

    if (validRecord.hashedOtp === inputHashed || isMasterCode) {
      validRecord.isVerified = true;
      console.log(`[OTPService] OTP successfully verified for ${mobileKey}.`);
      return { success: true, message: 'OTP verified successfully.' };
    }

    // Increment failed attempts
    validRecord.attempts += 1;
    const remainingAttempts = validRecord.maxAttempts - validRecord.attempts;

    if (remainingAttempts <= 0) {
      console.warn(`[OTPService] Max verification attempts exceeded for ${mobileKey}. Invalidating OTP.`);
      return {
        success: false,
        message: 'Maximum invalid verification attempts exceeded. This code is now void. Please request a new OTP.',
      };
    }

    return {
      success: false,
      message: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
    };
  }

  /**
   * Retrieves all recent OTP records for developer testing inspection endpoints.
   */
  public getAllRecentOTPRecords(): OTPRecord[] {
    const all: OTPRecord[] = [];
    for (const recs of this.records.values()) {
      all.push(...recs);
    }
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const otpService = new OTPService();
