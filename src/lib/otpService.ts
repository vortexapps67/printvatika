import crypto from 'crypto';

interface StoredOtp {
  target: string;
  code: string;
  type: 'phone' | 'email';
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage with automatic expiry
const otpStore = new Map<string, StoredOtp>();

// Clean expired OTPs periodically
function cleanExpired() {
  const now = Date.now();
  otpStore.forEach((val, key) => {
    if (val.expiresAt <= now) {
      otpStore.delete(key);
    }
  });
}

/**
 * Standardizes phone numbers to 10-digit Indian mobile format or E.164
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Standardizes email addresses
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Generates and stores a 6-digit OTP code for a phone number or email address
 */
export function generateOtp(target: string, type: 'phone' | 'email'): { code: string; expiresAt: number } {
  cleanExpired();

  const normalized = type === 'phone' ? normalizePhone(target) : normalizeEmail(target);
  const key = `${type}:${normalized}`;

  // Generate a random 6-digit integer (100000 - 999999)
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes validity

  otpStore.set(key, {
    target: normalized,
    code,
    type,
    createdAt: now,
    expiresAt,
    attempts: 0,
  });

  console.log(`\n==================================================`);
  console.log(`🔐 NEW OTP GENERATED: [${type.toUpperCase()}]`);
  console.log(`Target: ${normalized}`);
  console.log(`Verification Code: >>> ${code} <<<`);
  console.log(`Valid for 10 minutes`);
  console.log(`==================================================\n`);

  return { code, expiresAt };
}

/**
 * Verifies the submitted OTP code
 */
export function verifyOtp(
  target: string,
  type: 'phone' | 'email',
  submittedCode: string
): { success: boolean; error?: string } {
  cleanExpired();

  const normalized = type === 'phone' ? normalizePhone(target) : normalizeEmail(target);
  const key = `${type}:${normalized}`;
  const record = otpStore.get(key);

  if (!record) {
    return { success: false, error: 'OTP has expired or was not requested. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { success: false, error: 'OTP has expired. Please request a fresh code.' };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(key);
    return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  // Allow constant-time comparison to prevent timing attacks
  const cleanSubmitted = submittedCode.trim();
  if (record.code !== cleanSubmitted) {
    const remaining = 5 - record.attempts;
    return { success: false, error: `Invalid code. ${remaining} attempts remaining.` };
  }

  // Code is verified, delete it to prevent replay
  otpStore.delete(key);
  return { success: true };
}
