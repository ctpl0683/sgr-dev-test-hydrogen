import {useState, useEffect} from 'react';
import {useFetcher} from 'react-router';

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
 * Star Rating Display Component
 */
function StarRating({rating, size = 'md', showNumber = false}) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className="yotpo-star-rating-display">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className={`yotpo-star yotpo-star--filled ${sizeClasses[size]}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {hasHalfStar && (
        <svg className={`yotpo-star yotpo-star--half ${sizeClasses[size]}`} viewBox="0 0 24 24">
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <path fill="url(#halfGradient)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className={`yotpo-star yotpo-star--empty ${sizeClasses[size]}`} viewBox="0 0 24 24" fill="#e0e0e0">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      {showNumber && <span className="yotpo-rating-number">{rating.toFixed(1)}</span>}
    </div>
  );
}

/**
 * Interactive Star Rating Input Component
 */
function StarRatingInput({value, onChange}) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="yotpo-star-rating-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`yotpo-star-btn ${star <= (hoverValue || value) ? 'active' : ''}`}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} stars`}
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill={star <= (hoverValue || value) ? 'currentColor' : '#e0e0e0'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/**
 * Single Review Card Component
 */
function ReviewCard({review}) {
  const fetcher = useFetcher();
  const [votes, setVotes] = useState({
    up: review.votes_up || 0,
    down: review.votes_down || 0,
  });

  const handleVote = (voteType) => {
    fetcher.submit(
      {
        intent: 'vote',
        reviewId: review.id,
        voteType,
      },
      {method: 'POST', action: '/api/reviews'}
    );
    setVotes((prev) => ({
      ...prev,
      [voteType === 'up' ? 'up' : 'down']: prev[voteType === 'up' ? 'up' : 'down'] + 1,
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="yotpo-review-card">
      <div className="yotpo-review-header">
        <div className="yotpo-review-author">
          <div className="yotpo-review-avatar">
            {review.user?.social_image ? (
              <img src={review.user.social_image} alt={review.user.display_name} />
            ) : (
              <span>{review.user?.display_name?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className="yotpo-review-author-info">
            <span className="yotpo-review-author-name">{review.user?.display_name || 'Anonymous'}</span>
            {review.verified_buyer && (
              <span className="yotpo-verified-badge">Verified Buyer</span>
            )}
          </div>
        </div>
        <div className="yotpo-review-meta">
          <StarRating rating={review.score} size="sm" />
          <span className="yotpo-review-date">{formatDate(review.created_at)}</span>
        </div>
      </div>

      {review.title && <h4 className="yotpo-review-title">{review.title}</h4>}
      <p className="yotpo-review-content">{review.content}</p>

      {review.images_data && review.images_data.length > 0 && (
        <div className="yotpo-review-images">
          {review.images_data.map((image) => (
            <img
              key={image.id}
              src={image.thumb_url}
              alt="Review image"
              className="yotpo-review-image"
              onClick={() => window.open(image.original_url, '_blank')}
            />
          ))}
        </div>
      )}

      {review.comment && (
        <div className="yotpo-review-reply">
          <strong>Store Response:</strong>
          <p>{review.comment.content}</p>
        </div>
      )}

      <div className="yotpo-review-actions">
        <span className="yotpo-helpful-text">Was this review helpful?</span>
        <button
          type="button"
          className="yotpo-vote-btn"
          onClick={() => handleVote('up')}
          disabled={fetcher.state !== 'idle'}
        >
          👍 {votes.up}
        </button>
        <button
          type="button"
          className="yotpo-vote-btn"
          onClick={() => handleVote('down')}
          disabled={fetcher.state !== 'idle'}
        >
          👎 {votes.down}
        </button>
      </div>
    </div>
  );
}

/**
 * Write Review Form Component
 */
function WriteReviewForm({product, onSuccess, onCancel}) {
  const fetcher = useFetcher();
  const [rating, setRating] = useState(0);
  const [formData, setFormData] = useState({
    reviewerName: '',
    reviewerEmail: '',
    reviewTitle: '',
    reviewContent: '',
  });
  const [errors, setErrors] = useState({});

  const productId = extractProductId(product.id);
  const productUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (fetcher.data?.success) {
      onSuccess?.();
    }
  }, [fetcher.data, onSuccess]);

  const handleChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors((prev) => ({...prev, [name]: null}));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!rating) newErrors.rating = 'Please select a rating';
    if (!formData.reviewerName.trim()) newErrors.reviewerName = 'Name is required';
    if (!formData.reviewerEmail.trim()) newErrors.reviewerEmail = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reviewerEmail)) {
      newErrors.reviewerEmail = 'Please enter a valid email';
    }
    if (!formData.reviewTitle.trim()) newErrors.reviewTitle = 'Title is required';
    if (!formData.reviewContent.trim()) newErrors.reviewContent = 'Review content is required';
    if (formData.reviewContent.trim().length < 10) {
      newErrors.reviewContent = 'Review must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    fetcher.submit(
      {
        productId,
        productTitle: product.title,
        productUrl,
        productImageUrl: product.featuredImage?.url || '',
        productDescription: product.description || '',
        reviewerName: formData.reviewerName,
        reviewerEmail: formData.reviewerEmail,
        reviewTitle: formData.reviewTitle,
        reviewContent: formData.reviewContent,
        reviewScore: rating,
      },
      {method: 'POST', action: '/api/reviews'}
    );
  };

  const isSubmitting = fetcher.state !== 'idle';

  return (
    <form className="yotpo-write-review-form" onSubmit={handleSubmit}>
      <h3 className="yotpo-form-title">Write a Review</h3>

      {fetcher.data?.error && (
        <div className="yotpo-form-error-message">{fetcher.data.error}</div>
      )}

      {fetcher.data?.success && (
        <div className="yotpo-form-success-message">
          Thank you for your review! It will be published after verification.
        </div>
      )}

      <div className="yotpo-form-group">
        <label className="yotpo-form-label">Rating *</label>
        <StarRatingInput value={rating} onChange={setRating} />
        {errors.rating && <span className="yotpo-form-error">{errors.rating}</span>}
      </div>

      <div className="yotpo-form-row">
        <div className="yotpo-form-group">
          <label className="yotpo-form-label" htmlFor="reviewerName">Name *</label>
          <input
            type="text"
            id="reviewerName"
            name="reviewerName"
            value={formData.reviewerName}
            onChange={handleChange}
            className={`yotpo-form-input ${errors.reviewerName ? 'error' : ''}`}
            placeholder="Your name"
          />
          {errors.reviewerName && <span className="yotpo-form-error">{errors.reviewerName}</span>}
        </div>

        <div className="yotpo-form-group">
          <label className="yotpo-form-label" htmlFor="reviewerEmail">Email *</label>
          <input
            type="email"
            id="reviewerEmail"
            name="reviewerEmail"
            value={formData.reviewerEmail}
            onChange={handleChange}
            className={`yotpo-form-input ${errors.reviewerEmail ? 'error' : ''}`}
            placeholder="your@email.com"
          />
          {errors.reviewerEmail && <span className="yotpo-form-error">{errors.reviewerEmail}</span>}
        </div>
      </div>

      <div className="yotpo-form-group">
        <label className="yotpo-form-label" htmlFor="reviewTitle">Review Title *</label>
        <input
          type="text"
          id="reviewTitle"
          name="reviewTitle"
          value={formData.reviewTitle}
          onChange={handleChange}
          className={`yotpo-form-input ${errors.reviewTitle ? 'error' : ''}`}
          placeholder="Summarize your experience"
        />
        {errors.reviewTitle && <span className="yotpo-form-error">{errors.reviewTitle}</span>}
      </div>

      <div className="yotpo-form-group">
        <label className="yotpo-form-label" htmlFor="reviewContent">Your Review *</label>
        <textarea
          id="reviewContent"
          name="reviewContent"
          value={formData.reviewContent}
          onChange={handleChange}
          className={`yotpo-form-textarea ${errors.reviewContent ? 'error' : ''}`}
          placeholder="Share your experience with this product..."
          rows={5}
        />
        {errors.reviewContent && <span className="yotpo-form-error">{errors.reviewContent}</span>}
      </div>

      <div className="yotpo-form-actions">
        {onCancel && (
          <button type="button" className="yotpo-btn yotpo-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="yotpo-btn yotpo-btn--primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

/**
 * Star Rating Summary Component (for product pages)
 */
export function YotpoStarRatingSummary({product}) {
  const [bottomLine, setBottomLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const productId = extractProductId(product.id);

  useEffect(() => {
    if (!productId) return;

    fetch(`/api/reviews?productId=${productId}&bottomLineOnly=true`)
      .then((res) => res.json())
      .then((data) => {
        setBottomLine(data.bottomLine);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  if (loading || !bottomLine) {
    return null;
  }

  if (bottomLine.totalReviews === 0) {
    return (
      <div className="yotpo-star-summary yotpo-star-summary--empty">
        <StarRating rating={0} size="sm" />
        <span className="yotpo-review-count">No reviews yet</span>
      </div>
    );
  }

  return (
    <div className="yotpo-star-summary">
      <StarRating rating={bottomLine.averageScore} size="sm" showNumber />
      <span className="yotpo-review-count">
        ({bottomLine.totalReviews} {bottomLine.totalReviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
}

/**
 * Main Reviews Widget Component
 */
export function YotpoReviewsWidget({product}) {
  const [reviews, setReviews] = useState([]);
  const [bottomLine, setBottomLine] = useState(null);
  const [pagination, setPagination] = useState({page: 1, per_page: 10, total: 0});
  const [loading, setLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [filterStar, setFilterStar] = useState(null);

  const productId = extractProductId(product.id);

  const fetchReviews = async (page = 1, sort = sortBy, star = filterStar) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        page: String(page),
        perPage: '10',
        sort,
        direction: 'desc',
      });
      if (star) params.append('star', String(star));

      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();

      setReviews(data.reviews || []);
      setBottomLine(data.bottomLine);
      setPagination(data.pagination || {page: 1, per_page: 10, total: 0});
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    fetchReviews(1, newSort, filterStar);
  };

  const handleFilterChange = (star) => {
    setFilterStar(star === filterStar ? null : star);
    fetchReviews(1, sortBy, star === filterStar ? null : star);
  };

  const handlePageChange = (newPage) => {
    fetchReviews(newPage, sortBy, filterStar);
  };

  const handleReviewSuccess = () => {
    setShowWriteReview(false);
    fetchReviews(1);
  };

  const totalPages = Math.ceil((pagination.total || 0) / (pagination.per_page || 10));

  return (
    <div className="yotpo-reviews-widget">
      <div className="yotpo-reviews-header">
        <h2 className="yotpo-reviews-title">Customer Reviews</h2>
        {bottomLine && (
          <div className="yotpo-reviews-summary">
            <div className="yotpo-summary-score">
              <span className="yotpo-score-number">{bottomLine.averageScore?.toFixed(1) || '0.0'}</span>
              <StarRating rating={bottomLine.averageScore || 0} size="lg" />
              <span className="yotpo-total-reviews">
                Based on {bottomLine.totalReviews || 0} {bottomLine.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            {bottomLine.starDistribution && (
              <div className="yotpo-star-distribution">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = bottomLine.starDistribution[star] || 0;
                  const percentage = bottomLine.totalReviews > 0
                    ? (count / bottomLine.totalReviews) * 100
                    : 0;
                  return (
                    <button
                      key={star}
                      className={`yotpo-distribution-row ${filterStar === star ? 'active' : ''}`}
                      onClick={() => handleFilterChange(star)}
                    >
                      <span className="yotpo-distribution-star">{star} ★</span>
                      <div className="yotpo-distribution-bar">
                        <div
                          className="yotpo-distribution-fill"
                          style={{width: `${percentage}%`}}
                        />
                      </div>
                      <span className="yotpo-distribution-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="yotpo-reviews-actions">
        <button
          className="yotpo-btn yotpo-btn--primary"
          onClick={() => setShowWriteReview(true)}
        >
          Write a Review
        </button>

        <div className="yotpo-sort-select">
          <label htmlFor="sort-reviews">Sort by:</label>
          <select
            id="sort-reviews"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="votes_up">Most Helpful</option>
          </select>
        </div>
      </div>

      {showWriteReview && (
        <WriteReviewForm
          product={product}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowWriteReview(false)}
        />
      )}

      {loading ? (
        <div className="yotpo-loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="yotpo-no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
          {!showWriteReview && (
            <button
              className="yotpo-btn yotpo-btn--primary"
              onClick={() => setShowWriteReview(true)}
            >
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="yotpo-reviews-list">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="yotpo-pagination">
              <button
                className="yotpo-pagination-btn"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="yotpo-pagination-info">
                Page {pagination.page} of {totalPages}
              </span>
              <button
                className="yotpo-pagination-btn"
                disabled={pagination.page >= totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
