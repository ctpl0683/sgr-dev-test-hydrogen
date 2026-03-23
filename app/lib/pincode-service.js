/**
 * ==========================================================================
 * PINCODE SERVICEABILITY UTILITIES
 * ==========================================================================
 * Utilities for checking pincode serviceability
 * Supports JSON/metafield storage and optional geo-radius based checks
 */

/**
 * @typedef {Object} PincodeData
 * @property {string} pincode - The pincode
 * @property {string} city - City name
 * @property {number} [deliveryDays] - Estimated delivery days
 * @property {boolean} [codAvailable] - Cash on delivery available
 * @property {string} [zone] - Delivery zone
 */

/**
 * @typedef {Object} ServiceabilityResult
 * @property {boolean} serviceable - Whether the pincode is serviceable
 * @property {string} [city] - City name if serviceable
 * @property {number} [deliveryDays] - Estimated delivery days
 * @property {boolean} [codAvailable] - COD availability
 * @property {string} [message] - User-friendly message
 * @property {string} [zone] - Delivery zone
 */

/**
 * @typedef {Object} GeoLocation
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 */

/**
 * @typedef {Object} ServiceCenter
 * @property {string} city - City name
 * @property {GeoLocation} location - Center coordinates
 * @property {number} radiusKm - Service radius in kilometers
 * @property {number} deliveryDays - Base delivery days
 */

/**
 * Check if a pincode is serviceable
 * @param {string} pincode - Pincode to check
 * @param {PincodeData[]} pincodeList - List of serviceable pincodes
 * @returns {ServiceabilityResult}
 */
export function checkPincodeServiceability(pincode, pincodeList) {
  if (!pincode || !pincodeList?.length) {
    return {
      serviceable: false,
      message: 'Please enter a valid pincode',
    };
  }

  // Normalize pincode (remove spaces, ensure string)
  const normalizedPincode = String(pincode).trim().replace(/\s/g, '');

  // Validate pincode format (Indian pincodes are 6 digits)
  if (!/^\d{6}$/.test(normalizedPincode)) {
    return {
      serviceable: false,
      message: 'Please enter a valid 6-digit pincode',
    };
  }

  // Find matching pincode
  const match = pincodeList.find(
    (p) => String(p.pincode).trim() === normalizedPincode
  );

  if (match) {
    return {
      serviceable: true,
      city: match.city,
      deliveryDays: match.deliveryDays || 3,
      codAvailable: match.codAvailable ?? true,
      zone: match.zone,
      message: `Delivery available to ${match.city}`,
    };
  }

  return {
    serviceable: false,
    message: 'Sorry, we do not deliver to this pincode yet',
  };
}

/**
 * Check serviceability based on geo-radius from service centers
 * @param {string} pincode - Pincode to check
 * @param {ServiceCenter[]} serviceCenters - List of service centers with radius
 * @param {Function} geocodeFunction - Function to convert pincode to coordinates
 * @returns {Promise<ServiceabilityResult>}
 */
