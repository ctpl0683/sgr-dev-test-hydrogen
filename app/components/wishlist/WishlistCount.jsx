/**
 * Wishlist Count Badge Component
 * Shows the number of items in the wishlist
 */

import {Link} from 'react-router';
import {useWishlist} from '~/context/WishlistContext';

/**
 * @param {{className?: string, showZero?: boolean}}
 */
export function WishlistCount({className = '', showZero = false}) {
  const {wishlistCount, isLoggedIn} = useWishlist();

  // Don't show count if not logged in or count is 0 (unless showZero is true)
  if (!isLoggedIn || (wishlistCount === 0 && !showZero)) {
    return null;
  }

  return (
    <Link to="/account/wishlist" className={`wishlist-count ${className}`}>
      <HeartIcon />
      {wishlistCount > 0 && (
        <span className="wishlist-count__badge">{wishlistCount}</span>
      )}
    </Link>
  );
}

function HeartIcon() {
  return (
    <svg
      className="wishlist-count__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default WishlistCount;
