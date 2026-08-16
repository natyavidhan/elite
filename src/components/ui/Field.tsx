import { forwardRef, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, Props>(function Field({ label, error, className = '', id, ...props }, ref) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label htmlFor={inputId} className="block">
      <span className="plate-caption text-[10px] block mb-1">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={`w-full bg-transparent border-0 border-b py-1.5 text-base sm:text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none transition-colors ${
          props.type === 'number' ? 'font-data' : ''
        } ${error ? 'border-gold-600' : 'border-ink-900/25 focus:border-gold-600'} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-gold-700 mt-1 block">{error}</span>}
    </label>
  );
});
