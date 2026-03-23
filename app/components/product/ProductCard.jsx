import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {WishlistButton} from '~/components/wishlist';
import {useCity} from '~/context/CityContext';
import {findVariantByCity, hasCityVariants} from '~/lib/city-variant-resolver';

/**
 * ProductCard Component
 * Matching Ritual theme's product card design
 * @param {{
 *   product: ProductItemFragment | CollectionItemFragment | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 *   showVendor?: boolean;
 *   showSecondImage?: boolean;
 *   aspectRatio?: string;
 * }}
 */
export function ProductCard({
  product,
  loading,
  showVendor = false,
  showSecondImage = true,
  aspectRatio = '3/4',
}) {
  const {selectedCity, cityOptionName} = useCity();
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const secondImage = product.images?.nodes?.[1];
  
  // Get city-specific variant price if product has city variants
  const hasCityOption = hasCityVariants(product, cityOptionName);
  const cityVariant = hasCityOption ? findVariantByCity(product, selectedCity, cityOptionName) : null;
  
  // Check if product is unavailable for selected city
  // A product is unavailable if it has city variants but none match the selected city
  const isCityUnavailable = hasCityOption && !cityVariant;
  
  // Use city variant price if available, otherwise fall back to priceRange
  const price = cityVariant?.price || product.priceRange?.minVariantPrice;
  const compareAtPrice = cityVariant?.compareAtPrice || null;
  const isOnSale = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price?.amount || '0');

  // Card content - shared between clickable and non-clickable versions
  const cardContent = (
    <>
      {/* Image Container */}
      <div className="product-card__media" style={{'--aspect-ratio': aspectRatio}}>
        {image && (
          <Image
            alt={image.altText || product.title}
            className="product-card__image product-card__image--primary"
            data={image}
            loading={loading}
            sizes="(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw"
          />
        )}
        {showSecondImage && secondImage && (
          <Image
            alt={secondImage.altText || product.title}
            className="product-card__image product-card__image--secondary"
            data={secondImage}
            loading="lazy"
            sizes="(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw"
          />
        )}
        {!image && <div className="product-card__placeholder" />}
        
        {/* Sale Badge */}
        {isOnSale && !isCityUnavailable && (
          <span className="product-card__badge product-card__badge--sale">Sale</span>
        )}
        
        {/* Unavailable Badge */}
        {isCityUnavailable && (
          <span className="product-card__badge product-card__badge--unavailable">Unavailable</span>
        )}
      </div>

      {/* Product Info */}
      <div className="product-card__info">
        {showVendor && product.vendor && (
          <span className="product-card__vendor">{product.vendor}</span>
        )}
        <h3 className="product-card__title">{product.title}</h3>
        <div className="product-card__price">
          {isCityUnavailable ? (
            <span className="product-card__unavailable-text">Unavailable in your city</span>
          ) : (
            <>
              {price && <Money data={price} />}
              {isOnSale && compareAtPrice && (
                <s className="product-card__compare-price">
                  <Money data={compareAtPrice} />
                </s>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className={`product-card ${isCityUnavailable ? 'product-card--unavailable' : ''}`}>
      {/* Wishlist Button - Outside Link to prevent click propagation issues */}
      <WishlistButton 
        productId={product.id} 
        className="product-card__wishlist"
        size="small"
      />

      {isCityUnavailable ? (
        <div className="product-card__link product-card__link--disabled">
          {cardContent}
        </div>
      ) : (
        <Link
          className="product-card__link"
          prefetch="intent"
          to={variantUrl}
        >
          {cardContent}
        </Link>
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
