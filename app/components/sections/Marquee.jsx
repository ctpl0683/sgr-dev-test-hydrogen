/**
 * Marquee/Announcement Section
 * Displays scrolling text announcements
 * Matching Ritual theme's marquee section
 * @param {{text: string, speed?: number, repeat?: number}}
 */
export function Marquee({text, speed = 30, repeat = 4}) {
  if (!text) return null;

  const items = Array(repeat).fill(text);

  return (
    <section className="marquee-section">
      <div 
        className="marquee-section__track"
        style={{'--marquee-speed': `${speed}s`}}
      >
        <div className="marquee-section__content">
          {items.map((item, index) => (
            <span key={index} className="marquee-section__item">
              {item}
              <span className="marquee-section__separator">•</span>
            </span>
          ))}
        </div>
        <div className="marquee-section__content" aria-hidden="true">
          {items.map((item, index) => (
            <span key={index} className="marquee-section__item">
              {item}
              <span className="marquee-section__separator">•</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
