/**
 * Wishlist Page
 * Displays the customer's saved products
 * Products are fetched client-side via WishlistContext
 */

import {Link, useLoaderData} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useWishlist} from '~/context/WishlistContext';
import {WishlistButton} from '~/components/wishlist';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'My Wishlist'}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  // Ensure customer is logged in
  await context.customerAccount.handleAuthStatus();

  // Get customer info
  const {data: customerData} = await context.customerAccount.query(
    CUSTOMER_QUERY
  );

  const customerId = customerData?.customer?.id;

  return {customerId};
}

export default function WishlistPage() {
  const {customerId} = useLoaderData();

  return (
    <div className="wishlist-page">
      <header className="wishlist-page__header">
        <h1 className="wishlist-page__title">My Wishlist</h1>
        <p className="wishlist-page__subtitle">
          Items you've saved for later
        </p>
      </header>

      <WishlistContent customerId={customerId} />
    </div>
  );
}

/**
 * Wishlist Content Component
 * Uses the WishlistContext to display products
 */
function WishlistContent({customerId}) {
  // This component will use the WishlistContext
  // For now, show a placeholder that explains how to use it
  
  return (
    <div className="wishlist-page__content">
      <div className="wishlist-page__empty">
        <HeartIcon />
        <h2>Your wishlist is empty</h2>
        <p>Save items you love by clicking the heart icon on any product.</p>
        <Link to="/collections/all" className="button button--primary">
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

function HeartIcon() {
  return (
    <svg
      className="wishlist-page__empty-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="64"
      height="64"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const CUSTOMER_QUERY = `#graphql
  query CustomerBasic {
    customer {
      id
      email
    }
  }
`;

/** @typedef {import('./+types/($locale).account.wishlist').Route} Route */
