/**
 * Wishlist API Route (Hydrogen Internal)
 * 
 * GET /api/wishlist?customerId=xxx - Get wishlist
 * POST /api/wishlist - Add/remove from wishlist
 */

import {data} from 'react-router';
import {
  getCustomerWishlist,
  addToWishlist,
  removeFromWishlist,
  isValidCustomerId,
  isValidProductId,
  setEnvContext,
} from '~/lib/admin-api.server';

/**
 * GET /api/wishlist
 */
export async function loader({request, context}) {
  // Set environment context for Admin API
  setEnvContext(context.env);

  const url = new URL(request.url);
  const customerId = url.searchParams.get('customerId');

  if (!customerId) {
    return data({success: false, error: 'Customer ID is required'}, {status: 400});
  }

  if (!isValidCustomerId(customerId)) {
    return data({success: false, error: 'Invalid customer ID format'}, {status: 400});
  }

  try {
    const wishlist = await getCustomerWishlist(customerId);
    return data({success: true, wishlist});
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    return data({success: false, error: 'Failed to fetch wishlist'}, {status: 500});
  }
}

/**
 * POST /api/wishlist
 * Body: { action: 'add' | 'remove', customerId: string, productId: string }
 */
export async function action({request, context}) {
  // Set environment context for Admin API
  setEnvContext(context.env);

  if (request.method !== 'POST') {
    return data({success: false, error: 'Method not allowed'}, {status: 405});
  }

  try {
    const body = await request.json();
    const {action: wishlistAction, customerId, productId} = body;

    // Validate action
    if (!wishlistAction || !['add', 'remove'].includes(wishlistAction)) {
      return data({success: false, error: 'Invalid action. Use "add" or "remove"'}, {status: 400});
    }

    // Validate customer ID
    if (!customerId || !isValidCustomerId(customerId)) {
      return data({success: false, error: 'Valid customer ID is required'}, {status: 400});
    }

    // Validate product ID
    if (!productId || !isValidProductId(productId)) {
      return data({success: false, error: 'Valid product ID is required'}, {status: 400});
    }

    // Execute action
    let result;
    if (wishlistAction === 'add') {
      result = await addToWishlist(customerId, productId);
    } else {
      result = await removeFromWishlist(customerId, productId);
    }

    if (!result.success) {
      return data({success: false, error: result.error}, {status: 500});
    }

    return data({success: true, wishlist: result.wishlist});
  } catch (error) {
    console.error('Wishlist action error:', error);
    return data({success: false, error: 'Failed to update wishlist'}, {status: 500});
  }
}
