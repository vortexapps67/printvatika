'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  X,
  Loader2,
  RefreshCw,
  Phone,
  Mail,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: string;
  type: 'phone' | 'email';
  userName?: string;
  onVerified: (user: any) => void;
}

export function OtpModal({
  isOpen,
  onClose,
  target,
  type,
  userName,
  onVerified,
}: OtpModalProps) {
  const { verifyOtp, sendOtp } = useAuth();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [isResending, setIsResending] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError('');
      setVerifiedSuccess(false);
      setCountdown(45);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    setError('');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (char && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await verifyOtp(target, type, code, userName);

      if (!res.success) {
        throw new Error(res.error || 'Verification failed. Please check the code and try again.');
      }

      setVerifiedSuccess(true);
      setTimeout(() => {
        onVerified(res.user);
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setError('');

    try {
      const res = await sendOtp(target, type, userName);
      if (!res.success) {
        throw new Error(res.error || 'Failed to resend verification code.');
      }
      setCountdown(45);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Could not resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Top colored strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-500" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                {type === 'phone' ? <Phone size={22} /> : <Mail size={22} />}
              </div>
              <div>
                <h3 className="font-display text-title font-bold text-ink-950">
                  Verify {type === 'phone' ? 'Mobile' : 'Email'}
                </h3>
                <p className="text-body-s text-ink-500">Enter the 6-digit verification code</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Target Pill */}
          <div className="rounded-xl border border-ink-100 bg-ink-50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-body-s font-medium text-ink-800">
              <ShieldCheck size={16} className="text-primary-600 shrink-0" />
              <span className="font-mono text-body-s">{target}</span>
            </div>
            <span className="font-mono text-micro text-emerald-700 font-semibold uppercase tracking-wider">
              Sent
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-body-s text-red-700 animate-in fade-in">
              {error}
            </div>
          )}

          {/* 6 Digit Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isSubmitting || verifiedSuccess}
                  className={`h-12 w-11 sm:h-14 sm:w-12 rounded-xl text-center font-display text-xl sm:text-2xl font-bold tracking-tight transition-all duration-200 ${
                    digit
                      ? 'border-2 border-primary-500 bg-primary-50/20 text-ink-950 shadow-sm'
                      : 'border border-ink-200 bg-white text-ink-900 hover:border-ink-300'
                  } focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:outline-none`}
                />
              ))}
            </div>

            {/* Countdown / Resend */}
            <div className="flex items-center justify-between text-body-s text-ink-500 pt-1">
              <span>Didn&apos;t receive code?</span>
              {countdown > 0 ? (
                <span className="font-mono text-micro text-ink-400">
                  Resend in 00:{countdown < 10 ? `0${countdown}` : countdown}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-mono text-micro font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={12} className={isResending ? 'animate-spin' : ''} />
                  Resend Code
                </button>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isSubmitting || digits.join('').length < 6 || verifiedSuccess}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Verifying...
              </>
            ) : verifiedSuccess ? (
              <>
                <CheckCircle2 size={18} className="text-emerald-300" />
                Verified!
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
