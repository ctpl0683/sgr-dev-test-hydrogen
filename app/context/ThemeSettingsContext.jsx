import {createContext, useContext} from 'react';
import {parseMetaobjectFields, getDefaultThemeSettings} from '~/lib/metaobjects';

/**
 * ==========================================================================
 * THEME SETTINGS CONTEXT
 * ==========================================================================
 * Provides theme settings from metaobjects to all components
 */

const ThemeSettingsContext = createContext(null);

/**
 * Theme Settings Provider
 * Wrap your app with this to provide theme settings to all components
 * @param {{children: React.ReactNode, settings: object, announcement: object, socialLinks: object}}
 */
export function ThemeSettingsProvider({children, settings, announcement, socialLinks}) {
  // Parse settings with fallback to defaults
  let parsedSettings;
  try {
    const metaobjectFields = settings ? parseMetaobjectFields(settings) : {};
    parsedSettings = {...getDefaultThemeSettings(), ...metaobjectFields};
  } catch (e) {
    console.warn('Error parsing theme settings, using defaults:', e.message);
    parsedSettings = getDefaultThemeSettings();
  }
  
  // Parse announcement with fallback to null (no announcement)
  let parsedAnnouncement = null;
  try {
    if (announcement) {
      parsedAnnouncement = parseMetaobjectFields(announcement);
    }
  } catch (e) {
    console.warn('Error parsing announcement settings:', e.message);
  }
  
  // Parse social links with fallback to empty object
  let parsedSocialLinks = {};
  try {
    if (socialLinks) {
      parsedSocialLinks = parseMetaobjectFields(socialLinks);
    }
  } catch (e) {
    console.warn('Error parsing social links:', e.message);
  }

  const value = {
    settings: parsedSettings,
    announcement: parsedAnnouncement,
    socialLinks: parsedSocialLinks,
    
    // Helper methods with safe fallbacks
    getColor: (key) => {
      const color = parsedSettings?.[key];
      return color || parsedSettings?.primary_color || '#000000';
    },
    getSetting: (key, defaultValue) => {
      if (!parsedSettings || !(key in parsedSettings)) {
        return defaultValue;
      }
      return parsedSettings[key] ?? defaultValue;
    },
    isAnnouncementEnabled: () => {
      return parsedAnnouncement?.enabled === true && Boolean(parsedAnnouncement?.text);
    },
    getSocialLink: (platform) => {
      return parsedSocialLinks?.[platform] || null;
    },
  };

  return (
    <ThemeSettingsContext.Provider value={value}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}

/**
 * Hook to access theme settings
 * @returns {ThemeSettingsContextValue}
 */
export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);
  if (!context) {
    // Return defaults if used outside provider - prevents app from crashing
    const defaults = getDefaultThemeSettings();
    return {
      settings: defaults,
      announcement: null,
      socialLinks: {},
      getColor: (key) => defaults[key] || '#000000',
      getSetting: (key, defaultValue) => defaults[key] ?? defaultValue,
      isAnnouncementEnabled: () => false,
      getSocialLink: () => null,
    };
  }
  return context;
}

/**
 * @typedef {Object} ThemeSettingsContextValue
 * @property {object} settings - Parsed theme settings
 * @property {object|null} announcement - Announcement bar settings
 * @property {object} socialLinks - Social media links
 * @property {(key: string) => string} getColor - Get a color setting
 * @property {(key: string, defaultValue: any) => any} getSetting - Get any setting with fallback
 * @property {() => boolean} isAnnouncementEnabled - Check if announcement is enabled
 * @property {(platform: string) => string|null} getSocialLink - Get a social media link
 */
