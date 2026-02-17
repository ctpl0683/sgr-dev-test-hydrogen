import {useEffect, useRef} from 'react';

/**
 * Yotpo Reviews Widget Component
 * Displays the main reviews widget on product pages
 * 
 * @param {{
 *   product: {
 *     id: string;
 *     title: string;
 *     handle: string;
 *     description?: string;
 *     featuredImage?: {url: string};
 *     priceRange?: {minVariantPrice: {amount: string; currencyCode: string}};
 *   };
 *   shopUrl?: string;
 * }} props
 */
export function YotpoReviewsWidget({product, shopUrl = ''}) {
  const widgetRef = useRef(null);
  
  // Extract numeric product ID from Shopify GID
  const productId = extractProductId(product.id);
  const productUrl = `${shopUrl}/products/${product.handle}`;
  const imageUrl = product.featuredImage?.url || '';
  const price = product.priceRange?.minVariantPrice?.amount || '0';
  const currency = product.priceRange?.minVariantPrice?.currencyCode || 'USD';
  const description = product.description || '';

  // Reinitialize Yotpo widgets after component mounts (for client-side navigation)
  useEffect(() => {
    const initYotpo = () => {
      if (typeof window !== 'undefined') {
        // Try multiple Yotpo initialization methods
        if (window.yotpo) {
          window.yotpo.refreshWidgets();
        }
        // Alternative: Yotpo V3 API
        if (window.Yotpo && window.Yotpo.API) {
          window.Yotpo.API('refreshWidgets');
        }
      }
    };

    // Try immediately
    initYotpo();
    
    // Also try after delays to handle async script loading
    const timer1 = setTimeout(initYotpo, 500);
    const timer2 = setTimeout(initYotpo, 1500);
    const timer3 = setTimeout(initYotpo, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [productId]);

  return (
    <div className="yotpo-reviews-widget" ref={widgetRef}>
      <div
        className="yotpo-widget-instance"
        data-yotpo-instance-id="1286083"
        data-yotpo-product-id={productId}
        data-yotpo-name={product.title}
        data-yotpo-url={productUrl}
        data-yotpo-image-url={imageUrl}
        data-yotpo-price={price}
        data-yotpo-currency={currency}
        data-yotpo-description={product.description || ''}
      />
    </div>
  );
}

/**
 * Yotpo Star Rating Component
 * Displays average star rating near product title
 * 
 * @param {{
 *   product: {
 *     id: string;
 *     title: string;
 *     handle: string;
 *   };
 *   shopUrl?: string;
 * }} props
 */
export function YotpoStarRating({product, shopUrl = ''}) {
  const productId = extractProductId(product.id);
  const productUrl = `${shopUrl}/products/${product.handle}`;

  // Reinitialize Yotpo widgets after component mounts
  useEffect(() => {
    const initYotpo = () => {
      if (typeof window !== 'undefined') {
        if (window.yotpo) {
          window.yotpo.refreshWidgets();
        }
        if (window.Yotpo && window.Yotpo.API) {
          window.Yotpo.API('refreshWidgets');
        }
      }
    };

    initYotpo();
    const timer1 = setTimeout(initYotpo, 500);
    const timer2 = setTimeout(initYotpo, 1500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [productId]);

  return (
    <div className="yotpo-star-rating">
      <div
        className="yotpo-widget-instance"
        data-yotpo-instance-id="1286083"
        data-yotpo-product-id={productId}
        data-yotpo-name={product.title}
        data-yotpo-url={productUrl}
      />
    </div>
  );
}

/**
 * Extract numeric product ID from Shopify GID
 * @param {string} gid - Shopify GID (e.g., "gid://shopify/Product/123456")
 * @returns {string} - Numeric product ID
 */
function extractProductId(gid) {
  if (!gid) return '';
  const match = gid.match(/\/Product\/(\d+)/);
  return match ? match[1] : gid;
}

/**
 * Escape HTML entities for safe attribute values
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Encode image URL for Yotpo (handles special characters)
 * @param {string} url - Image URL
 * @returns {string} - Encoded URL
 */
function encodeImageUrl(url) {
  if (!url) return '';
  return url
    .replace(/\?/g, '%3F')
    .replace(/&/g, '%26');
}

export default YotpoReviewsWidget;
