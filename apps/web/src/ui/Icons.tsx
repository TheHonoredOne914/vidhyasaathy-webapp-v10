import type { SVGProps } from 'react';

export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: 'check' | 'close' | 'search' | 'plus' | 'arrow'; size?: number }) {
  const paths = { check: <path d="m4 10 4 4 8-9" />, close: <path d="m5 5 10 10m0-10L5 15" />, search: <><circle cx="8" cy="8" r="4.5" /><path d="m11.5 11.5 4 4" /></>, plus: <path d="M10 4v12M4 10h12" />, arrow: <path d="M3 10h13m-5-5 5 5-5 5" /> }[name];
  return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths}</svg>;
}
