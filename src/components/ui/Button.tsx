import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Lift only applies to variants with a real surface (a fill or a border) —
// a translateY with nothing visibly moving reads as a glitch, not a lift.
// `ghost` stays a quiet color-only hover, same as a plain text link.
const LIFT_CLASSES = 'hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:shadow-none';

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: `bg-gold-600 text-paper-100 hover:bg-gold-700 active:bg-gold-800 disabled:bg-paper-400 disabled:text-ink-500 ${LIFT_CLASSES}`,
  secondary: `bg-transparent text-ink-900 border border-ink-900/30 hover:border-ink-900 disabled:border-paper-400 disabled:text-ink-500 ${LIFT_CLASSES}`,
  ghost: 'bg-transparent text-ink-700 hover:text-gold-600 disabled:text-ink-500',
  danger: `bg-transparent text-gold-700 border border-gold-700/40 hover:bg-gold-700 hover:text-paper-100 disabled:border-paper-400 disabled:text-ink-500 ${LIFT_CLASSES}`,
};

const BASE_CLASSES = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-[color,background-color,border-color,transform,box-shadow] duration-150 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none';

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className = '', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`${BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
}

export function LinkButton({ variant = 'primary', className = '', ...props }: LinkButtonProps) {
  return <Link className={`${BASE_CLASSES} ${BUTTON_VARIANT_CLASSES[variant]} ${className}`} {...props} />;
}
