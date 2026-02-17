import {useEffect, useRef} from 'react';

// Yotpo App Key
const YOTPO_APP_KEY = '1286083';

/**
 * Load Yotpo script dynamically
 * This avoids CSP issues by loading the script via DOM manipulation
 */
function loadYotpoScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  
  // Check if already loaded
  if (window.yotpo || document.querySelector(`script[src*="yotpo.com/${YOTPO_APP_KEY}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://staticw2.yotpo.com/${YOTPO_APP_KEY}/widget.js`;
    script.async = true;
    script.onload = resolve;
    script.onerror = resolve; // Resolve anyway to not block
    document.head.appendChild(script);
  });
}

/**
 * Initialize Yotpo widgets using their AJAX method
 */
function initYotpoWidgets() {
  if (typeof window === 'undefined') return;
  
  // New widgets API (recommended by Yotpo)
  if (window.yotpoWidgetsContainer && typeof window.yotpoWidgetsContainer.initWidgets === 'function') {
    window.yotpoWidgetsContainer.initWidgets();
    return;
  }
  
  // Legacy widgets API
  if (window.yotpo && typeof window.yotpo.initWidgets === 'function') {
    window.yotpo.initWidgets();
    return;
  }
  
  // Alternative refresh method
  if (window.yotpo && typeof window.yotpo.refreshWidgets === 'function') {
    window.yotpo.refreshWidgets();
  }
}

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

  // Load Yotpo script and initialize widgets
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      await loadYotpoScript();
      
      if (!mounted) return;
      
      // Wait for script to initialize
      const tryInit = () => {
        if (window.yotpo || window.yotpoWidgetsContainer) {
          initYotpoWidgets();
        }
      };
      
      // Try multiple times with delays
      tryInit();
      setTimeout(tryInit, 500);
      setTimeout(tryInit, 1500);
      setTimeout(tryInit, 3000);
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [productId]);

  return (
    <div className="yotpo-reviews-widget" ref={widgetRef}>
      <div
        className="yotpo-widget-instance"
        data-yotpo-instance-id={YOTPO_APP_KEY}
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

  // Load Yotpo script and initialize widgets
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      await loadYotpoScript();
      
      if (!mounted) return;
      
      // Try multiple times with delays
      const tryInit = () => {
        if (window.yotpo || window.yotpoWidgetsContainer) {
          initYotpoWidgets();
        }
      };
      
      tryInit();
      setTimeout(tryInit, 500);
      setTimeout(tryInit, 1500);
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, [productId]);

  return (
    <div className="yotpo-star-rating">
      <div
        className="yotpo-widget-instance"
        data-yotpo-instance-id={YOTPO_APP_KEY}
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
