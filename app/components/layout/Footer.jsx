import {Suspense} from 'react';
import {Await, NavLink} from 'react-router';
import clsx from 'clsx';
import {useThemeSettings} from '~/context/ThemeSettingsContext';

/**
 * Footer component matching Ritual theme design
 * Features: Multi-column layout, email signup, logo section, copyright
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, header, publicStoreDomain}) {
  // Get theme settings for logo and social links
  const {settings, socialLinks, getSocialLink} = useThemeSettings();
  const logoImage = settings?.logo;

  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="footer color-scheme-2">
            {/* Footer Logo - Top */}
            <div className="footer__logo-section">
              <div className="footer__inner page-width">
                {logoImage?.image?.url ? (
                  <img
                    src={logoImage.image.url}
                    alt={logoImage.image.altText || header.shop.name}
                    className="footer__logo-image"
                    width={logoImage.image.width || 150}
                    height={logoImage.image.height || 40}
                  />
                ) : (
                  <span className="footer__logo-text">{header.shop.name}</span>
                )}
              </div>
            </div>

            {/* Main Footer Content */}
            <div className="footer__main">
              <div className="footer__inner page-width">
                {/* Footer Columns */}
                <div className="footer__grid">
                  {/* Shop Column */}
                  <div className="footer__column">
                    <h5 className="footer__heading">SHOP</h5>
                    {footer?.menu && header.shop.primaryDomain?.url && (
                      <FooterMenu
                        menu={footer.menu}
                        primaryDomainUrl={header.shop.primaryDomain.url}
                        publicStoreDomain={publicStoreDomain}
                      />
                    )}
                  </div>

                  {/* Brand Column */}
                  <div className="footer__column">
                    <h5 className="footer__heading">BRAND</h5>
                    <nav className="footer__nav">
                      <NavLink to="/pages/about" className="footer__link">
                        About Us
                      </NavLink>
                      <NavLink to="/blogs/journal" className="footer__link">
                        Journal
                      </NavLink>
                      <NavLink to="/pages/contact" className="footer__link">
                        Contact
                      </NavLink>
                    </nav>
                  </div>

                  {/* Connect Column - Dynamic Social Links */}
                  <div className="footer__column">
                    <h5 className="footer__heading">CONNECT</h5>
                    <SocialLinks socialLinks={socialLinks} getSocialLink={getSocialLink} />
                  </div>

                  {/* Newsletter Column */}
                  <div className="footer__column footer__column--newsletter">
                    <h5 className="footer__heading">Get on the list</h5>
                    <NewsletterForm />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Bottom / Utilities */}
            <div className="footer__bottom">
              <div className="footer__inner page-width">
                <div className="footer__bottom-content">
                  <p className="footer__copyright">
                    © {new Date().getFullYear()} {header.shop.name}. All rights reserved.
                  </p>
                  <nav className="footer__policies">
                    <NavLink to="/policies/privacy-policy" className="footer__policy-link">
                      Privacy Policy
                    </NavLink>
                    <NavLink to="/policies/terms-of-service" className="footer__policy-link">
                      Terms of Service
                    </NavLink>
                    <NavLink to="/policies/refund-policy" className="footer__policy-link">
                      Refund Policy
                    </NavLink>
                  </nav>
                </div>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

/**
 * Footer menu navigation
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
 *   publicStoreDomain: string;
 * }}
 */
function FooterMenu({menu, primaryDomainUrl, publicStoreDomain}) {
  return (
    <nav className="footer__nav">
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        const isExternal = !url.startsWith('/');

        return isExternal ? (
          <a
            href={url}
            key={item.id}
            rel="noopener noreferrer"
            target="_blank"
            className="footer__link"
          >
            {item.title}
          </a>
        ) : (
          <NavLink
            end
            key={item.id}
            prefetch="intent"
            className="footer__link"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

/**
 * Social Links component - uses dynamic links from metaobject
 * Falls back to default links if metaobject data is not available
 * @param {{socialLinks: object, getSocialLink: function}}
 */
function SocialLinks({socialLinks, getSocialLink}) {
  // Define social platforms with fallback URLs
  const platforms = [
    {key: 'instagram', label: 'Instagram', fallback: 'https://instagram.com'},
    {key: 'twitter', label: 'Twitter', fallback: 'https://twitter.com'},
    {key: 'facebook', label: 'Facebook', fallback: 'https://facebook.com'},
    {key: 'tiktok', label: 'TikTok', fallback: null},
    {key: 'pinterest', label: 'Pinterest', fallback: null},
    {key: 'youtube', label: 'YouTube', fallback: null},
  ];

  // Filter to only show platforms that have URLs (from metaobject or fallback)
  const activePlatforms = platforms.filter((platform) => {
    const url = getSocialLink?.(platform.key) || socialLinks?.[platform.key] || platform.fallback;
    return url && typeof url === 'string' && url.length > 0;
  });

  // If no social links at all, show default ones
  if (activePlatforms.length === 0) {
    return (
      <nav className="footer__nav">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer__link">
          Instagram
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer__link">
          Twitter
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="footer__link">
          Facebook
        </a>
      </nav>
    );
  }

  return (
    <nav className="footer__nav">
      {activePlatforms.map((platform) => {
        const url = getSocialLink?.(platform.key) || socialLinks?.[platform.key] || platform.fallback;
        return (
          <a
            key={platform.key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            {platform.label}
          </a>
        );
      })}
    </nav>
  );
}

/**
 * Newsletter signup form
 */
function NewsletterForm() {
  return (
    <form className="footer__newsletter-form" action="#" method="POST">
      <div className="footer__newsletter-input-wrapper">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="footer__newsletter-input"
          required
        />
        <button type="submit" className="footer__newsletter-button">
          OK
        </button>
      </div>
    </form>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
