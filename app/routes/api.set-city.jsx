import {data} from 'react-router';
import {
  CITY_COOKIE_NAME,
  SUPPORTED_CITIES,
  DEFAULT_CITY,
  isValidCity,
  normalizeCity,
} from '~/context/CityContext';

/**
 * API endpoint to set city cookie server-side
 * This ensures SSR consistency when the page is refreshed
 * @param {Route.ActionArgs}
 */
export async function action({request}) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const body = await request.json();
    const {city} = body;

    // Validate city
    if (!city || !isValidCity(city)) {
      return data(
        {
          error: 'Invalid city',
          supportedCities: SUPPORTED_CITIES.map((c) => c.value),
        },
        {status: 400}
      );
    }

    const normalizedCity = normalizeCity(city);

    // Set cookie header (expires in 1 year)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);

    const headers = new Headers();
    headers.set(
      'Set-Cookie',
      `${CITY_COOKIE_NAME}=${encodeURIComponent(normalizedCity)};Path=/;Expires=${expires.toUTCString()};SameSite=Lax`
    );

    return data(
      {
        success: true,
        city: normalizedCity,
        label: SUPPORTED_CITIES.find((c) => c.value === normalizedCity)?.label,
      },
      {headers}
    );
  } catch (e) {
    console.error('Error setting city:', e);
    return data({error: 'Invalid request body'}, {status: 400});
  }
}

/**
 * GET endpoint to retrieve current city from cookie
 * @param {Route.LoaderArgs}
 */
export async function loader({request}) {
  const cookieHeader = request.headers.get('Cookie') || '';
  
  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});

  const rawCity = cookies[CITY_COOKIE_NAME];
  const city = isValidCity(rawCity) ? normalizeCity(rawCity) : DEFAULT_CITY;
  const cityInfo = SUPPORTED_CITIES.find((c) => c.value === city);

  return data({
    city,
    label: cityInfo?.label || city,
    supportedCities: SUPPORTED_CITIES,
    isDefault: !rawCity || !isValidCity(rawCity),
  });
}

/** @typedef {import('./+types/api.set-city').Route} Route */
