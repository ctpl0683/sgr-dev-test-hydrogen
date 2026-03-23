import {useMemo} from 'react';
import {useCity} from '~/context/CityContext';
import {Tag, TrendingUp, Gift} from 'lucide-react';

/**
 * ==========================================================================
 * CART DISCOUNT PREVIEW
 * ==========================================================================
 * Shows potential city-based tier discounts in cart drawer/cart page
 * Helps shoppers understand bulk discount opportunities
 */

// Default city tier rules (should match Shopify Function configuration)
const DEFAULT_CITY_TIER_RULES = [
  {
    city: 'bangalore',
    tiers: [
      {minQty: 3, discountPercent: 10},
      {minQty: 6, discountPercent: 15},
      {minQty: 11, discountPercent: 20},
    ],
  },
  {
    city: 'mumbai',
    tiers: [
      {minQty: 3, discountPercent: 20},
      {minQty: 6, discountPercent: 25},
      {minQty: 11, discountPercent: 30},
    ],
  },
  {
    city: 'chennai',
    tiers: [
      {minQty: 3, discountPercent: 12},
      {minQty: 6, discountPercent: 18},
      {minQty: 11, discountPercent: 22},
    ],
  },
  {
    city: 'delhi',
    tiers: [
      {minQty: 3, discountPercent: 8},
      {minQty: 6, discountPercent: 12},
      {minQty: 11, discountPercent: 18},
    ],
  },
  {
    city: 'hyderabad',
    tiers: [
      {minQty: 3, discountPercent: 15},
      {minQty: 6, discountPercent: 20},
      {minQty: 11, discountPercent: 25},
    ],
  },
];

/**
 * Calculate discount info for cart items
 * @param {Array} cartLines - Cart lines with city attribute
 * @param {Array} cityTierRules - City tier rules
 * @returns {Object} - Discount info per city
 */
function calculateCartDiscounts(cartLines, cityTierRules) {
  // Group items by city
  const cityQuantities = {};
  
  for (const line of cartLines) {
    const cityAttr = line.attributes?.find(a => a.key === 'selected_city');
    const city = cityAttr?.value?.toLowerCase();
    
    if (!city) continue;
    
    if (!cityQuantities[city]) {
      cityQuantities[city] = {
        totalQty: 0,
        totalAmount: 0,
        lines: [],
      };
    }
    
    cityQuantities[city].totalQty += line.quantity;
    cityQuantities[city].totalAmount += parseFloat(line.cost?.totalAmount?.amount || 0);
    cityQuantities[city].lines.push(line);
  }

  // Calculate discounts for each city
  const discounts = {};
  
  for (const [city, data] of Object.entries(cityQuantities)) {
    const cityConfig = cityTierRules.find(c => c.city.toLowerCase() === city);
    
    if (!cityConfig) continue;
    
    // Find current tier
    const currentTier = cityConfig.tiers
      .filter(t => t.minQty <= data.totalQty)
      .sort((a, b) => b.minQty - a.minQty)[0];
    
    // Find next tier
    const nextTier = cityConfig.tiers
      .filter(t => t.minQty > data.totalQty)
      .sort((a, b) => a.minQty - b.minQty)[0];
    
    discounts[city] = {
      ...data,
      currentTier,
      nextTier,
      itemsToNextTier: nextTier ? nextTier.minQty - data.totalQty : null,
      currentDiscount: currentTier?.discountPercent || 0,
      nextDiscount: nextTier?.discountPercent || null,
      savings: currentTier 
        ? (data.totalAmount * currentTier.discountPercent / 100)
        : 0,
    };
  }
  
  return discounts;
}

/**
 * Cart Discount Preview Component
 * Shows current discounts and next tier opportunities
 */
export function CartDiscountPreview({
  cartLines = [],
  cityTierRules = DEFAULT_CITY_TIER_RULES,
  showNextTierHint = true,
}) {
  const {getCityLabel} = useCity();
  
  const discounts = useMemo(() => 
    calculateCartDiscounts(cartLines, cityTierRules),
    [cartLines, cityTierRules]
  );
  
  const hasDiscounts = Object.values(discounts).some(d => d.currentDiscount > 0);
  const hasNextTierOpportunity = Object.values(discounts).some(d => d.nextTier);
  
  if (Object.keys(discounts).length === 0) {
    return null;
  }
  
  return (
    <div className="cart-discount-preview">
      {/* Current Discounts */}
      {hasDiscounts && (
        <div className="cart-discount-preview__active">
          <div className="cart-discount-preview__header">
            <Tag size={16} />
            <span>City Bulk Discounts Applied</span>
          </div>
          
          {Object.entries(discounts).map(([city, data]) => (
            data.currentDiscount > 0 && (
              <div key={city} className="cart-discount-preview__item">
                <span className="cart-discount-preview__city">
                  {capitalize(city)}
                </span>
                <span className="cart-discount-preview__discount">
                  {data.currentDiscount}% off ({data.totalQty} items)
                </span>
                <span className="cart-discount-preview__savings">
                  Save ₹{data.savings.toFixed(0)}
                </span>
              </div>
            )
          ))}
        </div>
      )}
      
      {/* Next Tier Hints */}
      {showNextTierHint && hasNextTierOpportunity && (
        <div className="cart-discount-preview__next-tier">
          <div className="cart-discount-preview__header cart-discount-preview__header--hint">
            <TrendingUp size={16} />
            <span>Unlock More Savings</span>
          </div>
          
          {Object.entries(discounts).map(([city, data]) => (
            data.nextTier && (
              <div key={city} className="cart-discount-preview__hint">
                <Gift size={14} />
                <span>
                  Add <strong>{data.itemsToNextTier} more</strong> from {capitalize(city)} 
                  to get <strong>{data.nextDiscount}% off</strong>
                </span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for cart drawer
 */
export function CartDiscountBadge({cartLines = [], cityTierRules = DEFAULT_CITY_TIER_RULES}) {
  const discounts = useMemo(() => 
    calculateCartDiscounts(cartLines, cityTierRules),
    [cartLines, cityTierRules]
  );
  
  const totalSavings = Object.values(discounts).reduce(
    (sum, d) => sum + d.savings, 0
  );
  
  if (totalSavings <= 0) {
    return null;
  }
  
  return (
    <div className="cart-discount-badge">
      <Tag size={14} />
      <span>Bulk discount: Save ₹{totalSavings.toFixed(0)}</span>
    </div>
  );
}

/**
 * Mini hint for product cards
 */
export function BulkDiscountHint({city, cityTierRules = DEFAULT_CITY_TIER_RULES}) {
  const cityConfig = cityTierRules.find(
    c => c.city.toLowerCase() === city?.toLowerCase()
  );
  
  if (!cityConfig?.tiers?.length) {
    return null;
  }
  
  const firstTier = cityConfig.tiers[0];
  
  return (
    <div className="bulk-discount-hint">
      <Gift size={12} />
      <span>Buy {firstTier.minQty}+ for {firstTier.discountPercent}% off</span>
    </div>
  );
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export {calculateCartDiscounts, DEFAULT_CITY_TIER_RULES};
