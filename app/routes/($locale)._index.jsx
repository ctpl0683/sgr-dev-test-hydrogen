import {Await, useLoaderData, Link} from 'react-router';
import {Suspense} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {
  HeroBanner,
  CollectionGrid,
  FeaturedProduct,
  ProductCarousel,
  Marquee,
} from '~/components/sections';
import {HOMEPAGE_IMAGE_BANNER_QUERY} from '~/graphql/storefront/ThemeSettingsQuery';
import {parseMetaobjectFields} from '~/lib/metaobjects';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context}) {
  const [{collections}, {shop}, allCollections, {products: featuredProducts}, imageBannerData] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    context.storefront.query(SHOP_QUERY),
    context.storefront.query(ALL_COLLECTIONS_QUERY),
    context.storefront.query(FEATURED_PRODUCTS_QUERY),
    // Fetch the image_banner metaobject for the hero section
    context.storefront.query(HOMEPAGE_IMAGE_BANNER_QUERY).catch((err) => {
      console.error('Error fetching image banner:', err);
      return {metaobject: null};
    }),
  ]);

  // Debug: Log the raw response
  console.log('Image Banner Data:', JSON.stringify(imageBannerData, null, 2));

  // Parse the image banner metaobject fields
  const imageBanner = imageBannerData?.metaobject 
    ? parseMetaobjectFields(imageBannerData.metaobject)
    : null;
  
  // Debug: Log parsed data
  console.log('Parsed Image Banner:', JSON.stringify(imageBanner, null, 2));

  return {
    featuredCollection: collections.nodes[0],
    shop,
    collections: allCollections.collections.nodes,
    featuredProduct: featuredProducts.nodes[0],
    imageBanner,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      {/* Hero Banner - Uses metaobject data if available */}
      <HeroBanner 
        shopName={data.shop?.name || 'SGR-DEV-TEST'} 
        tagline="Premium surfing gear for the modern adventurer"
        ctaLink="/collections/all"
        ctaText="Shop Now"
        imageBanner={data.imageBanner}
      />

      {/* Marquee Announcement */}
      <Marquee 
        text="Free shipping on orders over $100" 
        speed={25}
        repeat={6}
      />

      {/* Collection Grid */}
      {data.collections && data.collections.length > 0 && (
        <CollectionGrid 
          collections={data.collections} 
          heading="Shop by Category"
          columns={4}
        />
      )}

      {/* Featured Product */}
      {data.featuredProduct && (
        <FeaturedProduct 
          product={data.featuredProduct}
          heading="Featured"
        />
      )}

      {/* Product Carousel */}
      <Suspense fallback={<div className="loading-section">Loading products...</div>}>
        <Await resolve={data.recommendedProducts}>
          {(response) => response && (
            <ProductCarousel 
              products={response.products.nodes}
              heading="Recommended Products"
              collectionHandle="all"
            />
          )}
        </Await>
      </Suspense>

      {/* Featured Collection (original) */}
      <FeaturedCollectionSection collection={data.featuredCollection} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollectionSection({collection}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <section className="featured-collection-section">
      <Link
        className="featured-collection"
        to={`/collections/${collection.handle}`}
      >
        {image && (
          <div className="featured-collection-image">
            <Image data={image} sizes="100vw" />
          </div>
        )}
        <h2 className="featured-collection__title">{collection.title}</h2>
      </Link>
    </section>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

const SHOP_QUERY = `#graphql
  query Shop {
    shop {
      name
      description
    }
  }
`;

const ALL_COLLECTIONS_QUERY = `#graphql
  query AllCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 8, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        description
        image {
          id
          url
          altText
          width
          height
        }
      }
    }
  }
`;

const FEATURED_PRODUCTS_QUERY = `#graphql
  query FeaturedProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 1, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        handle
        vendor
        description
        featuredImage {
          id
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 1) {
          nodes {
            id
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
