import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import {useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';

/**
 * Product Carousel/Slider Section
 * Displays products in a horizontally scrollable carousel
 * Matching Ritual theme's featured-collection slider
 * @param {{products: Array, heading?: string, collectionHandle?: string}}
 */
export function ProductCarousel({products, heading, collectionHandle}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!products || products.length === 0) return null;

  const checkScroll = () => {
    if (scrollRef.current) {
      const {scrollLeft, scrollWidth, clientWidth} = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="product-carousel-section">
      <div className="product-carousel-section__inner page-width">
        {/* Header */}
        <div className="product-carousel-section__header">
          {heading && (
            <h2 className="product-carousel-section__heading">{heading}</h2>
          )}
          {collectionHandle && (
            <Link
              to={`/collections/${collectionHandle}`}
              className="product-carousel-section__view-all"
            >
              View All →
            </Link>
          )}
        </div>

        {/* Carousel Container */}
        <div className="product-carousel-section__container">
          {/* Navigation Arrows */}
          <button
            className={`product-carousel-section__nav product-carousel-section__nav--prev ${!canScrollLeft ? 'hidden' : ''}`}
            onClick={() => scroll('left')}
            aria-label="Previous products"
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Products Track */}
          <div
            ref={scrollRef}
            className="product-carousel-section__track"
            onScroll={checkScroll}
          >
            {products.map((product) => (
              <ProductCarouselCard key={product.id} product={product} />
            ))}
          </div>

          <button
            className={`product-carousel-section__nav product-carousel-section__nav--next ${!canScrollRight ? 'hidden' : ''}`}
            onClick={() => scroll('right')}
            aria-label="Next products"
            disabled={!canScrollRight}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Product Card for Carousel
 * @param {{product: object}}
 */
function ProductCarouselCard({product}) {
  const firstVariant = product.variants?.nodes?.[0];
  const price = firstVariant?.price || product.priceRange?.minVariantPrice;

  return (
    <Link
      to={`/products/${product.handle}`}
      className="product-carousel-card"
    >
      <div className="product-carousel-card__image-wrapper">
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            className="product-carousel-card__image"
            sizes="(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw"
          />
        ) : (
          <div className="product-carousel-card__placeholder" />
        )}
      </div>
      <div className="product-carousel-card__info">
        <h3 className="product-carousel-card__title">{product.title}</h3>
        {price && (
          <span className="product-carousel-card__price">
            <Money data={price} />
          </span>
        )}
      </div>
    </Link>
  );
}
