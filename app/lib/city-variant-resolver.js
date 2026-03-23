/**
 * ==========================================================================
 * CITY VARIANT RESOLVER
 * ==========================================================================
 * Utility to resolve correct product variant based on selected city
 * - SSR-compatible (works in loader)
 * - Fallback logic if city variant unavailable
 */

import {CITY_OPTION_NAME, DEFAULT_CITY} from '~/context/CityContext';

/**
 * Find variant matching the selected city
 * @param {Product} product - Product with variants
 * @param {string} selectedCity - Selected city value
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {ProductVariant|null}
 */
export function findVariantByCity(product, selectedCity, cityOptionName = CITY_OPTION_NAME) {
  // Handle products without variants
  if (!product?.variants?.nodes?.length) {
    if (typeof window !== 'undefined') {
      console.log(`[findVariantByCity] No variants for product, using selectedOrFirstAvailableVariant`);
    }
    return product?.selectedOrFirstAvailableVariant || null;
  }

  const variants = product.variants.nodes;
  const normalizedCity = selectedCity?.toLowerCase();

  console.log('[product_variant_nodes]', product);
  
  // DEBUG: Log search parameters
  if (typeof window !== 'undefined') {
    console.log(`[findVariantByCity] Searching:`, {
      productTitle: product.title,
      selectedCity,
      normalizedCity,
      cityOptionName,
      variantsCount: variants.length,
      allVariantOptions: variants.map(v => v.selectedOptions),
    });
  }
  
  // Find variant with matching city option
  const cityVariant = variants.find((variant) => {
    if (!variant?.selectedOptions?.length) return false;
    
    const cityOption = variant.selectedOptions.find(
      (opt) => opt.name.toLowerCase() === cityOptionName.toLowerCase()
    );
    
    const matches = cityOption?.value.toLowerCase() === normalizedCity;
    
    if (typeof window !== 'undefined' && cityOption) {
      console.log(`[findVariantByCity] Checking variant:`, {
        variantId: variant.id,
        cityOptionValue: cityOption?.value,
        matches,
      });
    }
    
    return matches;
  });

  if (typeof window !== 'undefined') {
    console.log(`[findVariantByCity] Result:`, {
      found: !!cityVariant,
      cityVariantPrice: cityVariant?.price,
    });
  }

  if (cityVariant && cityVariant.availableForSale) {
    return cityVariant;
  }

  // If city variant exists but not available, still return it (shows "Sold Out")
  if (cityVariant) {
    return cityVariant;
  }

  // Fallback: return first available variant
  return null;
  // const firstAvailable = variants.find((v) => v.availableForSale);
  // return firstAvailable || variants[0] || null;
}

/**
 * Check if product has city-based variants
 * @param {Product} product - Product to check
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {boolean}
 */
export function hasCityVariants(product, cityOptionName = CITY_OPTION_NAME) {
  if (!product?.options?.length) return false;
  
  return product.options.some(
    (opt) => opt.name.toLowerCase() === cityOptionName.toLowerCase()
  );
}

/**
 * Get all available cities for a product
 * @param {Product} product - Product with variants
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {Array<{value: string, available: boolean}>}
 */
export function getProductCities(product, cityOptionName = CITY_OPTION_NAME) {
  if (!product?.options?.length) return [];
  
  const cityOption = product.options.find(
    (opt) => opt.name.toLowerCase() === cityOptionName.toLowerCase()
  );
  
  if (!cityOption?.optionValues?.length) return [];
  
  return cityOption.optionValues.map((optVal) => ({
    value: optVal.name,
    available: optVal.firstSelectableVariant?.availableForSale ?? false,
  }));
}

/**
 * Check if a specific city variant is available for a product
 * @param {Product} product - Product with variants
 * @param {string} city - City to check
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {boolean}
 */
export function isCityAvailable(product, city, cityOptionName = CITY_OPTION_NAME) {
  const variant = findVariantByCity(product, city, cityOptionName);
  return variant?.availableForSale ?? false;
}

/**
 * Resolve variant with city consideration for SSR
 * This is the main function to use in loaders
 * @param {Product} product - Product from Storefront API
 * @param {string} selectedCity - City from cookie/request
 * @param {URLSearchParams} [searchParams] - URL search params
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {{variant: ProductVariant, resolvedByCity: boolean, hasCityOption: boolean}}
 */
export function resolveVariantForCity(
  product,
  selectedCity,
  searchParams = null,
  cityOptionName = CITY_OPTION_NAME
) {
  // Check if product has city variants at all
  const productHasCityOption = hasCityVariants(product, cityOptionName);
  
  if (!productHasCityOption) {
    return {
      variant: product?.selectedOrFirstAvailableVariant || null,
      resolvedByCity: false,
      hasCityOption: false,
    };
  }

  // If URL has explicit city selection, respect it
  const urlCity = searchParams?.get(cityOptionName);
  if (urlCity) {
    const urlVariant = findVariantByCity(product, urlCity, cityOptionName);
    if (urlVariant) {
      return {
        variant: urlVariant,
        resolvedByCity: false,
        hasCityOption: true,
      };
    }
  }

  // Resolve by selected city from context/cookie
  const cityVariant = findVariantByCity(
    product,
    selectedCity || DEFAULT_CITY,
    cityOptionName
  );

  return {
    variant: cityVariant || product?.selectedOrFirstAvailableVariant || null,
    resolvedByCity: true,
    hasCityOption: true,
  };
}

/**
 * Build variant URL with city parameter
 * @param {string} handle - Product handle
 * @param {string} city - City value
 * @param {Object} [additionalParams] - Additional URL params
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {string}
 */
export function buildCityVariantUrl(
  handle,
  city,
  additionalParams = {},
  cityOptionName = CITY_OPTION_NAME
) {
  const params = new URLSearchParams();
  params.set(cityOptionName, city);
  
  Object.entries(additionalParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  
  return `/products/${handle}?${params.toString()}`;
}

/**
 * Get the city value from a variant's selected options
 * @param {ProductVariant} variant - Product variant
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {string|null}
 */
export function getCityFromVariant(variant, cityOptionName = CITY_OPTION_NAME) {
  if (!variant?.selectedOptions?.length) return null;
  
  const cityOption = variant.selectedOptions.find(
    (opt) => opt.name.toLowerCase() === cityOptionName.toLowerCase()
  );
  
  return cityOption?.value || null;
}

/**
 * Filter product options to exclude city option (for display purposes)
 * @param {Array} productOptions - Product options from getProductOptions
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {Array}
 */
export function filterOutCityOption(productOptions, cityOptionName = CITY_OPTION_NAME) {
  if (!productOptions?.length) return [];
  
  return productOptions.filter(
    (opt) => opt.name.toLowerCase() !== cityOptionName.toLowerCase()
  );
}

/**
 * Get city option from product options (for separate city selector)
 * @param {Array} productOptions - Product options from getProductOptions
 * @param {string} [cityOptionName] - Name of the city option
 * @returns {Object|null}
 */
export function getCityOption(productOptions, cityOptionName = CITY_OPTION_NAME) {
  if (!productOptions?.length) return null;
  
  return productOptions.find(
    (opt) => opt.name.toLowerCase() === cityOptionName.toLowerCase()
  ) || null;
}

/**
 * @typedef {import('@shopify/hydrogen/storefront-api-types').Product} Product
 * @typedef {import('@shopify/hydrogen/storefront-api-types').ProductVariant} ProductVariant
 */
