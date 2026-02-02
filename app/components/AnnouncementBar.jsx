import {Link} from 'react-router';
import {useThemeSettings} from '~/context/ThemeSettingsContext';

/**
 * Announcement Bar Component
 * Displays a customizable announcement bar at the top of the page
 * Content is managed via Shopify metaobjects
 */
export function AnnouncementBar() {
  let themeSettings;
  try {
    themeSettings = useThemeSettings();
  } catch (e) {
    // If context fails, don't render announcement
    return null;
  }

  const {announcement, isAnnouncementEnabled} = themeSettings;

  // Safe check - don't render if not enabled or no text
  if (!isAnnouncementEnabled || typeof isAnnouncementEnabled !== 'function') {
    return null;
  }

  if (!isAnnouncementEnabled() || !announcement?.text) {
    return null;
  }

  // Safely destructure with defaults
  const text = announcement.text || '';
  const link = announcement.link || null;
  const background_color = announcement.background_color || null;
  const text_color = announcement.text_color || null;

  // Only set custom colors if they're valid
  const style = {};
  if (background_color && typeof background_color === 'string') {
    style['--announcement-bg'] = background_color;
  }
  if (text_color && typeof text_color === 'string') {
    style['--announcement-text'] = text_color;
  }

  const content = (
    <span className="announcement-bar__text">{text}</span>
  );

  // Validate link before rendering as Link component
  const isValidLink = link && typeof link === 'string' && (link.startsWith('/') || link.startsWith('http'));

  return (
    <div className="announcement-bar" style={style}>
      <div className="announcement-bar__inner">
        {isValidLink ? (
          <Link to={link} className="announcement-bar__link">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
