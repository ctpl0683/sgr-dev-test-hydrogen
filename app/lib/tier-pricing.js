/**
 * ==========================================================================
 * CITY-BASED TIER PRICING UTILITIES
 * ==========================================================================
 * Utilities for calculating and displaying city-based tier pricing
 * Discount is based on TOTAL quantity of items from a city in cart
 * 
 * Example: Buy 3+ items from Bangalore = 10% off all Bangalore items
 */

/**
 * @typedef {Object} TierRule
 * @property {number} minQty - Minimum total quantity from this city
 * @property {number} [maxQty] - Maximum quantity (use Infinity for unlimited)
 * @property {number} discountPercent - Discount percentage for this tier
 * @property {string} [label] - Optional label for the tier
 */

/**
 * @typedef {Object} CityTierConfig
 * @property {string} city - City name (lowercase)
 * @property {TierRule[]} tiers - Array of tier rules sorted by minQty
 */

/**
 * Find the applicable tier for a given quantity
 * @param {TierRule[]} tiers - Array of tier rules
 * @param {number} quantity - Quantity to check
 * @returns {TierRule|null}
 */
export function findApplicableTier(tiers, quantity) {
  if (!tiers?.length || quantity < 1) return null;

  // Sort tiers by minQty ascending
  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  // Find the tier that matches the quantity
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    const tier = sortedTiers[i];
    if (quantity >= tier.minQty) {
      // Check maxQty if defined
      if (tier.maxQty === undefined || tier.maxQty === null || quantity <= tier.maxQty) {
        return tier;
      }
    }
  }

  return null;
}

/**
 * Calculate the discounted price for a given quantity
 * @param {number} originalPrice - Original unit price
 * @param {TierRule[]} tiers - Array of tier rules
 * @param {number} quantity - Quantity
 * @returns {{unitPrice: number, totalPrice: number, savings: number, discountPercent: number, tier: TierRule|null}}
 */
export function calculateTierPrice(originalPrice, tiers, quantity) {
  const tier = findApplicableTier(tiers, quantity);

  if (!tier) {
    return {
      unitPrice: originalPrice,
      totalPrice: originalPrice * quantity,
      savings: 0,
      discountPercent: 0,
      tier: null,
    };
  }

  const discountMultiplier = 1 - tier.discountPercent / 100;
  const unitPrice = originalPrice * discountMultiplier;
  const totalPrice = unitPrice * quantity;
  const originalTotal = originalPrice * quantity;
  const savings = originalTotal - totalPrice;

  return {
    unitPrice,
    totalPrice,
    savings,
    discountPercent: tier.discountPercent,
    tier,
  };
}

/**
 * Generate a tier pricing table for display
 * @param {number} originalPrice - Original unit price
 * @param {TierRule[]} tiers - Array of tier rules
 * @param {string} currencyCode - Currency code (e.g., 'INR')
 * @returns {Array<{minQty: number, maxQty: number|string, unitPrice: number, discountPercent: number, label?: string}>}
 */
export function generateTierTable(originalPrice, tiers, currencyCode = 'INR') {
  if (!tiers?.length) return [];

  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);

  return sortedTiers.map((tier) => {
    const discountMultiplier = 1 - tier.discountPercent / 100;
    const unitPrice = originalPrice * discountMultiplier;

    return {
      minQty: tier.minQty,
      maxQty: tier.maxQty === Infinity || tier.maxQty === null ? '∞' : tier.maxQty,
      unitPrice,
      discountPercent: tier.discountPercent,
      label: tier.label,
      currencyCode,
    };
  });
}

/**
 * Calculate savings preview for different quantities
 * @param {number} originalPrice - Original unit price
 * @param {TierRule[]} tiers - Array of tier rules
 * @param {number[]} quantities - Array of quantities to preview
 * @returns {Array<{quantity: number, unitPrice: number, totalPrice: number, savings: number, discountPercent: number}>}
 */
export function calculateSavingsPreview(originalPrice, tiers, quantities = [1, 5, 10, 25, 50]) {
  return quantities.map((quantity) => {
    const result = calculateTierPrice(originalPrice, tiers, quantity);
    return {
      quantity,
      ...result,
    };
  });
}

/**
 * Parse tier rules from metafield JSON value
 * @param {string|object} value - JSON string or object from metafield
 * @returns {TierRule[]}
 */
