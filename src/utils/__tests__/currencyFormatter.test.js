import { formatCurrency, parseCurrency, formatPercentage, formatNumber } from '../currencyFormatter';

describe('currencyFormatter', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(999999.99)).toBe('$999,999.99');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-0.01)).toBe('-$0.01');
    });

    it('should handle different currency codes', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
      expect(formatCurrency(1234.56, 'JPY')).toBe('¥1,235'); // JPY has no decimal places
    });

    it('should handle different locales', () => {
      expect(formatCurrency(1234.56, 'USD', 'de-DE')).toBe('1.234,56 $');
      expect(formatCurrency(1234.56, 'EUR', 'fr-FR')).toBe('1 234,56 €');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency('')).toBe('$0.00');
      expect(formatCurrency('invalid')).toBe('$0.00');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(1000000000)).toBe('$1,000,000,000.00');
      expect(formatCurrency(999999999999.99)).toBe('$999,999,999,999.99');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.001)).toBe('$0.00'); // Rounds to 2 decimal places
    });
  });

  describe('parseCurrency', () => {
    it('should parse formatted currency strings', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
      expect(parseCurrency('$0.00')).toBe(0);
      expect(parseCurrency('-$1,234.56')).toBe(-1234.56);
    });

    it('should parse different currency symbols', () => {
      expect(parseCurrency('€1,234.56')).toBe(1234.56);
      expect(parseCurrency('£1,234.56')).toBe(1234.56);
      expect(parseCurrency('¥1,235')).toBe(1235);
    });

    it('should handle numbers without currency symbols', () => {
      expect(parseCurrency('1234.56')).toBe(1234.56);
      expect(parseCurrency('1,234.56')).toBe(1234.56);
      expect(parseCurrency('-1234.56')).toBe(-1234.56);
    });

    it('should handle edge cases', () => {
      expect(parseCurrency('')).toBe(0);
      expect(parseCurrency(null)).toBe(0);
      expect(parseCurrency(undefined)).toBe(0);
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('$')).toBe(0);
    });

    it('should handle different decimal separators', () => {
      expect(parseCurrency('1.234,56', 'de-DE')).toBe(1234.56);
      expect(parseCurrency('1 234,56', 'fr-FR')).toBe(1234.56);
    });

    it('should handle numeric inputs', () => {
      expect(parseCurrency(1234.56)).toBe(1234.56);
      expect(parseCurrency(0)).toBe(0);
      expect(parseCurrency(-1234.56)).toBe(-1234.56);
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(0)).toBe('0.00%');
      expect(formatPercentage(1)).toBe('100.00%');
      expect(formatPercentage(-0.1)).toBe('-10.00%');
    });

    it('should handle custom decimal places', () => {
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
      expect(formatPercentage(0.1234, 0)).toBe('12%');
      expect(formatPercentage(0.1234, 3)).toBe('12.340%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(null)).toBe('0.00%');
      expect(formatPercentage(undefined)).toBe('0.00%');
      expect(formatPercentage('')).toBe('0.00%');
      expect(formatPercentage('invalid')).toBe('0.00%');
    });

    it('should handle very large percentages', () => {
      expect(formatPercentage(10)).toBe('1,000.00%');
      expect(formatPercentage(100)).toBe('10,000.00%');
    });

    it('should handle very small percentages', () => {
      expect(formatPercentage(0.0001)).toBe('0.01%');
      expect(formatPercentage(0.00001)).toBe('0.00%');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle decimal places', () => {
      expect(formatNumber(1234.56, 2)).toBe('1,234.56');
      expect(formatNumber(1234.5, 2)).toBe('1,234.50');
      expect(formatNumber(1234, 2)).toBe('1,234.00');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1,234');
      expect(formatNumber(-1234.56, 2)).toBe('-1,234.56');
    });

    it('should handle different locales', () => {
      expect(formatNumber(1234.56, 2, 'de-DE')).toBe('1.234,56');
      expect(formatNumber(1234.56, 2, 'fr-FR')).toBe('1 234,56');
    });

    it('should handle edge cases', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
      expect(formatNumber('')).toBe('0');
      expect(formatNumber('invalid')).toBe('0');
    });

    it('should handle very large numbers', () => {
      expect(formatNumber(1000000000)).toBe('1,000,000,000');
      expect(formatNumber(999999999999)).toBe('999,999,999,999');
    });

    it('should handle floating point precision', () => {
      expect(formatNumber(0.1 + 0.2, 2)).toBe('0.30'); // Handles floating point precision issues
      expect(formatNumber(1.005, 2)).toBe('1.01'); // Proper rounding
    });
  });

  describe('integration tests', () => {
    it('should format and parse currency consistently', () => {
      const originalValue = 1234.56;
      const formatted = formatCurrency(originalValue);
      const parsed = parseCurrency(formatted);
      
      expect(parsed).toBe(originalValue);
    });

    it('should handle round-trip conversions', () => {
      const testValues = [0, 0.01, 1, 1234.56, -1234.56, 999999.99];
      
      testValues.forEach(value => {
        const formatted = formatCurrency(value);
        const parsed = parseCurrency(formatted);
        expect(parsed).toBe(value);
      });
    });

    it('should maintain precision in calculations', () => {
      const price = 19.99;
      const quantity = 3;
      const total = price * quantity;
      
      const formattedTotal = formatCurrency(total);
      const parsedTotal = parseCurrency(formattedTotal);
      
      expect(parsedTotal).toBe(59.97);
    });
  });
});