/**
 * GraphQL query to fetch supported cities from metaobject
 * Metaobject type: supported_cities
 * Handle: default
 */

export const SUPPORTED_CITIES_QUERY = `#graphql
  query SupportedCities {
    metaobjects(type: "supported_cities", first: 1) {
      nodes {
        fields {
          key
          value
        }
      }
    }
  }
`;

/**
 * Parse supported cities from metaobjects response
 * @param {object} metaobjectsResponse - Metaobjects query response
 * @returns {Array<{value: string, label: string}>}
 */
export function parseSupportedCitiesFromMetaobject(metaobjectsResponse) {
  const metaobject = metaobjectsResponse?.nodes?.[0];
  if (!metaobject?.fields) return null;

  const citiesField = metaobject.fields.find((f) => f.key === 'cities');
  
  if (!citiesField?.value) return null;

  try {
    const parsed = JSON.parse(citiesField.value);
    
    if (!Array.isArray(parsed)) {
      console.warn('Supported cities must be an array');
      return null;
    }

    return parsed
      .filter((city) => city.value && city.label)
      .map((city) => ({
        value: String(city.value).toLowerCase().trim(),
        label: String(city.label).trim(),
      }));
  } catch (e) {
    console.error('Error parsing supported cities:', e);
    return null;
  }
}

/**
 * Get default city from metaobjects response
 * @param {object} metaobjectsResponse - Metaobjects query response
 * @returns {string|null}
 */
export function getDefaultCityFromMetaobject(metaobjectsResponse) {
  const metaobject = metaobjectsResponse?.nodes?.[0];
  if (!metaobject?.fields) return null;

  const defaultCityField = metaobject.fields.find((f) => f.key === 'default_city');
  
  return defaultCityField?.value?.toLowerCase().trim() || null;
}
