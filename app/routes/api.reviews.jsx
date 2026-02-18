import {data} from 'react-router';
import {
  setYotpoEnvContext,
  getProductReviews,
  getProductBottomLine,
  createReview,
  voteOnReview,
} from '~/lib/yotpo-api.server';

/**
 * GET /api/reviews?productId=xxx&page=1&perPage=10
 * Fetch reviews for a product
 */
export async function loader({request, context}) {
  setYotpoEnvContext(context.env);

  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const perPage = parseInt(url.searchParams.get('perPage') || '10', 10);
  const sort = url.searchParams.get('sort') || 'date';
  const direction = url.searchParams.get('direction') || 'desc';
  const star = url.searchParams.get('star');
  const bottomLineOnly = url.searchParams.get('bottomLineOnly') === 'true';

  if (!productId) {
    return data({error: 'productId is required'}, {status: 400});
  }

  try {
    if (bottomLineOnly) {
      const bottomLine = await getProductBottomLine(productId);
      return data({bottomLine});
    }

    const reviews = await getProductReviews(productId, {
      page,
      perPage,
      sort,
      direction,
      star: star ? parseInt(star, 10) : null,
    });

    return data({
      reviews: reviews.reviews || [],
      pagination: reviews.pagination || {page: 1, per_page: perPage, total: 0},
      bottomLine: {
        totalReviews: reviews.bottomline?.total_review || 0,
        averageScore: reviews.bottomline?.average_score || 0,
        starDistribution: reviews.bottomline?.star_distribution || {},
      },
      products: reviews.products || [],
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return data({error: error.message}, {status: 500});
  }
}

/**
 * POST /api/reviews
 * Create a new review
 */
export async function action({request, context}) {
  setYotpoEnvContext(context.env);

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'vote') {
    const reviewId = formData.get('reviewId');
    const voteType = formData.get('voteType');

    if (!reviewId || !voteType) {
      return data({error: 'reviewId and voteType are required'}, {status: 400});
    }

    try {
      const result = await voteOnReview(reviewId, voteType);
      return data({success: true, result});
    } catch (error) {
      console.error('Error voting on review:', error);
      return data({error: error.message}, {status: 500});
    }
  }

  // Default: create review
  const productId = formData.get('productId');
  const productTitle = formData.get('productTitle');
  const productUrl = formData.get('productUrl');
  const productImageUrl = formData.get('productImageUrl');
  const productDescription = formData.get('productDescription');
  const reviewerName = formData.get('reviewerName');
  const reviewerEmail = formData.get('reviewerEmail');
  const reviewTitle = formData.get('reviewTitle');
  const reviewContent = formData.get('reviewContent');
  const reviewScore = parseInt(formData.get('reviewScore'), 10);

  if (!productId || !productTitle || !productUrl || !reviewerName || !reviewerEmail || !reviewTitle || !reviewContent || !reviewScore) {
    return data({error: 'Missing required fields'}, {status: 400});
  }

  if (reviewScore < 1 || reviewScore > 5) {
    return data({error: 'Review score must be between 1 and 5'}, {status: 400});
  }

  try {
    const result = await createReview({
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
    });

    return data({success: true, result});
  } catch (error) {
    console.error('Error creating review:', error);
    return data({error: error.message}, {status: 500});
  }
}
