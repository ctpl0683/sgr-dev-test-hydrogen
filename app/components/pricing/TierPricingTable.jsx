import {useMemo} from 'react';
import {Money} from '@shopify/hydrogen';
import {
  generateTierTable,
  calculateTierPrice,
  formatPrice,
} from '~/lib/tier-pricing';

/**
 * TierPricingTable Component
 * Displays tier pricing breakdown for a product
 * @param {{
 *   originalPrice: number;
 *   tiers: TierRule[];
 *   currencyCode?: string;
 *   currentQuantity?: number;
 *   className?: string;
 * }}
 */
export function TierPricingTable({
  originalPrice,
  tiers,
  currencyCode = 'INR',
  currentQuantity = 1,
  className = '',
}) {
  const tierTable = useMemo(() => {
    return generateTierTable(originalPrice, tiers, currencyCode);
  }, [originalPrice, tiers, currencyCode]);

  if (!tierTable.length) return null;

  return (
    <div className={`tier-pricing-table ${className}`}>
      <h4 className="tier-pricing-table__title">Bulk Pricing</h4>
      <p className="tier-pricing-table__subtitle">
        Save more when you buy more
      </p>
      <table className="tier-pricing-table__table">
        <thead>
          <tr>
            <th>Quantity</th>
            <th>Price per unit</th>
            <th>Discount</th>
          </tr>
        </thead>
        <tbody>
          {tierTable.map((tier, index) => {
            const isActive =
              currentQuantity >= tier.minQty &&
              (tier.maxQty === '∞' || currentQuantity <= tier.maxQty);

            return (
              <tr
                key={index}
                className={isActive ? 'tier-pricing-table__row--active' : ''}
              >
                <td>
                  {tier.minQty}
                  {tier.maxQty !== '∞' ? ` - ${tier.maxQty}` : '+'}
                  {tier.label && (
                    <span className="tier-pricing-table__label">
                      {tier.label}
                    </span>
                  )}
                </td>
                <td className="tier-pricing-table__price">
                  {formatPrice(tier.unitPrice, currencyCode)}
                </td>
                <td className="tier-pricing-table__discount">
                  {tier.discountPercent > 0 ? (
                    <span className="tier-pricing-table__discount-badge">
                      {tier.discountPercent}% OFF
                    </span>
                  ) : (
                    <span className="tier-pricing-table__discount-none">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * SavingsPreview Component
 * Shows potential savings based on quantity
 * @param {{
 *   originalPrice: number;
 *   tiers: TierRule[];
 *   quantity: number;
 *   currencyCode?: string;
 *   className?: string;
 * }}
 */
export function SavingsPreview({
  originalPrice,
  tiers,
  quantity,
  currencyCode = 'INR',
  className = '',
}) {
  const pricing = useMemo(() => {
    return calculateTierPrice(originalPrice, tiers, quantity);
  }, [originalPrice, tiers, quantity]);

  if (!pricing.tier || pricing.savings <= 0) return null;

  return (
    <div className={`savings-preview ${className}`}>
      <div className="savings-preview__badge">
        <span className="savings-preview__percent">
          {pricing.discountPercent}% OFF
        </span>
        <span className="savings-preview__label">Bulk Discount</span>
      </div>
      <div className="savings-preview__details">
        <div className="savings-preview__row">
          <span>Unit Price:</span>
          <span className="savings-preview__value">
            <s className="savings-preview__original">
              {formatPrice(originalPrice, currencyCode)}
            </s>
            {formatPrice(pricing.unitPrice, currencyCode)}
          </span>
        </div>
        <div className="savings-preview__row">
          <span>Total ({quantity} items):</span>
          <span className="savings-preview__value">
            {formatPrice(pricing.totalPrice, currencyCode)}
          </span>
        </div>
        <div className="savings-preview__row savings-preview__row--highlight">
          <span>You Save:</span>
          <span className="savings-preview__savings">
            {formatPrice(pricing.savings, currencyCode)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * TierPricingBadge Component
 * Compact badge showing tier discount
 * @param {{
 *   tiers: TierRule[];
 *   quantity: number;
 *   className?: string;
 * }}
 */
export function TierPricingBadge({tiers, quantity, className = ''}) {
  const pricing = useMemo(() => {
    return calculateTierPrice(100, tiers, quantity); // Use 100 as base to get percentage
  }, [tiers, quantity]);

  if (!pricing.tier || pricing.discountPercent <= 0) return null;

  return (
    <span className={`tier-pricing-badge ${className}`}>
      {pricing.discountPercent}% OFF
      {pricing.tier.label && (
        <span className="tier-pricing-badge__label">{pricing.tier.label}</span>
      )}
    </span>
  );
}

/**
 * NextTierHint Component
 * Shows how many more items needed for next tier
 * @param {{
 *   tiers: TierRule[];
 *   currentQuantity: number;
 *   className?: string;
 * }}
 */
export function NextTierHint({tiers, currentQuantity, className = ''}) {
  const nextTier = useMemo(() => {
    if (!tiers?.length) return null;

    const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
    const currentTierIndex = sortedTiers.findIndex(
      (tier) =>
        currentQuantity >= tier.minQty &&
        (tier.maxQty === Infinity || currentQuantity <= tier.maxQty)
    );

    // Find next tier with higher discount
    for (let i = currentTierIndex + 1; i < sortedTiers.length; i++) {
      if (sortedTiers[i].discountPercent > (sortedTiers[currentTierIndex]?.discountPercent || 0)) {
        return {
          tier: sortedTiers[i],
          itemsNeeded: sortedTiers[i].minQty - currentQuantity,
        };
      }
    }

    return null;
  }, [tiers, currentQuantity]);

  if (!nextTier || nextTier.itemsNeeded <= 0) return null;

  return (
    <div className={`next-tier-hint ${className}`}>
      <span className="next-tier-hint__icon">💡</span>
      <span className="next-tier-hint__text">
        Add <strong>{nextTier.itemsNeeded}</strong> more to get{' '}
        <strong>{nextTier.tier.discountPercent}% off</strong>
        {nextTier.tier.label && ` (${nextTier.tier.label})`}
      </span>
    </div>
  );
}

/** @typedef {import('~/lib/tier-pricing').TierRule} TierRule */
