import {Link, useNavigate} from 'react-router';
import {Money} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {WishlistButton} from '~/components/wishlist';
import {YotpoStarRatingSummary} from '~/components/yotpo';
import {useCity} from '~/context/CityContext';
import {MapPin} from 'lucide-react';
import {PincodeChecker} from '~/components/pincode/PincodeChecker';

/**
 * ProductInfo Component
 * Displays product details, options, and add to cart
 * Matching Ritual theme's product info design
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductVariantFragment;
 *   productOptions: MappedProductOptions[];
 *   hasCityOption?: boolean;
 *   isCityUnavailable?: boolean;
 * }}
 */
export function ProductInfo({product, selectedVariant, productOptions, hasCityOption = false, isCityUnavailable = false}) {
  const {title, vendor, descriptionHtml} = product;
  const navigate = useNavigate();
  const {open} = useAside();
  const {getCityLabel} = useCity();

  return (
    <div className="product-info">
      {/* Vendor */}
      {vendor && (
        <span className="product-info__vendor">{vendor}</span>
      )}

      {/* Title & Wishlist */}
      <div className="product-info__title-row">
        <h1 className="product-info__title">{title}</h1>
        <WishlistButton productId={product.id} size="large" />
      </div>

      {/* Yotpo Star Rating */}
      <YotpoStarRatingSummary product={product} />

      {/* City Indicator - shows when product has city-based pricing */}
      {hasCityOption && (
        <div className={`product-info__city-indicator ${isCityUnavailable ? 'product-info__city-indicator--unavailable' : ''}`}>
          <MapPin size={14} />
          {isCityUnavailable ? (
            <span>Not available in <strong>{getCityLabel()}</strong></span>
          ) : (
            <span>Price for <strong>{getCityLabel()}</strong></span>
          )}
        </div>
      )}

      {/* Price - hidden when city unavailable */}
      {!isCityUnavailable && (
        <div className="product-info__price">
          {selectedVariant?.compareAtPrice && (
            <s className="product-info__compare-price">
              <Money data={selectedVariant.compareAtPrice} />
            </s>
          )}
          {selectedVariant?.price && (
            <Money data={selectedVariant.price} />
          )}
        </div>
      )}

      {/* Product Options */}
      <div className="product-info__options">
        {productOptions.map((option) => {
          if (option.optionValues.length === 1) return null;

          return (
            <div className="product-info__option" key={option.name}>
              <label className="product-info__option-label">{option.name}</label>
              <div className="product-info__option-values">
                {option.optionValues.map((value) => {
                  const {
                    name,
                    handle,
                    variantUriQuery,
                    selected,
                    available,
                    exists,
                    isDifferentProduct,
                    swatch,
                  } = value;

                  const optionClass = `product-info__option-value ${
                    selected ? 'product-info__option-value--selected' : ''
                  } ${!available ? 'product-info__option-value--unavailable' : ''}`;

                  if (isDifferentProduct) {
                    return (
                      <Link
                        className={optionClass}
                        key={option.name + name}
                        prefetch="intent"
                        preventScrollReset
                        replace
                        to={`/products/${handle}?${variantUriQuery}`}
                      >
                        <OptionSwatch swatch={swatch} name={name} />
                      </Link>
                    );
                  }

                  return (
                    <button
                      type="button"
                      className={optionClass}
                      key={option.name + name}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <OptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Cart */}
      <div className="product-info__actions">
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale || isCityUnavailable}
          onClick={() => open('cart')}
          lines={
            selectedVariant
              ? [{
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                }]
              : []
          }
        >
          {isCityUnavailable 
            ? 'Unavailable in Your City' 
            : (selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold Out')
          }
        </AddToCartButton>
      </div>

      {/* Pincode Checker */}
      <PincodeChecker 
        className="product-info__pincode" 
        productId={product.id}
      />

      {/* Description */}
      {descriptionHtml && (
        <div className="product-info__description">
          <details open>
            <summary className="product-info__description-toggle">
              Description
            </summary>
            <div 
              className="product-info__description-content"
              dangerouslySetInnerHTML={{__html: descriptionHtml}} 
            />
          </details>
        </div>
      )}
    </div>
  );
}

/**
 * Option Swatch Component
 */
function OptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return <span>{name}</span>;

  return (
    <span
      aria-label={name}
      className="product-info__swatch"
      style={{backgroundColor: color || 'transparent'}}
    >
      {image && <img src={image} alt={name} />}
    </span>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
