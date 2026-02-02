import {Suspense} from 'react';
import {Await, NavLink, useAsyncValue, useLocation} from 'react-router';
import {useAnalytics, useOptimisticCart, Image} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {useThemeSettings} from '~/context/ThemeSettingsContext';
import clsx from 'clsx';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
} from 'lucide-react';

/**
 * Header component matching Ritual theme design
 * Features: Centered logo, left menu, sticky header, transparent on homepage
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  
  // Get logo from theme settings metaobject
  const {settings} = useThemeSettings();
  const logoImage = settings?.logo;

  return (
    <header
      className={clsx(
        'header',
        isHomepage && 'header--transparent'
      )}
    >
      <div className="header__inner">
        {/* Mobile Menu Toggle - Left on mobile */}
        <div className="header__mobile-toggle">
          <HeaderMenuMobileToggle />
        </div>

        {/* Desktop Navigation - Left */}
        <nav className="header__nav-desktop">
          <HeaderMenu
            menu={menu}
            viewport="desktop"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
        </nav>

        {/* Logo - Center */}
        <div className="header__logo">
          <NavLink prefetch="intent" to="/" end>
            {logoImage?.image?.url ? (
              <img
                src={logoImage.image.url}
                alt={logoImage.image.altText || shop.name}
                className="header__logo-image"
                width={logoImage.image.width || 150}
                height={logoImage.image.height || 40}
              />
            ) : (
              <span className="header__logo-text">{shop.name}</span>
            )}
          </NavLink>
        </div>

        {/* Actions - Right */}
        <div className="header__actions">
          <SearchToggle />
          <AccountLink isLoggedIn={isLoggedIn} />
          <CartToggle cart={cart} />
        </div>
      </div>
    </header>
  );
}

/**
 * Header Navigation Menu
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const {close} = useAside();
  const isMobile = viewport === 'mobile';

  return (
    <nav
      className={clsx(
        'header-menu',
        isMobile ? 'header-menu--mobile' : 'header-menu--desktop'
      )}
      role="navigation"
    >
      {isMobile && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          className="header-menu__link"
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        return (
          <NavLink
            className={({isActive}) =>
              clsx('header-menu__link', isActive && 'header-menu__link--active')
            }
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
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
 * Mobile menu toggle button
 */
function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      className="header__icon-button"
      onClick={() => open('mobile')}
      aria-label="Open menu"
    >
      <Menu size={20} strokeWidth={1.5} />
    </button>
  );
}

/**
 * Search toggle button
 */
function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className="header__icon-button"
      onClick={() => open('search')}
      aria-label="Search"
    >
      <Search size={20} strokeWidth={1.5} />
    </button>
  );
}

/**
 * Account link
 * @param {{isLoggedIn: Promise<boolean>}}
 */
function AccountLink({isLoggedIn}) {
  return (
    <NavLink
      prefetch="intent"
      to="/account"
      className="header__icon-button"
      aria-label="Account"
    >
      <User size={20} strokeWidth={1.5} />
    </NavLink>
  );
}

/**
 * Cart badge with count
 * @param {{count: number | null}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      className="header__icon-button header__cart-button"
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
      aria-label={`Cart with ${count ?? 0} items`}
    >
      <ShoppingBag size={20} strokeWidth={1.5} />
      {count !== null && count > 0 && (
        <span className="header__cart-count">{count}</span>
      )}
    </button>
  );
}

/**
 * Cart toggle with suspense
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
