import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatNumber, formatPercentage } from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format ISO date string to DD/MM/YYYY', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024');
      expect(formatDate('2024-12-31')).toBe('31/12/2024');
    });

    it('should return date already in DD/MM/YYYY format unchanged', () => {
      expect(formatDate('15/01/2024')).toBe('15/01/2024');
      expect(formatDate('31/12/2024')).toBe('31/12/2024');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('should return empty string for null or undefined', () => {
      expect(formatDate(null as any)).toBe('');
      expect(formatDate(undefined as any)).toBe('');
      expect(formatDate('')).toBe('');
    });

    it('should return original string if date is invalid', () => {
      expect(formatDate('invalid-date')).toBe('invalid-date');
      expect(formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should handle timestamp numbers', () => {
      const timestamp = new Date('2024-01-15').getTime();
      expect(formatDate(timestamp)).toBe('15/01/2024');
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as EUR currency', () => {
      expect(formatCurrency(100)).toBe('100,00 €');
      expect(formatCurrency(1234.56)).toBe('1.234,56 €');
      expect(formatCurrency(0)).toBe('0,00 €');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-50.25)).toBe('-50,25 €');
      expect(formatCurrency(-1234.56)).toBe('-1.234,56 €');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000)).toBe('1.000.000,00 €');
    });

    it('should round to 2 decimals', () => {
      expect(formatCurrency(10.12345)).toBe('10,12 €');
      expect(formatCurrency(10.999)).toBe('11,00 €');
    });

    it('should handle null or undefined as 0', () => {
      expect(formatCurrency(null as any)).toBe('0,00 €');
      expect(formatCurrency(undefined as any)).toBe('0,00 €');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with Spanish locale', () => {
      expect(formatNumber(1234.56)).toBe('1.234,56');
      expect(formatNumber(0)).toBe('0');
    });

    it('should respect decimal places parameter', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1.234,57');
      expect(formatNumber(1234.5678, 0)).toBe('1.235');
      expect(formatNumber(1234.5678, 4)).toBe('1.234,5678');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.56)).toBe('-1.234,56');
    });

    it('should handle null or undefined as 0', () => {
      expect(formatNumber(null as any)).toBe('0');
      expect(formatNumber(undefined as any)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('should format numbers as percentages', () => {
      expect(formatPercentage(25)).toBe('25,00%');
      expect(formatPercentage(33.333)).toBe('33,33%');
      expect(formatPercentage(100)).toBe('100,00%');
    });

    it('should respect decimal places parameter', () => {
      expect(formatPercentage(33.333, 0)).toBe('33%');
      expect(formatPercentage(33.333, 1)).toBe('33,3%');
      expect(formatPercentage(33.333, 3)).toBe('33,333%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercentage(-15.5)).toBe('-15,50%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(0)).toBe('0,00%');
      expect(formatPercentage(null as any)).toBe('0,00%');
      expect(formatPercentage(undefined as any)).toBe('0,00%');
    });
  });
});
