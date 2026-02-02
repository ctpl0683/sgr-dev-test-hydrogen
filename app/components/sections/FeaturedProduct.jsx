import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';

/**
 * Featured Product Section
 * Displays a single product with large image and details
 * Matching Ritual theme's featured-product section
 * @param {{product: object, heading?: string, reversed?: boolean}}
 */
export function FeaturedProduct({product, heading, reversed = false}) {
  if (!product) return null;

  const firstVariant = product.variants?.nodes?.[0];
  const price = firstVariant?.price;
  const compareAtPrice = firstVariant?.compareAtPrice;

  return (
    <section className={`featured-product-section ${reversed ? 'featured-product-section--reversed' : ''}`}>
      <div className="featured-product-section__inner page-width">
        {heading && (
          <h2 className="featured-product-section__heading">{heading}</h2>
        )}
        <div className="featured-product-section__grid">
          {/* Product Image */}
          <div className="featured-product-section__media">
            <Link to={`/products/${product.handle}`}>
              {product.featuredImage ? (
                <Image
                  data={product.featuredImage}
                  className="featured-product-section__image"
                  sizes="(min-width: 990px) 50vw, 100vw"
                />
              ) : (
                <div className="featured-product-section__placeholder" />
              )}
            </Link>
          </div>

          {/* Product Info */}
          <div className="featured-product-section__info">
            <div className="featured-product-section__content">
              {product.vendor && (
                <span className="featured-product-section__vendor">
                  {product.vendor}
                </span>
              )}
              <h3 className="featured-product-section__title">
                <Link to={`/products/${product.handle}`}>
                  {product.title}
                </Link>
              </h3>
              
              {/* Price */}
              <div className="featured-product-section__price">
                {compareAtPrice && (
                  <span className="featured-product-section__compare-price">
                    <Money data={compareAtPrice} />
                  </span>
                )}
                {price && <Money data={price} />}
              </div>

              {/* Description */}
              {product.description && (
                <p className="featured-product-section__description">
                  {product.description.substring(0, 200)}
                  {product.description.length > 200 ? '...' : ''}
                </p>
              )}

              {/* CTA */}
              <Link
                to={`/products/${product.handle}`}
                className="featured-product-section__cta button"
              >
                View Product
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
