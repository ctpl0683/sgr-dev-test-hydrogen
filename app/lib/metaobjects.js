/**
 * ==========================================================================
 * METAOBJECT & METAFIELD UTILITIES
 * ==========================================================================
 * Helper functions for working with Shopify metaobjects and metafields
 */

/**
 * Parse a metafield value based on its type
 * @param {object} metafield - The metafield object
 * @returns {any} - Parsed value
 */
export function parseMetafieldValue(metafield, defaultValue = null) {
  // Handle null/undefined metafield
  if (!metafield) return defaultValue;
  
  // Handle missing value
  if (metafield.value === null || metafield.value === undefined) {
    return defaultValue;
  }

  const { type, value } = metafield;

  try {
    switch (type) {
      case 'json':
      case 'list.single_line_text_field':
      case 'list.number_integer':
      case 'list.number_decimal':
        return value ? JSON.parse(value) : defaultValue;
      
      case 'number_integer': {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      
      case 'number_decimal': {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      
      case 'boolean':
        return value === 'true';
      
      case 'color':
        // Validate hex color format
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value) ? value : defaultValue;
      
      case 'rich_text_field':
        return value ? JSON.parse(value) : defaultValue;
      
      case 'file_reference':
      case 'list.file_reference':
        return metafield.reference || metafield.references?.nodes || defaultValue;
      
      case 'metaobject_reference':
        return metafield.reference || defaultValue;
      
      case 'list.metaobject_reference':
        return metafield.references?.nodes || [];
      
      case 'url':
      case 'single_line_text_field':
      case 'multi_line_text_field':
        return value || defaultValue;
      
      default:
        return value ?? defaultValue;
    }
  } catch (e) {
    // Silently fail and return default - don't break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error parsing metafield:', metafield?.key, e.message);
    }
    return defaultValue;
  }
}

/**
 * Get a metafield from an object by namespace and key
 * @param {object} obj - Object with metafields
 * @param {string} namespace - Metafield namespace
 * @param {string} key - Metafield key
 * @returns {any} - Parsed metafield value
 */
export function getMetafield(obj, namespace, key, defaultValue = null) {
  // Handle missing object or metafields array
  if (!obj?.metafields || !Array.isArray(obj.metafields)) {
    return defaultValue;
  }
  
  const metafield = obj.metafields.find(
    (mf) => mf?.namespace === namespace && mf?.key === key
  );
  
  return parseMetafieldValue(metafield, defaultValue);
}

/**
 * Get a metafield from an object using the full key (namespace.key)
 * @param {object} obj - Object with metafield property
 * @param {string} fullKey - Full metafield key (e.g., 'custom.badge')
 * @returns {any} - Parsed metafield value
 */
export function getMetafieldByKey(obj, fullKey, defaultValue = null) {
  if (!fullKey || typeof fullKey !== 'string') {
    return defaultValue;
  }
  
  const parts = fullKey.split('.');
  if (parts.length !== 2) {
    return defaultValue;
  }
  
  const [namespace, key] = parts;
  return getMetafield(obj, namespace, key, defaultValue);
}

/**
 * Parse metaobject fields into a usable object
 * @param {object} metaobject - The metaobject from Shopify
 * @returns {object} - Parsed fields object
 */
export function parseMetaobjectFields(metaobject) {
  // Handle null/undefined metaobject
  if (!metaobject) return {};
  
  // Handle missing or invalid fields array
  if (!metaobject.fields || !Array.isArray(metaobject.fields)) {
    return {};
  }

  return metaobject.fields.reduce((acc, field) => {
    // Skip invalid fields
    if (!field || !field.key) return acc;
    
    acc[field.key] = parseMetafieldValue(field);
    return acc;
  }, {});
}

/**
 * Get theme settings from metaobject
 * @param {object} themeSettings - Theme settings metaobject
 * @returns {object} - Parsed theme settings
 */
export function parseThemeSettings(themeSettings) {
  if (!themeSettings) return getDefaultThemeSettings();

  const fields = parseMetaobjectFields(themeSettings);
  
  return {
    ...getDefaultThemeSettings(),
    ...fields,
  };
}

/**
 * Default theme settings fallback
 * @returns {object}
 */
export function getDefaultThemeSettings() {
  return {
    // Colors
    color_scheme: 'scheme-1',
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#ff6b6b',
    
    // Typography
    heading_font: 'Chivo',
    body_font: 'Inter',
    
    // Layout
    page_width: '1400px',
    
    // Header
    header_transparent_homepage: true,
    header_sticky: true,
    
    // Footer
    footer_show_newsletter: true,
    footer_newsletter_heading: 'Get on the list',
    
    // Announcement
    announcement_enabled: false,
    announcement_text: '',
    announcement_link: '',
    
    // Social
    social_instagram: '',
    social_twitter: '',
    social_facebook: '',
  };
}
