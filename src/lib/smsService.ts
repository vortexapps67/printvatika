/**
 * Real SMS & Email Dispatcher for Print Vatika OTP Verification
 * Supports:
 * - Fast2SMS (Instant Indian SMS gateway without DLT hassle)
 * - Meta WhatsApp Cloud API (Free 1,000 conversations/mo)
 * - Twilio SMS (Global SMS)
 * - Resend / Webhook for Email
 */

export async function sendRealSms(phone: string, otpCode: string): Promise<{ sent: boolean; provider?: string; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, '');
  const tenDigitPhone = cleanPhone.slice(-10);

  // 1. Fast2SMS (Indian SMS Gateway - simplest setup for Indian +91 numbers)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const res = await fetch(`https://www.fast2sms.com/dev/bulkV2`, {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: tenDigitPhone,
        }),
      });
      const data = await res.json();
      if (data.return) {
        return { sent: true, provider: 'Fast2SMS' };
      }
      console.warn('Fast2SMS returned error:', data);
    } catch (err: any) {
      console.error('Fast2SMS fetch error:', err);
    }
  }

  // 2. Twilio SMS
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const formattedTo = phone.startsWith('+') ? phone : `+91${tenDigitPhone}`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const params = new URLSearchParams({
        To: formattedTo,
        From: twilioPhone,
        Body: `Your Print Vatika verification code is: ${otpCode}. Valid for 10 minutes.`,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        return { sent: true, provider: 'Twilio' };
      }
    } catch (err: any) {
      console.error('Twilio SMS error:', err);
    }
  }

  // 3. Meta WhatsApp Cloud API (Free & reliable for Indian numbers)
  const whatsappToken = process.env.WHATSAPP_API_TOKEN;
  const whatsappUrl = process.env.WHATSAPP_API_URL;
  if (whatsappToken && whatsappUrl) {
    try {
      const res = await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${tenDigitPhone}`,
          type: 'text',
          text: {
            body: `Your Print Vatika verification code is: *${otpCode}*.\nValid for 10 minutes. Do not share this code with anyone.`,
          },
        }),
      });
      if (res.ok) {
        return { sent: true, provider: 'WhatsApp' };
      }
    } catch (err: any) {
      console.error('WhatsApp API error:', err);
    }
  }

  return {
    sent: false,
    error: 'No SMS gateway API keys configured in environment variables (FAST2SMS_API_KEY, TWILIO_ACCOUNT_SID, or WHATSAPP_API_TOKEN).',
  };
}

export async function sendRealEmail(email: string, otpCode: string): Promise<{ sent: boolean; provider?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Print Vatika <orders@printvatika.com>',
          to: [email],
          subject: `${otpCode} is your Print Vatika verification code`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px;">
              <h2 style="color: #0f172a; margin-top: 0;">Print Vatika Verification</h2>
              <p style="color: #475569; font-size: 15px;">Your one-time verification code is:</p>
              <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #1e40af; margin: 20px 0;">
                ${otpCode}
              </div>
              <p style="color: #64748b; font-size: 13px;">This code is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        }),
      });
      if (res.ok) {
        return { sent: true, provider: 'Resend' };
      }
    } catch (err) {
      console.error('Resend email error:', err);
    }
  }

  return { sent: false };
}
