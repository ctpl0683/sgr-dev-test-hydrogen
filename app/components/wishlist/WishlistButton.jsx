/**
 * Wishlist Button Component
 * Heart icon button to add/remove products from wishlist
 * Shows login prompt for logged-out users
 */

import {useState} from 'react';
import {Link} from 'react-router';
import {useWishlist} from '~/context/WishlistContext';

/**
 * @param {{
 *   productId: string,
 *   className?: string,
 *   showLabel?: boolean,
 *   size?: 'small' | 'medium' | 'large'
 * }}
 */
export function WishlistButton({
  productId,
  className = '',
  showLabel = false,
  size = 'medium',
}) {
  const {isLoggedIn, isInWishlist, toggleWishlist, isLoading} = useWishlist();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    if (isUpdating || isLoading) return;

    setIsUpdating(true);
    try {
      await toggleWishlist(productId);
    } finally {
      setIsUpdating(false);
    }
  };

  const sizeClasses = {
    small: 'wishlist-button--small',
    medium: 'wishlist-button--medium',
    large: 'wishlist-button--large',
  };

  return (
    <>
      <button
        type="button"
        className={`wishlist-button ${sizeClasses[size]} ${inWishlist ? 'wishlist-button--active' : ''} ${isUpdating ? 'wishlist-button--loading' : ''} ${className}`}
        onClick={handleClick}
        disabled={isUpdating}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <HeartIcon filled={inWishlist} />
        {showLabel && (
          <span className="wishlist-button__label">
            {inWishlist ? 'Saved' : 'Save'}
          </span>
        )}
      </button>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="wishlist-login-prompt" onClick={() => setShowLoginPrompt(false)}>
          <div className="wishlist-login-prompt__content" onClick={(e) => e.stopPropagation()}>
            <button
              className="wishlist-login-prompt__close"
              onClick={() => setShowLoginPrompt(false)}
              aria-label="Close"
            >
              ×
            </button>
            <HeartIcon filled={false} />
            <h3>Save to Wishlist</h3>
            <p>Sign in to save items to your wishlist and access them from any device.</p>
            <Link to="/account/login" className="button button--primary">
              Sign In
            </Link>
            <Link to="/account/register" className="wishlist-login-prompt__register">
              Create Account
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Heart Icon SVG
 * @param {{filled: boolean}}
 */
function HeartIcon({filled}) {
  return (
    <svg
      className="wishlist-button__icon"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default WishlistButton;
