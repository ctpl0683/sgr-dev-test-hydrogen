/**
 * Yotpo Reviews API Service
 * Server-side functions for interacting with Yotpo Reviews API
 */

const YOTPO_API_URL = 'https://api.yotpo.com';
const YOTPO_CDN_URL = 'https://api-cdn.yotpo.com';

let envContext = null;

/**
 * Set environment context for API calls
 * @param {object} env - Environment variables from context
 */
export function setYotpoEnvContext(env) {
  envContext = env;
}

/**
 * Get Yotpo credentials from environment
 */
function getCredentials() {
  const appKey = envContext?.YOTPO_APP_KEY || process.env.YOTPO_APP_KEY;
  const secretKey = envContext?.YOTPO_SECRET_KEY || process.env.YOTPO_SECRET_KEY;
  const accountId = envContext?.YOTPO_ACCOUNT_ID || process.env.YOTPO_ACCOUNT_ID;

  if (!appKey || !secretKey) {
    throw new Error('Yotpo API credentials not configured');
  }

  return { appKey, secretKey, accountId };
}

/**
 * Get Yotpo access token for authenticated requests
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  const { appKey, secretKey } = getCredentials();

  const response = await fetch(`${YOTPO_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: appKey,
      client_secret: secretKey,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Yotpo authentication failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Retrieve reviews for a specific product
 * @param {string} productId - The product ID (Shopify product ID)
 * @param {object} options - Query options
 * @returns {Promise<object>} Reviews data
 */
export async function getProductReviews(productId, options = {}) {
  const { appKey } = getCredentials();
  const {
    page = 1,
    perPage = 10,
    sort = 'date',
    direction = 'desc',
    star = null,
  } = options;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    sort,
    direction,
  });

  if (star) {
    params.append('star', String(star));
  }

  const url = `${YOTPO_CDN_URL}/v1/widget/${appKey}/products/${productId}/reviews.json?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch reviews: ${error.status?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Get bottom line (total reviews and average score) for a product
 * @param {string} productId - The product ID
 * @returns {Promise<object>} Bottom line data
 */
export async function getProductBottomLine(productId) {
  const { appKey } = getCredentials();

  const url = `${YOTPO_CDN_URL}/v1/widget/${appKey}/products/${productId}/reviews.json?per_page=1`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return {
      totalReviews: 0,
      averageScore: 0,
      starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const data = await response.json();
  const bottomline = data.response?.bottomline || {};

  return {
    totalReviews: bottomline.total_review || 0,
    averageScore: bottomline.average_score || 0,
    starDistribution: bottomline.star_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
}

/**
 * Create a new review
 * @param {object} reviewData - Review data
 * @returns {Promise<object>} Created review response
 */
export async function createReview(reviewData) {
  const { appKey } = getCredentials();

  const {
    productId,
    productTitle,
    productUrl,
    productImageUrl,
    productDescription,
    reviewerName,
    reviewerEmail,
    reviewTitle,
    reviewContent,
    reviewScore,
  } = reviewData;

  const payload = {
    appkey: appKey,
    domain: envContext?.PUBLIC_STORE_DOMAIN || process.env.PUBLIC_STORE_DOMAIN,
    sku: productId,
    product_title: productTitle,
    product_url: productUrl,
    product_image_url: productImageUrl || '',
    product_description: productDescription || '',
    display_name: reviewerName,
    email: reviewerEmail,
    review_title: reviewTitle,
    review_content: reviewContent,
    review_score: reviewScore,
  };

  const response = await fetch(`${YOTPO_API_URL}/v1/widget/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create review: ${error.status?.message || response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Vote on a review (upvote or downvote)
 * @param {string} reviewId - The review ID
 * @param {string} voteType - 'up' or 'down'
 * @returns {Promise<object>} Vote response
 */
export async function voteOnReview(reviewId, voteType) {
  const { appKey } = getCredentials();

  const url = `${YOTPO_API_URL}/reviews/${reviewId}/vote/${voteType}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      appkey: appKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to vote on review: ${error.status?.message || response.statusText}`);
  }

  return response.json();
}
