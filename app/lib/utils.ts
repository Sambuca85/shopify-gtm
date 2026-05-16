import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export function sanitizeString(input: string, maxLength: number = 100): string {
  return input
    .replace(/[<>\"'&]/g, '')
    .substring(0, maxLength)
    .trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  device: string;
  isMobile: boolean;
} {
  const ua = userAgent.toLowerCase();
  
  const browser = ua.includes('chrome')
    ? 'Chrome'
    : ua.includes('firefox')
    ? 'Firefox'
    : ua.includes('safari')
    ? 'Safari'
    : ua.includes('edge')
    ? 'Edge'
    : 'Unknown';

  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('mac')
    ? 'macOS'
    : ua.includes('linux')
    ? 'Linux'
    : ua.includes('android')
    ? 'Android'
    : ua.includes('iphone') || ua.includes('ipad')
    ? 'iOS'
    : 'Unknown';

  const isMobile = /mobile|android|iphone|ipad|ipod/.test(ua);

  return {
    browser,
    os,
    device: isMobile ? 'Mobile' : 'Desktop',
    isMobile,
  };
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = localPart.length > 2 
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);
    
  return `${maskedLocal}@${domain}`;
}

export function maskIP(ip: string): string {
  if (ip === 'unknown') return ip;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip.replace(/:[^:]*:[^:]*$/, ':*:*');
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = async (n: number) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (n === 0) {
          reject(error);
        } else {
          setTimeout(() => attempt(n - 1), delay);
        }
      }
    };
    attempt(retries);
  });
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  SEK: 'kr',
  NZD: 'NZ$',
  MXN: '$',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  KRW: '₩',
  TRY: '₺',
  RUB: '₽',
  INR: '₹',
  BRL: 'R$',
  ZAR: 'R',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  HUF: 'Ft',
  CZK: 'Kč',
  ILS: '₪',
  CLP: '$',
  PHP: '₱',
  AED: 'د.إ',
  COP: '$',
  SAR: '﷼',
  MYR: 'RM',
  RON: 'lei',
  DKK: 'kr',
  ARS: '$',
  VEF: 'Bs',
  MAD: 'DH',
  TWD: 'NT$',
  PEN: 'S/',
  UAH: '₴',
  UYU: '$U',
  VND: '₫',
  EGP: 'E£',
  LKR: 'Rs',
  NGN: '₦',
  BDT: '৳',
  PKR: '₨',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: 'د.ب',
  OMR: 'ر.ع.',
  JOD: 'د.ا',
  IQD: 'ع.د',
  DZD: 'د.ج',
  TND: 'د.ت',
  LYD: 'ل.د',
  SDG: 'ج.س.',
  KES: 'KSh',
  GHS: 'GH₵',
  UGX: 'USh',
  TZS: 'TSh',
  ETB: 'Br',
  ZMW: 'ZK',
  MZN: 'MT',
  AOA: 'Kz',
  XOF: 'CFA',
  XAF: 'FCFA',
  XCD: 'EC$',
  XPF: 'F',
  BBD: 'Bds$',
  BMD: 'BD$',
  BND: 'B$',
  BSD: 'B$',
  BZD: 'BZ$',
  FJD: 'FJ$',
  GYD: 'G$',
  JMD: 'J$',
  KYD: 'CI$',
  LRD: 'L$',
  NAD: 'N$',
  SRD: 'SRD',
  TTD: 'TT$',
  TVD: '$',
  ZWD: 'Z$',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
