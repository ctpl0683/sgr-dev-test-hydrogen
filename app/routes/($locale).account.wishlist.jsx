/**
 * Wishlist Page
 * Displays the customer's saved products
 * Products are fetched client-side via WishlistContext
 */

import {Link, useLoaderData} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useWishlist} from '~/context/WishlistContext';
import {WishlistButton} from '~/components/wishlist';
import {useState, useEffect} from 'react';

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

      <WishlistContent />
    </div>
  );
}

/**
 * Wishlist Content Component
 * Uses the WishlistContext to display products
 */
function WishlistContent() {
  const {wishlist, isLoading, wishlistCount} = useWishlist();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch product details when wishlist changes
  useEffect(() => {
    async function fetchProducts() {
      if (!wishlist || wishlist.length === 0) {
        setProducts([]);
        return;
      }

      setLoadingProducts(true);
      try {
        // Extract numeric IDs from GIDs
        const productIds = wishlist.map(gid => {
          const match = gid.match(/Product\/(\d+)/);
          return match ? match[1] : null;
        }).filter(Boolean);

        // Fetch products via Storefront API
        const response = await fetch('/api/wishlist-products', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({productIds}),
        });

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchProducts();
  }, [wishlist]);

  if (isLoading || loadingProducts) {
    return (
      <div className="wishlist-page__content">
        <div className="wishlist-page__loading">
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (wishlistCount === 0) {
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

  return (
    <div className="wishlist-page__content">
      <p className="wishlist-page__count">{wishlistCount} item{wishlistCount !== 1 ? 's' : ''}</p>
      <div className="wishlist-page__grid">
        {products.map((product) => (
          <WishlistProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

/**
 * Wishlist Product Card
 */
function WishlistProductCard({product}) {
  const image = product.featuredImage;
  const price = product.priceRange?.minVariantPrice;

  return (
    <div className="wishlist-product-card">
      <WishlistButton 
        productId={product.id} 
        className="wishlist-product-card__remove"
        size="small"
      />
      <Link to={`/products/${product.handle}`} className="wishlist-product-card__link">
        {image && (
          <Image
            alt={image.altText || product.title}
            className="wishlist-product-card__image"
            data={image}
            sizes="(min-width: 768px) 25vw, 50vw"
          />
        )}
        <div className="wishlist-product-card__info">
          <h3 className="wishlist-product-card__title">{product.title}</h3>
          {price && (
            <div className="wishlist-product-card__price">
              <Money data={price} />
            </div>
          )}
        </div>
      </Link>
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

const CUSTOMER_QUERY = `
  query CustomerBasic {
    customer {
      id
      email
    }
  }
`;

/** @typedef {import('./+types/($locale).account.wishlist').Route} Route */
