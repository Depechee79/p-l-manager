import { describe, it, expect } from 'vitest';
import {
  calculateFoodCost,
  calculateMarginPercentage,
  calculateCosteIngrediente,
  calculateBaseImponible,
  calculateGrossMargin,
} from './calculations';

describe('calculations', () => {
  describe('calculateFoodCost', () => {
    it('should calculate food cost percentage correctly', () => {
      expect(calculateFoodCost(30, 100)).toBe(30);
      expect(calculateFoodCost(45, 150)).toBe(30);
      expect(calculateFoodCost(25.5, 85)).toBe(30);
    });

    it('should return 0 when pvpNeto is 0', () => {
      expect(calculateFoodCost(30, 0)).toBe(0);
    });

    it('should return 0 when pvpNeto is null or undefined', () => {
      expect(calculateFoodCost(30, null as any)).toBe(0);
      expect(calculateFoodCost(30, undefined as any)).toBe(0);
    });

    it('should handle edge case with very small numbers', () => {
      expect(calculateFoodCost(0.01, 0.10)).toBeCloseTo(10, 2);
    });
  });

  describe('calculateMarginPercentage', () => {
    it('should calculate margin percentage correctly', () => {
      expect(calculateMarginPercentage(30, 100)).toBe(70);
      expect(calculateMarginPercentage(45, 150)).toBe(70);
      expect(calculateMarginPercentage(60, 100)).toBe(40);
    });

    it('should return 0 when pvpNeto is 0', () => {
      expect(calculateMarginPercentage(30, 0)).toBe(0);
    });

    it('should return 0 when pvpNeto is null or undefined', () => {
      expect(calculateMarginPercentage(30, null as any)).toBe(0);
      expect(calculateMarginPercentage(30, undefined as any)).toBe(0);
    });

    it('should handle negative margin (loss)', () => {
      expect(calculateMarginPercentage(150, 100)).toBe(-50);
    });
  });

  describe('calculateCosteIngrediente', () => {
    it('should calculate ingredient cost correctly', () => {
      expect(calculateCosteIngrediente(5, 10)).toBe(50);
      expect(calculateCosteIngrediente(2.5, 8)).toBe(20);
      expect(calculateCosteIngrediente(0, 10)).toBe(0);
    });

    it('should handle null or undefined values as 0', () => {
      expect(calculateCosteIngrediente(null as any, 10)).toBe(0);
      expect(calculateCosteIngrediente(5, undefined as any)).toBe(0);
      expect(calculateCosteIngrediente(null as any, null as any)).toBe(0);
    });

    it('should handle decimal quantities', () => {
      expect(calculateCosteIngrediente(1.5, 3.75)).toBeCloseTo(5.625, 3);
    });
  });

  describe('calculateBaseImponible', () => {
    it('should calculate base imponible (price without VAT) correctly', () => {
      expect(calculateBaseImponible(110, 10)).toBeCloseTo(100, 2);
      expect(calculateBaseImponible(121, 21)).toBeCloseTo(100, 2);
      expect(calculateBaseImponible(104, 4)).toBeCloseTo(100, 2);
    });

    it('should return 0 when precioConIva is 0 or falsy', () => {
      expect(calculateBaseImponible(0, 10)).toBe(0);
      expect(calculateBaseImponible(null as any, 10)).toBe(0);
      expect(calculateBaseImponible(undefined as any, 10)).toBe(0);
    });

    it('should handle 0% VAT', () => {
      expect(calculateBaseImponible(100, 0)).toBe(100);
    });

    it('should handle real-world scenarios', () => {
      // Producto a 25€ con IVA del 10%
      expect(calculateBaseImponible(25, 10)).toBeCloseTo(22.73, 2);
    });
  });

  describe('calculateGrossMargin', () => {
    it('should calculate gross margin (absolute value) correctly', () => {
      expect(calculateGrossMargin(100, 30)).toBe(70);
      expect(calculateGrossMargin(150, 45)).toBe(105);
      expect(calculateGrossMargin(50, 60)).toBe(-10);
    });

    it('should handle null or undefined values as 0', () => {
      expect(calculateGrossMargin(null as any, 30)).toBe(-30);
      expect(calculateGrossMargin(100, undefined as any)).toBe(100);
      expect(calculateGrossMargin(null as any, null as any)).toBe(0);
    });

    it('should handle zero values', () => {
      expect(calculateGrossMargin(0, 0)).toBe(0);
      expect(calculateGrossMargin(100, 0)).toBe(100);
      expect(calculateGrossMargin(0, 50)).toBe(-50);
    });
  });
});
