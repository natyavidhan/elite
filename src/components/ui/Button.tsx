import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-vermilion-600 text-paper-100 hover:bg-vermilion-700 active:bg-vermilion-800 disabled:bg-paper-400 disabled:text-ink-500',
  secondary: 'bg-transparent text-ink-900 border border-ink-900/30 hover:border-ink-900 disabled:border-paper-400 disabled:text-ink-500',
  ghost: 'bg-transparent text-ink-700 hover:text-vermilion-600 disabled:text-ink-500',
  danger: 'bg-transparent text-vermilion-700 border border-vermilion-700/40 hover:bg-vermilion-700 hover:text-paper-100 disabled:border-paper-400 disabled:text-ink-500',
};

const BASE_CLASSES = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[2px] transition-colors duration-150 disabled:cursor-not-allowed';

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
