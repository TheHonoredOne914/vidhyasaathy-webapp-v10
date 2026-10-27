import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'accent';

export function buttonClasses(variant: Variant = 'primary', className = ''): string {
  const base = 'inline-flex min-h-12 items-center justify-center rounded-[14px] px-[22px] text-base font-semibold transition-[transform,box-shadow,background-color] duration-200 active:translate-y-[3px]';
  const look = variant === 'primary'
    ? 'bg-navy text-ivory shadow-[0_4px_0_#041d3d] hover:bg-midnight active:shadow-[0_1px_0_#041d3d] disabled:bg-ice disabled:text-navy disabled:shadow-none'
    : variant === 'accent'
      ? 'bg-[#ffd8c2] text-midnight shadow-[0_4px_0_#ffb894] hover:bg-[#ffb894] active:shadow-[0_1px_0_#ffb894] disabled:bg-ice disabled:text-navy disabled:shadow-none'
      : 'border border-navy bg-ivory text-midnight shadow-[0_4px_0_#193e69] hover:bg-ice active:shadow-[0_1px_0_#193e69] disabled:bg-ice disabled:text-navy disabled:shadow-none';
  return `${base} ${look} ${className}`.trim();
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  children,
  ...rest
}: {
  variant?: Variant;
  className?: string;
  type?: 'button' | 'submit';
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'className' | 'children'>) {
  return (
    <button type={type} className={buttonClasses(variant, className)} {...rest}>
      {children}
    </button>
  );
}
