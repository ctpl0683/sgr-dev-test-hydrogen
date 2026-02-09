/**
 * Wishlist API Client
 * Functions to interact with the internal Hydrogen /api/wishlist route
 * No external server required
 */

/**
 * Fetch customer's wishlist
 * @param {string} customerId - Customer GID
 * @returns {Promise<string[]>} Array of product GIDs
 */
export async function fetchWishlist(customerId) {
  if (!customerId) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/wishlist?customerId=${encodeURIComponent(customerId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch wishlist:', response.status);
      return [];
    }

    const data = await response.json();
    return data.success ? data.wishlist : [];
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
}

/**
 * Add a product to the wishlist
 * @param {string} customerId - Customer GID
 * @param {string} productId - Product GID
 * @returns {Promise<{success: boolean, wishlist?: string[], error?: string}>}
 */
export async function addToWishlist(customerId, productId) {
  if (!customerId || !productId) {
    return {success: false, error: 'Customer ID and Product ID are required'};
  }

  try {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({action: 'add', customerId, productId}),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Remove a product from the wishlist
 * @param {string} customerId - Customer GID
 * @param {string} productId - Product GID
 * @returns {Promise<{success: boolean, wishlist?: string[], error?: string}>}
 */
export async function removeFromWishlist(customerId, productId) {
  if (!customerId || !productId) {
    return {success: false, error: 'Customer ID and Product ID are required'};
  }

  try {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({action: 'remove', customerId, productId}),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Check if a product is in the wishlist
 * @param {string[]} wishlist - Array of product GIDs
 * @param {string} productId - Product GID to check
 * @returns {boolean}
 */
export function isInWishlist(wishlist, productId) {
  if (!wishlist || !Array.isArray(wishlist) || !productId) {
    return false;
  }
  return wishlist.includes(productId);
}
