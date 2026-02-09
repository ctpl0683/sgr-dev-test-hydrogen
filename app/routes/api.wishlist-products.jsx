/**
 * Wishlist Products API Route
 * Fetches product details for wishlist items via Storefront API
 * 
 * POST /api/wishlist-products
 * Body: { productIds: string[] }
 */

import {data} from 'react-router';

/**
 * POST /api/wishlist-products
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return data({success: false, error: 'Method not allowed'}, {status: 405});
  }

  try {
    const body = await request.json();
    const {productIds} = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return data({success: true, products: []});
    }

    // Build query for multiple products
    const {storefront} = context;
    
    // Fetch products by IDs
    const products = await Promise.all(
      productIds.slice(0, 20).map(async (id) => {
        try {
          const result = await storefront.query(PRODUCT_BY_ID_QUERY, {
            variables: {id: `gid://shopify/Product/${id}`},
          });
          return result?.product || null;
        } catch (error) {
          console.error(`Error fetching product ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validProducts = products.filter(Boolean);

    return data({success: true, products: validProducts});
  } catch (error) {
    console.error('Wishlist products fetch error:', error);
    return data({success: false, error: 'Failed to fetch products'}, {status: 500});
  }
}

const PRODUCT_BY_ID_QUERY = `#graphql
  query ProductById($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      vendor
      featuredImage {
        id
        url
        altText
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;