export function parseTierRulesFromMetafield(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (!Array.isArray(parsed)) {
      console.warn('Tier rules must be an array');
      return [];
    }

    return parsed
      .filter((rule) => {
        return (
          typeof rule.minQty === 'number' &&
          typeof rule.discountPercent === 'number' &&
          rule.minQty > 0 &&
          rule.discountPercent > 0 &&
          rule.discountPercent <= 100
        );
      })
      .map((rule) => ({
        minQty: rule.minQty,
        maxQty: rule.maxQty ?? Infinity,
        discountPercent: rule.discountPercent,
        label: rule.label || null,
      }))
      .sort((a, b) => a.minQty - b.minQty);
  } catch (e) {
    console.error('Error parsing tier rules:', e);
    return [];
  }
}

/**
 * Get tier rules for a specific city from city tier configs
 * @param {CityTierConfig[]} cityTierConfigs - All city tier configurations
 * @param {string} city - City to get tiers for
 * @returns {TierRule[]|null}
 */
export function getTierRulesForCity(cityTierConfigs, city) {
  if (!cityTierConfigs?.length || !city) return null;

  const config = cityTierConfigs.find(
    (c) => c.city.toLowerCase() === city.toLowerCase()
  );

  return config?.tiers || null;
}

/**
 * Calculate discount for a city based on total cart quantity from that city
 * @param {CityTierConfig[]} cityTierConfigs - All city tier configurations
 * @param {string} city - City name
 * @param {number} totalCityQuantity - Total quantity of items from this city in cart
 * @returns {{discountPercent: number, tier: TierRule|null, message: string}}
 */
export function calculateCityDiscount(cityTierConfigs, city, totalCityQuantity) {
  const tiers = getTierRulesForCity(cityTierConfigs, city);
  
  if (!tiers?.length) {
    return { discountPercent: 0, tier: null, message: '' };
  }

  const tier = findApplicableTier(tiers, totalCityQuantity);

  if (!tier || tier.discountPercent <= 0) {
    return { discountPercent: 0, tier: null, message: '' };
  }

  return {
    discountPercent: tier.discountPercent,
    tier,
    message: `${tier.discountPercent}% off ${totalCityQuantity} items from ${city}`,
  };
}

/**
 * Calculate total quantity per city from cart lines
 * @param {Array<{city: string, quantity: number}>} cartItems - Cart items with city and quantity
 * @returns {Object<string, number>} - Map of city to total quantity
 */
export function calculateCityQuantities(cartItems) {
  const cityQuantities = {};

  for (const item of cartItems) {
    const city = item.city?.toLowerCase();
    if (!city) continue;

    cityQuantities[city] = (cityQuantities[city] || 0) + item.quantity;
  }

  return cityQuantities;
}

/**
 * Format price for display
 * @param {number} amount - Price amount
 * @param {string} currencyCode - Currency code
 * @returns {string}
 */
export function formatPrice(amount, currencyCode = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Example city tier pricing configuration
 */
export const EXAMPLE_CITY_TIER_CONFIGS = [
  {
    city: 'bangalore',
    tiers: [
      {minQty: 3, maxQty: 5, discountPercent: 10, label: '3-5 items'},
      {minQty: 6, maxQty: 10, discountPercent: 15, label: '6-10 items'},
      {minQty: 11, discountPercent: 20, label: '11+ items'},
    ],
  },
  {
    city: 'mumbai',
    tiers: [
      {minQty: 3, maxQty: 5, discountPercent: 20, label: '3-5 items'},
      {minQty: 6, maxQty: 10, discountPercent: 25, label: '6-10 items'},
      {minQty: 11, discountPercent: 30, label: '11+ items'},
    ],
  },
  {
    city: 'chennai',
    tiers: [
      {minQty: 3, maxQty: 5, discountPercent: 12, label: '3-5 items'},
      {minQty: 6, maxQty: 10, discountPercent: 18, label: '6-10 items'},
      {minQty: 11, discountPercent: 22, label: '11+ items'},
    ],
  },
  {
    city: 'delhi',
    tiers: [
      {minQty: 3, maxQty: 5, discountPercent: 8, label: '3-5 items'},
      {minQty: 6, maxQty: 10, discountPercent: 12, label: '6-10 items'},
      {minQty: 11, discountPercent: 18, label: '11+ items'},
    ],
  },
  {
    city: 'hyderabad',
    tiers: [
      {minQty: 3, maxQty: 5, discountPercent: 15, label: '3-5 items'},
      {minQty: 6, maxQty: 10, discountPercent: 20, label: '6-10 items'},
      {minQty: 11, discountPercent: 25, label: '11+ items'},
    ],
  },
];

/**
 * For backward compatibility - deprecated
 * @deprecated Use EXAMPLE_CITY_TIER_CONFIGS instead
 */
export const EXAMPLE_TIER_RULES = EXAMPLE_CITY_TIER_CONFIGS[0].tiers;
