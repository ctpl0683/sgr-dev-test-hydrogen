import {Image} from '@shopify/hydrogen';
import {useState} from 'react';

/**
 * ProductGallery Component
 * Displays product images with thumbnail navigation
 * Matching Ritual theme's product gallery design
 * @param {{
 *   images: Array<{id: string, url: string, altText?: string, width: number, height: number}>;
 *   selectedImage?: {id: string, url: string, altText?: string, width: number, height: number};
 * }}
 */
export function ProductGallery({images, selectedImage}) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (!images || images.length === 0) {
    return <div className="product-gallery__placeholder" />;
  }

  const currentImage = selectedImage || images[activeIndex];

  return (
    <div className="product-gallery">
      {/* Main Image */}
      <div className="product-gallery__main">
        <div className="product-gallery__main-image">
          <Image
            alt={currentImage.altText || 'Product image'}
            data={currentImage}
            sizes="(min-width: 990px) 50vw, 100vw"
            className="product-gallery__image"
          />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="product-gallery__thumbnails">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`product-gallery__thumbnail ${index === activeIndex ? 'product-gallery__thumbnail--active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                alt={image.altText || `Product thumbnail ${index + 1}`}
                data={image}
                sizes="80px"
                className="product-gallery__thumbnail-image"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
