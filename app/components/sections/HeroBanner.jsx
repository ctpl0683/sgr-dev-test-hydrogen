import {Link} from 'react-router';

/**
 * Hero Banner / Image Banner Section
 * Displays a hero section with optional background image from metaobject
 * Falls back to text-only banner if no image is provided
 * 
 * @param {{
 *   shopName: string, 
 *   tagline?: string, 
 *   ctaLink?: string, 
 *   ctaText?: string,
 *   imageBanner?: {
 *     image?: {image?: {url: string, altText?: string, width?: number, height?: number}},
 *     heading?: string,
 *     subheading?: string,
 *     button_text?: string,
 *     button_link?: string,
 *     text_position?: string,
 *     overlay_opacity?: number
 *   }
 * }}
 */
export function HeroBanner({shopName, tagline, ctaLink, ctaText, imageBanner}) {
  // If we have metaobject data, use it; otherwise fall back to props
  const hasImageBanner = imageBanner && imageBanner.image?.image?.url;
  
  // Extract values from metaobject or use fallback props
  const heading = imageBanner?.heading || shopName;
  const subheading = imageBanner?.subheading || tagline;
  const buttonText = imageBanner?.button_text || ctaText;
  const buttonLink = imageBanner?.button_link || ctaLink;
  const textPosition = imageBanner?.text_position || 'center';
  const overlayOpacity = imageBanner?.overlay_opacity ?? 0.3;

  // If we have an image, render the image banner variant
  if (hasImageBanner) {
    const imageUrl = imageBanner.image.image.url;
    const imageAlt = imageBanner.image.image.altText || heading;

    return (
      <section 
        className={`hero-banner hero-banner--image hero-banner--${textPosition}`}
        style={{
          '--hero-overlay-opacity': overlayOpacity,
        }}
      >
        {/* Background Image */}
        <div className="hero-banner__image-wrapper">
          <img 
            src={imageUrl} 
            alt={imageAlt}
            className="hero-banner__image"
            loading="eager"
          />
          <div className="hero-banner__overlay" />
        </div>

        {/* Content */}
        <div className="hero-banner__inner page-width">
          <div className="hero-banner__content">
            {heading && <h1 className="hero-banner__title">{heading}</h1>}
            {subheading && <p className="hero-banner__tagline">{subheading}</p>}
            {buttonLink && buttonText && (
              <Link to={buttonLink} className="hero-banner__cta button button--secondary">
                {buttonText}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Default text-only banner (fallback)
  return (
    <section className="hero-banner color-scheme-1">
      <div className="hero-banner__inner page-width">
        <div className="hero-banner__content">
          <h1 className="hero-banner__title">{heading}</h1>
          {subheading && <p className="hero-banner__tagline">{subheading}</p>}
          {buttonLink && buttonText && (
            <Link to={buttonLink} className="hero-banner__cta button button--secondary">
              {buttonText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
