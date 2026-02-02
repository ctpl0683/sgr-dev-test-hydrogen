import {useThemeSettings} from '~/context/ThemeSettingsContext';

/**
 * ThemeStyles Component
 * Injects dynamic CSS custom properties based on metaobject settings
 * Place this component in the root layout to apply theme settings globally
 */
export function ThemeStyles() {
  const {settings} = useThemeSettings();

  // Handle case where settings might be null/undefined
  if (!settings || typeof settings !== 'object') {
    return null;
  }

  // Build CSS custom properties from settings
  const cssVariables = buildCSSVariables(settings);

  // Don't render empty style tag
  if (!cssVariables) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${cssVariables} }`,
      }}
    />
  );
}

/**
 * Build CSS custom properties string from settings object
 * @param {object} settings - Theme settings from metaobject
 * @returns {string} - CSS custom properties string
 */
function buildCSSVariables(settings) {
  // Safety check
  if (!settings) return '';
  
  const variables = [];

  // Color settings - with validation
  if (settings.primary_color && isValidColor(settings.primary_color)) {
    variables.push(`--color-primary-custom: ${settings.primary_color}`);
  }

  if (settings.secondary_color && isValidColor(settings.secondary_color)) {
    variables.push(`--color-secondary-custom: ${settings.secondary_color}`);
  }

  if (settings.accent_color && isValidColor(settings.accent_color)) {
    variables.push(`--color-accent: ${settings.accent_color}`);
    variables.push(`--color-accent-custom: ${settings.accent_color}`);
  }

  // Typography settings - sanitize font names
  if (settings.heading_font && typeof settings.heading_font === 'string') {
    const sanitizedFont = sanitizeFontName(settings.heading_font);
    if (sanitizedFont) {
      variables.push(`--font-heading-family: '${sanitizedFont}', sans-serif`);
    }
  }

  if (settings.body_font && typeof settings.body_font === 'string') {
    const sanitizedFont = sanitizeFontName(settings.body_font);
    if (sanitizedFont) {
      variables.push(`--font-body-family: '${sanitizedFont}', sans-serif`);
    }
  }

  // Layout settings - validate CSS value
  if (settings.page_width && isValidCSSLength(settings.page_width)) {
    variables.push(`--page-width: ${settings.page_width}`);
  }

  // Color scheme support
  if (settings.color_scheme && typeof settings.color_scheme === 'string') {
    // Map color schemes to actual colors
    const schemes = {
      'scheme-1': { bg: '#ffffff', fg: '#000000' },
      'scheme-2': { bg: '#f5f5f5', fg: '#1a1a1a' },
      'scheme-3': { bg: '#000000', fg: '#ffffff' },
      'scheme-4': { bg: '#1a1a1a', fg: '#f5f5f5' },
      'scheme-5': { bg: '#f8f4f0', fg: '#2c2c2c' },
      'scheme-6': { bg: '#2c2c2c', fg: '#f8f4f0' },
    };

    const scheme = schemes[settings.color_scheme];
    if (scheme) {
      variables.push(`--color-background: ${scheme.bg}`);
      variables.push(`--color-foreground: ${scheme.fg}`);
      // Convert to RGB for opacity support
      variables.push(`--color-background-rgb: ${hexToRgb(scheme.bg)}`);
      variables.push(`--color-foreground-rgb: ${hexToRgb(scheme.fg)}`);
    }
  }

  return variables.join('; ');
}

/**
 * Validate hex color format
 * @param {string} color - Color value to validate
 * @returns {boolean}
 */
function isValidColor(color) {
  if (typeof color !== 'string') return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Sanitize font name to prevent CSS injection
 * @param {string} fontName - Font name to sanitize
 * @returns {string|null}
 */
function sanitizeFontName(fontName) {
  if (!fontName || typeof fontName !== 'string') return null;
  // Remove any characters that could be used for CSS injection
  const sanitized = fontName.replace(/['";<>{}]/g, '').trim();
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate CSS length value
 * @param {string} value - CSS length value
 * @returns {boolean}
 */
function isValidCSSLength(value) {
  if (typeof value !== 'string') return false;
  return /^\d+(\.\d+)?(px|em|rem|%|vw|vh)$/.test(value);
}

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color code
 * @returns {string} - RGB values as "r, g, b"
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
