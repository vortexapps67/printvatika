import React from 'react';
import { cn } from '@/lib/utils';

/* ==========================================================================
   Print Vatika primitives.

   Everything visual in the app is composed from these so the system stays
   consistent: soft cards, deep vermillion for action, mono for data, imagery first.
   ========================================================================== */

/* ---- Registration mark ---------------------------------------------------
   The crosshair a pressman aligns plates with. Used as a structural marker
   beside section labels rather than as decoration. */
export function RegistrationMark({ className }: { className?: string }) {
  return (
    <span className={cn('registration-mark', className)} aria-hidden="true">
      <svg viewBox="0 0 12 12" className="absolute inset-0 h-full w-full" fill="none">
        <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1" />
        <circle cx="6" cy="6" r="1" fill="currentColor" />
      </svg>
    </span>
  );
}

/* ---- CMYK colour control strip ------------------------------------------
   The printer's control bar down the edge of a press sheet. */
export function ColourStrip({ className, rule }: { className?: string; rule?: boolean }) {
  return (
    <div className={cn(rule ? 'colour-rule' : 'colour-strip', className)} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

/* ---- Button --------------------------------------------------------------
   Rounded and soft. `plate` is the one hard-offset shadow and is reserved for
   a single element per viewport. */
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'ink' | 'danger' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-mono text-label font-semibold uppercase tracking-wider2 ' +
  'transition-all duration-150 ease-press active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 select-none';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  solid: 'bg-primary-500 text-white shadow-card hover:bg-primary-600 hover:shadow-card-hover active:bg-primary-700',
  outline: 'border border-ink-300 bg-white text-ink-900 hover:border-ink-950 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-950',
  ink: 'bg-ink-950 text-white hover:bg-ink-800',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-500',
  soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-micro',
  md: 'h-11 px-5',
  lg: 'h-12 px-7 text-body-s',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  plate?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'solid', size = 'md', plate, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        plate && 'shadow-plate hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
        className,
      )}
      {...props}
    />
  );
});

/* ---- Link styled as a button ------------------------------------------- */
export function ButtonLink({
  variant = 'solid',
  size = 'md',
  plate,
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  plate?: boolean;
}) {
  return (
    <a
      className={cn(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        plate && 'shadow-plate hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

/* ---- Badge ---------------------------------------------------------------
   Small status/label pill. Tones are quiet by default: a soft fill plus an
   inset ring, so a row of them reads as one printed sheet rather than as a
   row of stickers. `accent` is the one loud tone and carries the gradient. */
type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'outline'
  | 'success'
  | 'warning'
  | 'danger'
  | 'premium';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-200/70',
  accent:
    'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-card ring-1 ring-inset ring-white/20',
  outline: 'border border-ink-300 bg-white/70 text-ink-600',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-300',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-300',
  /* For the one claim worth printing on black: proofed, 300 DPI. */
  premium: 'bg-ink-950 text-primary-300 ring-1 ring-inset ring-white/10',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  mono = true,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-micro font-medium uppercase tracking-wider2',
        mono && 'font-mono',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---- Ribbon --------------------------------------------------------------
   The retail badge: heavier, tighter tracking, an icon and a real shadow, so
   it survives sitting on top of a photograph. Used for the deal percentage
   and the bestseller mark — the two things a shopper scans a card for. */
type RibbonTone = 'accent' | 'ink' | 'light';

const RIBBON_TONES: Record<RibbonTone, string> = {
  accent:
    'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-card ring-1 ring-inset ring-white/25',
  ink: 'bg-ink-950/90 text-primary-300 shadow-card ring-1 ring-inset ring-white/10 backdrop-blur-sm',
  light: 'bg-white/95 text-ink-950 shadow-card ring-1 ring-inset ring-ink-950/5 backdrop-blur-sm',
};

export function Ribbon({
  tone = 'accent',
  icon,
  children,
  className,
}: {
  tone?: RibbonTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-micro font-semibold uppercase tracking-wider2 leading-none',
        RIBBON_TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/* ---- Panel ---------------------------------------------------------------
   Soft elevated surface. */
export function Panel({
  className,
  children,
  flush,
}: {
  className?: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border border-ink-200/80 bg-white shadow-card',
        !flush && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---- Panel header -------------------------------------------------------- */
export function PanelHead({
  title,
  hint,
  action,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-mono text-label font-semibold uppercase tracking-wider2 text-ink-800">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-body-s text-ink-500">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---- Section header ------------------------------------------------------
   Registration mark + mono eyebrow + display title. The eyebrow carries a
   real fact about the section rather than a generic "Features" label. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  align = 'left',
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: 'left' | 'center';
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'flex flex-col items-center')}>
        {eyebrow && (
          <div className="mb-3 flex items-center gap-2">
            <RegistrationMark className="text-primary-500" />
            <span className="label-caps text-ink-500">{eyebrow}</span>
          </div>
        )}
        <h2 className="text-title sm:text-title-l">{title}</h2>
        {lede && <p className="mt-3 text-body text-ink-500">{lede}</p>}
      </div>
      {action && <div className="flex-none">{action}</div>}
    </div>
  );
}

/* ---- Form field ----------------------------------------------------------
   Wraps a label, control, hint and error with consistent spacing so the
   ~40 inputs across cart / checkout / admin all line up. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="label-caps flex items-center gap-1">
        {label}
        {required && (
          <span className="text-primary-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-body-s font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-body-s text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---- Status pill ---------------------------------------------------------
   One consistent vocabulary for order state across storefront and admin. */
const STATUS_TONE: Record<string, BadgeTone> = {
  PAYMENT_PENDING: 'warning',
  PENDING: 'warning',
  PAID: 'neutral',
  CONFIRMED: 'neutral',
  PRINTING: 'accent',
  READY: 'accent',
  OUT_FOR_DELIVERY: 'neutral',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
  FAILED: 'danger',
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} className={className}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

/* ---- Empty state --------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
          {icon}
        </div>
      )}
      <h3 className="text-title text-ink-900">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-body text-ink-500">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
      <ColourStrip rule className="mt-10 max-w-[12rem]" />
    </div>
  );
}

/* ---- Spec row ------------------------------------------------------------
   Label/value pair in the mono spec voice: used for DPI, GSM, dimensions,
   order totals and anywhere else a pressman would read a spec sheet. */
export function SpecRow({
  label,
  value,
  strong,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-2.5', className)}>
      <dt className="label-caps">{label}</dt>
      <dd
        className={cn(
          'tnum shrink-0 text-right',
          strong ? 'font-display text-title font-bold text-ink-950' : 'text-body text-ink-800',
        )}
      >
        {value}
      </dd>
    </div>
  );
}