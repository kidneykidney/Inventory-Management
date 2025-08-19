/**
 * Currency formatter utilities
 * Provides functions to format numbers as Indian Rupees
 */

/**
 * Format a number as Indian Rupees (INR)
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to include the ₹ symbol
 * @returns {string} Formatted currency string
 */
export const formatINR = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  // Convert to number if string
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  // Format with INR locale and currency
  const formatter = new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numericAmount);
};

/**
 * Parse an Indian Rupee string to number
 * @param {string} amountStr - Amount string to parse
 * @returns {number} Parsed numeric amount
 */
export const parseINR = amountStr => {
  if (!amountStr || typeof amountStr !== 'string') {
    return 0;
  }

  // Remove currency symbol, commas and other non-numeric characters except decimal point
  const cleanedString = amountStr.replace(/[^\d.-]/g, '');
  return parseFloat(cleanedString) || 0;
};
