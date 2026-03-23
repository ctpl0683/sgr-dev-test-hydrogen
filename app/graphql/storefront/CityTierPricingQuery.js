/**
 * GraphQL query to fetch city-based tier pricing rules from metaobject
 * Metaobject type: city_tier_pricing
 * Handle: default
 * 
 * Structure:
 * - Each city has its own tier rules
 * - Discount is based on total quantity of items from that city in cart
 */

export const CITY_TIER_PRICING_QUERY = `#graphql
  query CityTierPricing {
    metaobject(handle: {type: "city_tier_pricing", handle: "default"}) {
      fields {
        key
        value
      }
    }
  }
`;

/**
 * @typedef {Object} CityTierRule
 * @property {number} minQty - Minimum total quantity from this city
 * @property {number} [maxQty] - Maximum quantity (optional)
 * @property {number} discountPercent - Discount percentage
 * @property {string} [label] - Display label
 */

/**
 * @typedef {Object} CityTierConfig
 * @property {string} city - City value (lowercase)
 * @property {CityTierRule[]} tiers - Tier rules for this city
 */

/**
 * Parse city tier pricing from metaobject response
 * @param {object} metaobject - Metaobject response
 * @returns {CityTierConfig[]|null}
 */
export function parseCityTierPricingFromMetaobject(metaobject) {
  if (!metaobject?.fields) return null;

  const rulesField = metaobject.fields.find((f) => f.key === 'city_rules');
  
  if (!rulesField?.value) return null;

  try {
    const parsed = JSON.parse(rulesField.value);
    
    if (!Array.isArray(parsed)) {
      console.warn('City tier rules must be an array');
      return null;
    }

    return parsed
      .filter((config) => config.city && Array.isArray(config.tiers))
      .map((config) => ({
        city: String(config.city).toLowerCase().trim(),
        tiers: config.tiers
          .filter((t) => typeof t.minQty === 'number' && typeof t.discountPercent === 'number')
          .map((t) => ({
            minQty: t.minQty,
            maxQty: t.maxQty ?? null,
            discountPercent: t.discountPercent,
            label: t.label || null,
          }))
          .sort((a, b) => a.minQty - b.minQty),
      }));
  } catch (e) {
    console.error('Error parsing city tier pricing:', e);
    return null;
  }
}

/**
 * Get tier rules for a specific city
 * @param {CityTierConfig[]} cityTierConfigs - All city tier configs
 * @param {string} city - City to get rules for
 * @returns {CityTierRule[]|null}
 */
export function getTierRulesForCity(cityTierConfigs, city) {
  if (!cityTierConfigs?.length || !city) return null;
  
  const config = cityTierConfigs.find(
    (c) => c.city.toLowerCase() === city.toLowerCase()
  );
  
  return config?.tiers || null;
}

/**
 * Example city tier pricing configuration
 */
export const EXAMPLE_CITY_TIER_PRICING = [
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
