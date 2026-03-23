import {createContext, useContext, useState, useCallback, useEffect, useMemo} from 'react';

/**
 * ==========================================================================
 * CITY CONTEXT
 * ==========================================================================
 * Global state for selected city with SSR support
 * - Reads city from cookie on server (no flicker)
 * - Persists selection to cookie
 * - Provides city to all components
 * - Supports dynamic cities from metaobject
 */

const CityContext = createContext(null);

// Fallback cities - used when metaobject data is not available
export const FALLBACK_CITIES = [
  {value: 'bangalore', label: 'Bangalore'},
  {value: 'chennai', label: 'Chennai'},
  {value: 'mumbai', label: 'Mumbai'},
  {value: 'delhi', label: 'Delhi'},
  {value: 'hyderabad', label: 'Hyderabad'},
];

// For backward compatibility
export const SUPPORTED_CITIES = FALLBACK_CITIES;

export const DEFAULT_CITY = 'bangalore';
export const CITY_COOKIE_NAME = 'selected_city';
export const CITY_OPTION_NAME = 'City';

/**
 * Parse city from cookie string
 * @param {string} cookieString - Cookie header string
 * @returns {string|null}
 */
export function parseCityFromCookie(cookieString) {
  if (!cookieString) return null;
  
  const cookies = cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
  
  return cookies[CITY_COOKIE_NAME] || null;
}

/**
 * Get city from request (for SSR)
 * @param {Request} request - Incoming request
 * @returns {string}
 */
export function getCityFromRequest(request) {
  const cookieHeader = request.headers.get('Cookie');
  return parseCityFromCookie(cookieHeader) || DEFAULT_CITY;
}

/**
 * Validate if a city value is supported
 * @param {string} city - City value to validate
 * @param {Array<{value: string, label: string}>} [cities] - Optional cities list
 * @returns {boolean}
 */
export function isValidCity(city, cities = FALLBACK_CITIES) {
  return cities.some((c) => c.value.toLowerCase() === city?.toLowerCase());
}

/**
 * Normalize city value to match supported cities
 * @param {string} city - City value to normalize
 * @param {Array<{value: string, label: string}>} [cities] - Optional cities list
 * @param {string} [defaultCity] - Optional default city
 * @returns {string}
 */
export function normalizeCity(city, cities = FALLBACK_CITIES, defaultCity = DEFAULT_CITY) {
  if (!city) return defaultCity;
  const found = cities.find(
    (c) => c.value.toLowerCase() === city.toLowerCase()
  );
  return found ? found.value : defaultCity;
}

/**
 * City Provider Component
 * @param {{children: React.ReactNode, initialCity?: string, cities?: Array<{value: string, label: string}>, defaultCity?: string}}
 */
export function CityProvider({children, initialCity, cities, defaultCity}) {
  // Use dynamic cities from metaobject or fallback to defaults
  const supportedCities = useMemo(() => {
    return cities?.length ? cities : FALLBACK_CITIES;
  }, [cities]);

  const effectiveDefaultCity = useMemo(() => {
    // Use provided default if valid, otherwise first city in list
    if (defaultCity && isValidCity(defaultCity, supportedCities)) {
      return defaultCity;
    }
    return supportedCities[0]?.value || DEFAULT_CITY;
  }, [defaultCity, supportedCities]);

  const [selectedCity, setSelectedCity] = useState(
    normalizeCity(initialCity, supportedCities, effectiveDefaultCity) || effectiveDefaultCity
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync with cookie on client hydration
  useEffect(() => {
    setIsHydrated(true);
    const cookieCity = parseCityFromCookie(document.cookie);
    if (cookieCity && isValidCity(cookieCity, supportedCities) && cookieCity !== selectedCity) {
      setSelectedCity(normalizeCity(cookieCity, supportedCities, effectiveDefaultCity));
    }
  }, [supportedCities, effectiveDefaultCity]);

  // Update city and persist to cookie
  const updateCity = useCallback(async (newCity) => {
    const normalizedCity = normalizeCity(newCity, supportedCities, effectiveDefaultCity);
    
    if (!isValidCity(normalizedCity, supportedCities)) {
      console.warn(`City "${newCity}" is not supported`);
      return false;
    }

    setSelectedCity(normalizedCity);
    
    // Set cookie (expires in 1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${CITY_COOKIE_NAME}=${encodeURIComponent(normalizedCity)};path=/;expires=${expires.toUTCString()};SameSite=Lax`;

    // Call API to persist server-side (for SSR consistency)
    try {
      await fetch('/api/set-city', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({city: normalizedCity}),
      });
    } catch (e) {
      // Silent fail - cookie is already set client-side
      console.warn('Failed to persist city server-side:', e.message);
    }

    return true;
  }, [supportedCities, effectiveDefaultCity]);

  // Get current city info object
  const getCityInfo = useCallback(() => {
    return (
      supportedCities.find((c) => c.value === selectedCity) ||
      supportedCities[0]
    );
  }, [selectedCity, supportedCities]);

  // Get city label for display
  const getCityLabel = useCallback(() => {
    return getCityInfo().label;
  }, [getCityInfo]);

  const value = {
    selectedCity,
    setCity: updateCity,
    getCityInfo,
    getCityLabel,
    supportedCities,
    isHydrated,
    cityOptionName: CITY_OPTION_NAME,
    defaultCity: effectiveDefaultCity,
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

/**
 * Hook to access city context
 * @returns {CityContextValue}
 */
export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    // Return defaults if used outside provider - prevents app from crashing
    return {
      selectedCity: DEFAULT_CITY,
      setCity: async () => false,
      getCityInfo: () => FALLBACK_CITIES[0],
      getCityLabel: () => FALLBACK_CITIES[0].label,
      supportedCities: FALLBACK_CITIES,
      isHydrated: false,
      cityOptionName: CITY_OPTION_NAME,
      defaultCity: DEFAULT_CITY,
    };
  }
  return context;
}

/**
 * @typedef {Object} CityContextValue
 * @property {string} selectedCity - Currently selected city value
 * @property {(city: string) => Promise<boolean>} setCity - Update selected city
 * @property {() => {value: string, label: string}} getCityInfo - Get current city info object
 * @property {() => string} getCityLabel - Get current city display label
 * @property {Array<{value: string, label: string}>} supportedCities - List of supported cities
 * @property {boolean} isHydrated - Whether client has hydrated
 * @property {string} cityOptionName - Name of the city option in product variants
 * @property {string} defaultCity - Default city value
 */
