import {useLoaderData, useNavigate, useSearchParams} from 'react-router';
import {useEffect} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductGallery, ProductInfo} from '~/components/product';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {YotpoReviewsWidget} from '~/components/yotpo';
import {getCityFromRequest, useCity, CITY_OPTION_NAME} from '~/context/CityContext';
import {
  resolveVariantForCity,
  hasCityVariants,
  filterOutCityOption,
  findVariantByCity,
} from '~/lib/city-variant-resolver';

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data}) => {
  return [
    {title: `Hydrogen | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
  ];
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
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  // Get city from cookie for SSR variant resolution (prevents flicker)
  const selectedCity = getCityFromRequest(request);
  const url = new URL(request.url);

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // The API handle might be localized, so redirect to the localized handle
  redirectIfHandleIsLocalized(request, {handle, data: product});

  // Resolve variant based on city (SSR - no flicker)
  const {variant: cityResolvedVariant, resolvedByCity, hasCityOption} = resolveVariantForCity(
    product,
    selectedCity,
    url.searchParams
  );

  return {
    product,
    selectedCity,
    cityResolvedVariant,
    resolvedByCity,
    hasCityOption,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context, params}) {
  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.

  return {};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const {product, cityResolvedVariant, hasCityOption} = useLoaderData();
  const {selectedCity, cityOptionName} = useCity();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Resolve variant based on current city from context (client-side reactive)
  // This ensures price updates when city changes without page reload
  const productHasCityOption = hasCityVariants(product, cityOptionName);
  const clientCityVariant = productHasCityOption 
    ? findVariantByCity(product, selectedCity, cityOptionName) 
    : null;

  // Check if product is unavailable for selected city
  // A product is unavailable if it has city variants but none match the selected city
  const isCityUnavailable = productHasCityOption && !clientCityVariant;

  // Use client-resolved city variant if available, otherwise fall back to SSR-resolved
  const baseVariant = clientCityVariant || cityResolvedVariant || product.selectedOrFirstAvailableVariant;

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    baseVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Sync URL with selected city when city changes
  // This ensures the correct variant is added to cart
  useEffect(() => {
    if (!productHasCityOption || !selectedCity) return;
    
    const urlCity = searchParams.get(CITY_OPTION_NAME);
    const normalizedSelectedCity = selectedCity.toLowerCase();
    const normalizedUrlCity = urlCity?.toLowerCase();
    
    // Only update URL if city in URL differs from selected city
    if (normalizedUrlCity !== normalizedSelectedCity) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set(CITY_OPTION_NAME, selectedCity);
      navigate(`?${newParams.toString()}`, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [selectedCity, productHasCityOption, searchParams, navigate]);

  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  // Filter out city option from display if product has city variants
  // City is selected via the global CitySelector, not per-product
  const displayOptions = productHasCityOption
    ? filterOutCityOption(productOptions)
    : productOptions;

  // Get all product images
  const images = product.images?.nodes || [];

  return (
    <div className="product-page">
      <div className="product-page__inner">
        <div className="product-page__grid">
          {/* Product Gallery */}
          <ProductGallery 
            images={images} 
            selectedImage={selectedVariant?.image}
          />

          {/* Product Info */}
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            productOptions={displayOptions}
            hasCityOption={hasCityOption}
            isCityUnavailable={isCityUnavailable}
          />
        </div>
      </div>

      {/* Yotpo Reviews Widget */}
      <div className="product-page__reviews page-width">
        <YotpoReviewsWidget product={product} />
      </div>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    images(first: 10) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
      ...ProductVariant
    }
    adjacentVariants (selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 50) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

/** @typedef {import('./+types/products.$handle').Route} Route */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
