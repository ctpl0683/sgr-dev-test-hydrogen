/**
 * Admin API Client for Hydrogen
 * Used for server-side operations that require Admin API access
 * 
 * Required environment variables:
 * - SHOPIFY_ADMIN_API_ACCESS_TOKEN: Admin API access token
 * - PUBLIC_STORE_DOMAIN: Your store domain (e.g., your-store.myshopify.com)
 */

const ADMIN_API_VERSION = '2024-01';

// Store environment context (set by route handlers)
let envContext = null;

/**
 * Set environment context from route handler
 * @param {Object} env - Environment variables from context.env
 */
export function setEnvContext(env) {
  envContext = env;
}

/**
 * Execute a GraphQL query against the Shopify Admin API
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @returns {Promise<Object>} - Query response data
 */
export async function adminApiQuery(query, variables = {}) {
  const storeDomain = envContext?.PUBLIC_STORE_DOMAIN;
  const accessToken = envContext?.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  if (!storeDomain || !accessToken) {
    throw new Error(
      'Missing required environment variables: PUBLIC_STORE_DOMAIN and SHOPIFY_ADMIN_API_ACCESS_TOKEN. Make sure setEnvContext is called first.'
    );
  }

  const endpoint = `https://${storeDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({query, variables}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Admin API error:', errorText);
    throw new Error(`Admin API request failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    console.error('Admin API GraphQL errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'GraphQL query failed');
  }

  return result.data;
}

/**
 * Get customer's wishlist from metafield
 * @param {string} customerId - Customer GID
 * @returns {Promise<string[]>} Array of product GIDs
 */
export async function getCustomerWishlist(customerId) {
  const query = `
    query GetCustomerWishlist($customerId: ID!) {
      customer(id: $customerId) {
        id
        metafield(namespace: "custom", key: "wishlist") {
          id
          value
        }
      }
    }
  `;

  try {
    const data = await adminApiQuery(query, {customerId});
    const metafield = data?.customer?.metafield;

    if (!metafield?.value) {
      return [];
    }

    const productIds = JSON.parse(metafield.value);
    return Array.isArray(productIds) ? productIds : [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

/**
 * Update customer's wishlist metafield
 * @param {string} customerId - Customer GID
 * @param {string[]} productIds - Array of product GIDs
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateCustomerWishlist(customerId, productIds) {
  const mutation = `
    mutation SetCustomerWishlist($customerId: ID!, $wishlistValue: String!) {
      metafieldsSet(metafields: [
        {
          ownerId: $customerId,
          namespace: "custom",
          key: "wishlist",
          type: "list.product_reference",
          value: $wishlistValue
        }
      ]) {
        metafields {
          id
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const wishlistValue = JSON.stringify(productIds);
    const data = await adminApiQuery(mutation, {customerId, wishlistValue});

    const errors = data?.metafieldsSet?.userErrors;
    if (errors && errors.length > 0) {
      return {success: false, error: errors[0].message};
    }

    return {success: true};
  } catch (error) {
    console.error('Error updating wishlist:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Add a product to customer's wishlist
 */
export async function addToWishlist(customerId, productId) {
  const currentWishlist = await getCustomerWishlist(customerId);

  if (currentWishlist.includes(productId)) {
    return {success: true, wishlist: currentWishlist};
  }

  const newWishlist = [...currentWishlist, productId];
  const result = await updateCustomerWishlist(customerId, newWishlist);

  if (!result.success) {
    return {success: false, wishlist: currentWishlist, error: result.error};
  }

  return {success: true, wishlist: newWishlist};
}

/**
 * Remove a product from customer's wishlist
 */
export async function removeFromWishlist(customerId, productId) {
  const currentWishlist = await getCustomerWishlist(customerId);

  if (!currentWishlist.includes(productId)) {
    return {success: true, wishlist: currentWishlist};
  }

  const newWishlist = currentWishlist.filter((id) => id !== productId);
  const result = await updateCustomerWishlist(customerId, newWishlist);

  if (!result.success) {
    return {success: false, wishlist: currentWishlist, error: result.error};
  }

  return {success: true, wishlist: newWishlist};
}

/**
 * Validate product ID format
 */
export function isValidProductId(productId) {
  return productId && typeof productId === 'string' && productId.startsWith('gid://shopify/Product/');
}

/**
 * Validate customer ID format
 */
export function isValidCustomerId(customerId) {
  return customerId && typeof customerId === 'string' && customerId.startsWith('gid://shopify/Customer/');
}
