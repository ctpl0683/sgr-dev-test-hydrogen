import {useEffect} from 'react';

/**
 * Yotpo Conversion Tracking Component
 * Add this to the order confirmation/thank you page to track conversions
 * 
 * @param {{
 *   order: {
 *     id: string;
 *     orderNumber: string;
 *     email: string;
 *     totalPrice: {amount: string; currencyCode: string};
 *     lineItems: Array<{
 *       title: string;
 *       quantity: number;
 *       variant: {
 *         price: {amount: string};
 *         product: {id: string; title: string; handle: string};
 *         image?: {url: string};
 *       };
 *     }>;
 *   };
 *   shopUrl?: string;
 * }} props
 */
export function YotpoConversionTracking({order, shopUrl = ''}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.yotpo) {
      // Track the conversion
      window.yotpo.trackConversion({
        orderId: order.orderNumber || extractOrderId(order.id),
        orderAmount: order.totalPrice?.amount || '0',
        orderCurrency: order.totalPrice?.currencyCode || 'USD',
        email: order.email,
      });
    }
  }, [order]);

  // Build products data for Yotpo
  const products = order.lineItems?.map((item) => {
    const product = item.variant?.product;
    const productId = extractProductId(product?.id);
    
    return {
      productId,
      name: product?.title || item.title,
      url: `${shopUrl}/products/${product?.handle}`,
      image: item.variant?.image?.url || '',
      price: item.variant?.price?.amount || '0',
      quantity: item.quantity,
    };
  }) || [];

  return (
    <div className="yotpo-conversion-tracking" style={{display: 'none'}}>
      {/* Yotpo conversion tracking pixel */}
      <div
        className="yotpo-conversion"
        data-yotpo-order-id={order.orderNumber || extractOrderId(order.id)}
        data-yotpo-order-amount={order.totalPrice?.amount}
        data-yotpo-order-currency={order.totalPrice?.currencyCode}
        data-yotpo-customer-email={order.email}
        data-yotpo-products={JSON.stringify(products)}
      />
    </div>
  );
}

/**
 * Extract numeric order ID from Shopify GID
 * @param {string} gid - Shopify GID
 * @returns {string}
 */
function extractOrderId(gid) {
  if (!gid) return '';
  const match = gid.match(/\/Order\/(\d+)/);
  return match ? match[1] : gid;
}

/**
 * Extract numeric product ID from Shopify GID
 * @param {string} gid - Shopify GID
 * @returns {string}
 */
function extractProductId(gid) {
  if (!gid) return '';
  const match = gid.match(/\/Product\/(\d+)/);
  return match ? match[1] : gid;
}

export default YotpoConversionTracking;
