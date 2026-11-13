import crypto from 'crypto';

interface SendOtpResult {
  success: boolean;
  testMode?: boolean;
  error?: string;
}

export const smsService = {
  /**
   * Format phone number to E.164-compatible Indian mobile number (e.g., 919876543210).
   */
  formatIndianPhone(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `91${digitsOnly}`;
    }
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return digitsOnly;
    }
    return digitsOnly;
  },

  /**
   * Send a 6-digit OTP code to the recipient phone via MSG91 (DLT approved in India).
   * In local/development or unconfigured test mode, logs to console without leaking to client.
   */
  async sendOtp(phone: string, otp: string): Promise<SendOtpResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID || process.env.MSG91_FLOW_ID;
    const formattedPhone = this.formatIndianPhone(phone);

    // If provider credentials are not set
    if (!authKey || !templateId) {
      if (process.env.NODE_ENV !== 'production') {
        // Labelled test mode for development / local testing
        console.log(
          `[SMS TEST MODE] To: +${formattedPhone} | Code: ${otp} | Provider: MSG91 (DLT entity approval pending)`
        );
        return {
          success: true,
          testMode: true,
        };
      }

      // Fail honestly in production if SMS provider is not configured
      console.error(
        '[SMS SERVICE ERROR] MSG91_AUTH_KEY or template ID is missing in production environment.'
      );
      return {
        success: false,
        error: 'SMS could not be sent, try again',
      };
    }

    // Provider call to MSG91 Flow API
    try {
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          short_url: '0',
          recipients: [
            {
              mobiles: formattedPhone,
              otp,
              code: otp,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[SMS SERVICE MSG91 HTTP ERROR]', response.status, errorBody);
        return {
          success: false,
          error: 'SMS could not be sent, try again',
        };
      }

      const resData = (await response.json()) as { type?: string; message?: string };
      if (resData.type && resData.type.toLowerCase() === 'error') {
        console.error('[SMS SERVICE MSG91 ERROR RESPONSE]', resData.message || resData);
        return {
          success: false,
          error: 'SMS could not be sent, try again',
        };
      }

      return {
        success: true,
        testMode: false,
      };
    } catch (err) {
      console.error('[SMS SERVICE DISPATCH EXCEPTION]', err);
      return {
        success: false,
        error: 'SMS could not be sent, try again',
      };
    }
  },

  /**
   * Hash OTP using SHA-256 for secure database storage.
   */
  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  },

  /**
   * Verify input OTP against stored SHA-256 hash using constant-time comparison.
   */
  verifyOtpHash(inputOtp: string, storedHashOrPlain: string): boolean {
    const trimmedInput = inputOtp.trim();
    if (!trimmedInput) return false;

    // Check SHA-256 hash comparison
    if (storedHashOrPlain.length === 64) {
      const inputHash = this.hashOtp(trimmedInput);
      try {
        return (
          storedHashOrPlain.length === inputHash.length &&
          crypto.timingSafeEqual(Buffer.from(storedHashOrPlain, 'hex'), Buffer.from(inputHash, 'hex'))
        );
      } catch {
        return false;
      }
    }

    // Fallback for legacy plaintext OTPs
    return storedHashOrPlain === trimmedInput;
  },
};