export async function checkGeoRadiusServiceability(
  pincode,
  serviceCenters,
  geocodeFunction
) {
  if (!pincode || !serviceCenters?.length) {
    return {
      serviceable: false,
      message: 'Please enter a valid pincode',
    };
  }

  try {
    // Get coordinates for the pincode
    const pincodeLocation = await geocodeFunction(pincode);

    if (!pincodeLocation) {
      return {
        serviceable: false,
        message: 'Unable to locate this pincode',
      };
    }

    // Check each service center
    for (const center of serviceCenters) {
      const distance = calculateHaversineDistance(
        pincodeLocation,
        center.location
      );

      if (distance <= center.radiusKm) {
        // Calculate delivery days based on distance
        const deliveryDays = calculateDeliveryDays(distance, center.deliveryDays);

        return {
          serviceable: true,
          city: center.city,
          deliveryDays,
          codAvailable: true,
          message: `Delivery available from ${center.city} (${Math.round(distance)} km)`,
        };
      }
    }

    return {
      serviceable: false,
      message: 'Sorry, this location is outside our delivery area',
    };
  } catch (error) {
    console.error('Error checking geo serviceability:', error);
    return {
      serviceable: false,
      message: 'Unable to check serviceability. Please try again.',
    };
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {GeoLocation} point1 - First location
 * @param {GeoLocation} point2 - Second location
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(point1, point2) {
  const R = 6371; // Earth's radius in kilometers

  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const deltaLat = toRadians(point2.lat - point1.lat);
  const deltaLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery days based on distance
 * @param {number} distance - Distance in km
 * @param {number} baseDeliveryDays - Base delivery days
 * @returns {number}
 */
function calculateDeliveryDays(distance, baseDeliveryDays = 2) {
  if (distance <= 10) return baseDeliveryDays;
  if (distance <= 25) return baseDeliveryDays + 1;
  if (distance <= 50) return baseDeliveryDays + 2;
  return baseDeliveryDays + 3;
}

/**
 * Parse pincode data from metafield JSON
 * @param {string|object} value - JSON string or object from metafield
 * @returns {PincodeData[]}
 */
export function parsePincodeDataFromMetafield(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (!Array.isArray(parsed)) {
      console.warn('Pincode data must be an array');
      return [];
    }

    return parsed
      .filter((item) => item.pincode)
      .map((item) => ({
        pincode: String(item.pincode).trim(),
        city: item.city || 'Unknown',
        deliveryDays: item.deliveryDays || 3,
        codAvailable: item.codAvailable ?? true,
        zone: item.zone || null,
      }));
  } catch (e) {
    console.error('Error parsing pincode data:', e);
    return [];
  }
}

/**
 * Parse service centers from metafield JSON
 * @param {string|object} value - JSON string or object from metafield
 * @returns {ServiceCenter[]}
 */
export function parseServiceCentersFromMetafield(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;

    if (!Array.isArray(parsed)) {
      console.warn('Service centers data must be an array');
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item.city &&
          item.location?.lat !== undefined &&
          item.location?.lng !== undefined
      )
      .map((item) => ({
        city: item.city,
        location: {
          lat: parseFloat(item.location.lat),
          lng: parseFloat(item.location.lng),
        },
        radiusKm: item.radiusKm || 50,
        deliveryDays: item.deliveryDays || 2,
      }));
  } catch (e) {
    console.error('Error parsing service centers:', e);
    return [];
  }
}

/**
 * Get delivery estimate text
 * @param {number} days - Delivery days
 * @returns {string}
 */
export function getDeliveryEstimateText(days) {
  if (days <= 1) return 'Tomorrow';
  if (days === 2) return 'In 2 days';
  if (days <= 3) return 'In 2-3 days';
  if (days <= 5) return 'In 3-5 days';
  if (days <= 7) return 'In 5-7 days';
  return `In ${days} days`;
}

/**
 * Example pincode data for testing
 */
export const EXAMPLE_PINCODE_DATA = [
  {pincode: '560001', city: 'Bangalore', deliveryDays: 2, codAvailable: true, zone: 'South'},
  {pincode: '560002', city: 'Bangalore', deliveryDays: 2, codAvailable: true, zone: 'South'},
  {pincode: '560003', city: 'Bangalore', deliveryDays: 2, codAvailable: true, zone: 'South'},
  {pincode: '560004', city: 'Bangalore', deliveryDays: 3, codAvailable: true, zone: 'South'},
  {pincode: '600001', city: 'Chennai', deliveryDays: 3, codAvailable: true, zone: 'South'},
  {pincode: '600002', city: 'Chennai', deliveryDays: 3, codAvailable: true, zone: 'South'},
  {pincode: '400001', city: 'Mumbai', deliveryDays: 4, codAvailable: true, zone: 'West'},
  {pincode: '400002', city: 'Mumbai', deliveryDays: 4, codAvailable: true, zone: 'West'},
  {pincode: '110001', city: 'Delhi', deliveryDays: 4, codAvailable: true, zone: 'North'},
  {pincode: '110002', city: 'Delhi', deliveryDays: 4, codAvailable: true, zone: 'North'},
  {pincode: '500001', city: 'Hyderabad', deliveryDays: 3, codAvailable: true, zone: 'South'},
  {pincode: '500002', city: 'Hyderabad', deliveryDays: 3, codAvailable: true, zone: 'South'},
];

/**
 * Example service centers for geo-radius testing
 */
export const EXAMPLE_SERVICE_CENTERS = [
  {
    city: 'Bangalore',
    location: {lat: 12.9716, lng: 77.5946},
    radiusKm: 50,
    deliveryDays: 2,
  },
  {
    city: 'Chennai',
    location: {lat: 13.0827, lng: 80.2707},
    radiusKm: 40,
    deliveryDays: 2,
  },
  {
    city: 'Mumbai',
    location: {lat: 19.076, lng: 72.8777},
    radiusKm: 45,
    deliveryDays: 2,
  },
  {
    city: 'Delhi',
    location: {lat: 28.7041, lng: 77.1025},
    radiusKm: 50,
    deliveryDays: 2,
  },
  {
    city: 'Hyderabad',
    location: {lat: 17.385, lng: 78.4867},
    radiusKm: 45,
    deliveryDays: 2,
  },
];
