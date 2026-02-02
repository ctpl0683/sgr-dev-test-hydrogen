import {NavLink} from 'react-router';
import {useAside} from '~/components/Aside';
import clsx from 'clsx';
import {X, ChevronRight} from 'lucide-react';

/**
 * Mobile Menu Drawer component matching Ritual theme
 * Features: Full-screen overlay, accordion menu, social links
 * @param {{
 *   menu: HeaderQuery['menu'];
 *   primaryDomainUrl: string;
 *   publicStoreDomain: string;
 *   shop: HeaderQuery['shop'];
 * }}
 */
export function MobileMenu({menu, primaryDomainUrl, publicStoreDomain, shop}) {
  const {close} = useAside();

  return (
    <div className="mobile-menu">
      {/* Header */}
      <div className="mobile-menu__header">
        <span className="mobile-menu__title">MENU</span>
        <button
          className="mobile-menu__close"
          onClick={close}
          aria-label="Close menu"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mobile-menu__nav">
        <NavLink
          to="/"
          className={({isActive}) =>
            clsx('mobile-menu__link', isActive && 'mobile-menu__link--active')
          }
          onClick={close}
          end
        >
          Home
        </NavLink>

        {(menu || FALLBACK_MENU).items.map((item) => {
          if (!item.url) return null;

          const url =
            item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
              ? new URL(item.url).pathname
              : item.url;

          const hasChildren = item.items && item.items.length > 0;

          return (
            <div key={item.id} className="mobile-menu__item">
              <NavLink
                to={url}
                className={({isActive}) =>
                  clsx(
                    'mobile-menu__link',
                    isActive && 'mobile-menu__link--active'
                  )
                }
                onClick={close}
                end
              >
                {item.title}
                {hasChildren && (
                  <ChevronRight size={16} className="mobile-menu__chevron" />
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mobile-menu__footer">
        <div className="mobile-menu__account-links">
          <NavLink to="/account" className="mobile-menu__footer-link" onClick={close}>
            Account
          </NavLink>
          <NavLink to="/account/orders" className="mobile-menu__footer-link" onClick={close}>
            Orders
          </NavLink>
        </div>

        <div className="mobile-menu__social">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-menu__social-link"
          >
            Instagram
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-menu__social-link"
          >
            Twitter
          </a>
        </div>
      </div>
    </div>
  );
}

const FALLBACK_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      title: 'Collections',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      title: 'Blog',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      title: 'Policies',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      title: 'About',
      url: '/pages/about',
      items: [],
    },
  ],
};

/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
