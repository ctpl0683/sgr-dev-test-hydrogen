import {data} from 'react-router';
import {
  checkPincodeServiceability,
  parsePincodeDataFromMetafield,
  EXAMPLE_PINCODE_DATA,
} from '~/lib/pincode-service';

/**
 * API endpoint to check pincode serviceability
 * POST: Check if a pincode is serviceable
 * GET: Get list of serviceable cities/zones
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  try {
    let body;
    const contentType = request.headers.get('Content-Type');

    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      body = {
        pincode: formData.get('pincode'),
        productId: formData.get('productId'),
      };
    }

    const {pincode, productId} = body;

    if (!pincode) {
      return data({
        serviceable: false,
        message: 'Pincode is required',
      }, {status: 400});
    }

    // Get pincode data from metaobject or use example data
    const pincodeData = await getPincodeData(context);

    // Check serviceability
    const result = checkPincodeServiceability(pincode, pincodeData);

    return data(result);
  } catch (e) {
    console.error('Error checking pincode:', e);
    return data({
      serviceable: false,
      message: 'Error checking pincode. Please try again.',
    }, {status: 500});
  }
}

/**
 * GET endpoint to retrieve serviceable areas info
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  try {
    const pincodeData = await getPincodeData(context);

    // Group by city
    const citiesMap = pincodeData.reduce((acc, item) => {
      if (!acc[item.city]) {
        acc[item.city] = {
          city: item.city,
          zone: item.zone,
          deliveryDays: item.deliveryDays,
          pincodeCount: 0,
        };
      }
      acc[item.city].pincodeCount++;
      return acc;
    }, {});

    const cities = Object.values(citiesMap);

    return data({
      cities,
      totalPincodes: pincodeData.length,
    });
  } catch (e) {
    console.error('Error loading pincode data:', e);
    return data({cities: [], totalPincodes: 0});
  }
}

/**
 * Get pincode data from metaobject or fallback to example data
 * @param {object} context - Loader/Action context
 * @returns {Promise<PincodeData[]>}
 */
async function getPincodeData(context) {
  try {
    const {storefront} = context;

    // Try to fetch from metaobject
    const {metaobjects} = await storefront.query(PINCODE_DATA_QUERY, {
      cache: storefront.CacheShort(),
    });

    const metaobject = metaobjects?.nodes?.[0];
    if (metaobject?.fields) {
      const pincodesField = metaobject.fields.find(
        (f) => f.key === 'pincodes'
      );

      if (pincodesField?.value) {
        return parsePincodeDataFromMetafield(pincodesField.value);
      }
    }
  } catch (e) {
    console.warn('Could not fetch pincode data from metaobject:', e.message);
  }

  // Fallback to example data
  return EXAMPLE_PINCODE_DATA;
}

const PINCODE_DATA_QUERY = `#graphql
  query PincodeData {
    metaobjects(type: "pincode_service", first: 1) {
      nodes {
        fields {
          key
          value
        }
      }
    }
  }
`;

/** @typedef {import('~/lib/pincode-service').PincodeData} PincodeData */
/** @typedef {import('./+types/api.pincode-check').Route} Route */
