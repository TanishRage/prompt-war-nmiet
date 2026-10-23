import { ExpiryStatus } from '@/types';

/**
 * Calculates days remaining until expiration relative to a reference date.
 * Positive = future, 0 = today, negative = past.
 */
export function getDaysUntilExpiry(
  expiresAt: string | Date,
  referenceDate: Date = new Date()
): number {
  const expiry = new Date(expiresAt);
  const now = new Date(referenceDate);

  // Normalize both dates to midnight UTC to prevent hour/minute daylight skew
  const utcExpiry = Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate());
  const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const diffMs = utcExpiry - utcNow;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Categorizes an item as:
 * - 'expired': past its expiry date (< 0 days)
 * - 'expiring': expiring within 3 days (0 to 3 days inclusive)
 * - 'fresh': 4 or more days remaining (> 3 days)
 */
export function getExpiryStatus(
  expiresAt: string | Date,
  referenceDate: Date = new Date()
): ExpiryStatus {
  const days = getDaysUntilExpiry(expiresAt, referenceDate);
  if (days < 0) {
    return 'expired';
  }
  if (days <= 3) {
    return 'expiring';
  }
  return 'fresh';
}

/**
 * Human-readable friendly text representation for expiration.
 */
export function formatExpiryLabel(
  expiresAt: string | Date,
  referenceDate: Date = new Date()
): string {
  const days = getDaysUntilExpiry(expiresAt, referenceDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    return absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`;
  }
  if (days === 0) {
    return 'Expires today';
  }
  if (days === 1) {
    return 'Expires tomorrow';
  }
  if (days <= 3) {
    return `Expires in ${days} days`;
  }
  if (days < 30) {
    return `Expires in ${days} days`;
  }
  const months = Math.round(days / 30);
  return months === 1 ? 'Expires in ~1 month' : `Expires in ~${months} months`;
}
