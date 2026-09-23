import { clsx, type ClassValue } from 'clsx';

export function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const focusRing =
  'focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-tremor-brand focus-visible:outline-hidden focus-visible:ring-inset';
