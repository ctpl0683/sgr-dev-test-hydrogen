import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';

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
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  const secondImage = product.images?.nodes?.[1];
  const price = product.priceRange?.minVariantPrice;
  const compareAtPrice = product.priceRange?.maxVariantPrice;
  const isOnSale = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price?.amount || '0');

  return (
    <Link
      className="product-card"
      prefetch="intent"
      to={variantUrl}
    >
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
        {isOnSale && (
          <span className="product-card__badge product-card__badge--sale">Sale</span>
        )}
      </div>

      {/* Product Info */}
      <div className="product-card__info">
        {showVendor && product.vendor && (
          <span className="product-card__vendor">{product.vendor}</span>
        )}
        <h3 className="product-card__title">{product.title}</h3>
        <div className="product-card__price">
          {price && <Money data={price} />}
          {isOnSale && compareAtPrice && (
            <s className="product-card__compare-price">
              <Money data={compareAtPrice} />
            </s>
          )}
        </div>
      </div>
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */
