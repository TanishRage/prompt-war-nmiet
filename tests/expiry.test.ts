import { describe, it, expect } from 'vitest';
import { getExpiryStatus, getDaysUntilExpiry, formatExpiryLabel } from '../src/lib/expiry';

describe('Expiry Status Calculation', () => {
  const reference = new Date('2026-10-23T12:00:00Z');

  it('marks items with past expiry dates as expired', () => {
    const expiredYesterday = '2026-10-22T00:00:00Z';
    expect(getExpiryStatus(expiredYesterday, reference)).toBe('expired');
    expect(getDaysUntilExpiry(expiredYesterday, reference)).toBeLessThan(0);
    expect(formatExpiryLabel(expiredYesterday, reference)).toBe('Expired yesterday');
  });

  it('marks items expiring today as expiring', () => {
    const expiringToday = '2026-10-23T23:59:59Z';
    expect(getExpiryStatus(expiringToday, reference)).toBe('expiring');
    expect(getDaysUntilExpiry(expiringToday, reference)).toBe(0);
    expect(formatExpiryLabel(expiringToday, reference)).toBe('Expires today');
  });

  it('marks items expiring tomorrow as expiring', () => {
    const expiringTomorrow = '2026-10-24T12:00:00Z';
    expect(getExpiryStatus(expiringTomorrow, reference)).toBe('expiring');
    expect(getDaysUntilExpiry(expiringTomorrow, reference)).toBe(1);
    expect(formatExpiryLabel(expiringTomorrow, reference)).toBe('Expires tomorrow');
  });

  it('marks items expiring in 3 days as expiring', () => {
    const expiringIn3Days = '2026-10-26T12:00:00Z';
    expect(getExpiryStatus(expiringIn3Days, reference)).toBe('expiring');
    expect(getDaysUntilExpiry(expiringIn3Days, reference)).toBe(3);
    expect(formatExpiryLabel(expiringIn3Days, reference)).toBe('Expires in 3 days');
  });

  it('marks items expiring in 4 or more days as fresh', () => {
    const freshItem = '2026-10-27T12:00:00Z'; // 4 days
    expect(getExpiryStatus(freshItem, reference)).toBe('fresh');
    expect(getDaysUntilExpiry(freshItem, reference)).toBe(4);
    expect(formatExpiryLabel(freshItem, reference)).toBe('Expires in 4 days');

    const twoWeeks = '2026-11-06T12:00:00Z';
    expect(getExpiryStatus(twoWeeks, reference)).toBe('fresh');
  });
});
