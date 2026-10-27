import type { ImgHTMLAttributes } from 'react';

export function Avatar({ name, size = 'md', ...props }: ImgHTMLAttributes<HTMLImageElement> & { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return props.src ? <img {...props} alt={props.alt ?? name} className={`rounded-full border-2 border-navy object-cover ${size === 'sm' ? 'size-8' : size === 'lg' ? 'size-16' : 'size-11'} ${props.className ?? ''}`.trim()} /> : <span aria-label={name} className={`inline-flex items-center justify-center rounded-full border-2 border-navy bg-sky font-semibold text-navy ${size === 'sm' ? 'size-8' : size === 'lg' ? 'size-16 text-xl' : 'size-11'}`}>{initials}</span>;
}
