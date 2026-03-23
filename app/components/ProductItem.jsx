import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {WishlistButton} from './wishlist';
import {useCity} from '~/context/CityContext';
import {findVariantByCity, hasCityVariants} from '~/lib/city-variant-resolver';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const {selectedCity, cityOptionName} = useCity();
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  
  // Get city-specific variant price if product has city variants
  const hasCityOption = hasCityVariants(product, cityOptionName);
  const cityVariant = hasCityOption ? findVariantByCity(product, selectedCity, cityOptionName) : null;
  
  // Check if product is unavailable for selected city
  const isCityUnavailable = hasCityOption ? (cityVariant === null): true;
  
  // Use city variant price if available, otherwise fall back to priceRange
  const price = cityVariant?.price || product.priceRange?.minVariantPrice;

  console.log('CityVariant',selectedCity, cityOptionName,product.title,hasCityOption, cityVariant, isCityUnavailable);
  
  // Content shared between clickable and non-clickable versions
  const itemContent = (
    <>
      <WishlistButton 
        productId={product.id} 
        className="product-card__wishlist"
        size="small"
      />
      <div className="product-item__media">
        {image && (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        {isCityUnavailable && (
          <span className="product-item__badge product-item__badge--unavailable">Unavailable</span>
        )}
      </div>
      <h4>{product.title}</h4>
      <small>
        {isCityUnavailable ? (
          <span className="product-item__unavailable-text">Unavailable in your city</span>
        ) : (
          price && <Money data={price} />
        )}
      </small>
    </>
  );

  if (isCityUnavailable) {
    return (
      <div className="product-item product-item--unavailable">
        {itemContent}
      </div>
    );
  }
  
  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {itemContent}
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
