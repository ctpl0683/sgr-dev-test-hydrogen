import {Analytics, getShopAnalytics, useNonce, getSeoMeta} from '@shopify/hydrogen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  Await,
} from 'react-router';
import {Suspense} from 'react';
import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import {
  THEME_SETTINGS_QUERY,
  ANNOUNCEMENT_BAR_QUERY,
  SOCIAL_LINKS_QUERY,
} from '~/graphql/storefront/ThemeSettingsQuery';
import resetStyles from '~/styles/reset.css?url';
import themeStyles from '~/styles/theme/index.css?url';
import componentStyles from '~/styles/components/index.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from './components/PageLayout';
import {ThemeSettingsProvider} from '~/context/ThemeSettingsContext';
import {WishlistProvider} from '~/context/WishlistContext';
import {AnnouncementBar} from '~/components/AnnouncementBar';
import {ThemeStyles} from '~/components/ThemeStyles';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') return true;

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) return true;

  // Defaulting to no revalidation for root loader data to improve performance.
  // When using this feature, you risk your UI getting out of sync with your server.
  // Use with caution. If you are uncomfortable with this optimization, update the
  // line below to `return defaultShouldRevalidate` instead.
  // For more details see: https://remix.run/docs/en/main/route/should-revalidate
  return false;
};

/**
 * The main and reset stylesheets are added in the Layout component
 * to prevent a bug in development HMR updates.
 *
 * This avoids the "failed to execute 'insertBefore' on 'Node'" error
 * that occurs after editing and navigating to another page.
 *
 * It's a temporary fix until the issue is resolved.
 * https://github.com/remix-run/remix/issues/9242
 */
export function links() {
  return [
    {
      rel: 'preconnect',
      href: 'https://cdn.shopify.com',
    },
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {
      rel: 'preconnect',
      href: 'https://staticw2.yotpo.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Chivo:wght@400;700&family=Inter:wght@400;500;600;700&display=swap',
    },
    // Favicon is now set dynamically from metaobject settings in Layout component
    // Fallback favicon is still imported for cases where metaobject is not set
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
  ];
}

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      // localize the privacy banner
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context}) {
  const {storefront} = context;

  const [header, themeSettingsData, announcementData, socialLinksData] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        headerMenuHandle: 'main-menu', // Adjust to your header menu handle
      },
    }),
    // Theme settings from metaobjects
    storefront.query(THEME_SETTINGS_QUERY, {
      cache: storefront.CacheShort(),
    }).catch(() => ({metaobject: null})),
    storefront.query(ANNOUNCEMENT_BAR_QUERY, {
      cache: storefront.CacheShort(),
    }).catch(() => ({metaobject: null})),
    storefront.query(SOCIAL_LINKS_QUERY, {
      cache: storefront.CacheLong(),
    }).catch(() => ({metaobject: null})),
  ]);

  return {
    header,
    themeSettings: themeSettingsData?.metaobject || null,
    announcement: announcementData?.metaobject || null,
    socialLinks: socialLinksData?.metaobject || null,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const {storefront, customerAccount, cart} = context;

  // defer the footer query (below the fold)
  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        footerMenuHandle: 'footer', // Adjust to your footer menu handle
      },
    })
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  // Get customer ID for wishlist functionality
  const customerId = customerAccount
    .query(CUSTOMER_ID_QUERY)
    .then((result) => result?.data?.customer?.id || null)
    .catch(() => null);

  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
    customerId,
  };
}

/**
 * @param {{children?: React.ReactNode}}
 */
export function Layout({children}) {
  const nonce = useNonce();
  /** @type {RootLoader} */
  const data = useRouteLoaderData('root');

  // Get dynamic favicon from theme settings metaobject
  const dynamicFavicon = getDynamicFavicon(data?.themeSettings);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {/* Dynamic favicon from metaobject - overrides static one if available */}
        {dynamicFavicon && (
          <link rel="icon" type={dynamicFavicon.type} href={dynamicFavicon.url} />
        )}
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={themeStyles}></link>
        <link rel="stylesheet" href={componentStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        {/* Tidio Live Chat Widget */}
        <script src="//code.tidio.co/p4ksdctzfb88d0604qxigbp8cqr7ne20.js" async></script>
      </body>
    </html>
  );
}

/**
 * Extract favicon URL from theme settings metaobject
 * @param {object|null} themeSettings - Theme settings metaobject
 * @returns {{url: string, type: string}|null}
 */
function getDynamicFavicon(themeSettings) {
  if (!themeSettings?.fields) return null;

  const faviconField = themeSettings.fields.find(
    (field) => field?.key === 'favicon'
  );

  if (!faviconField) return null;

  // Handle file_reference type
  const imageUrl = faviconField.reference?.image?.url;
  if (!imageUrl) return null;

  // Determine image type from URL
  const type = getImageMimeType(imageUrl);

  return {url: imageUrl, type};
}

/**
 * Get MIME type from image URL
 * @param {string} url - Image URL
 * @returns {string}
 */
function getImageMimeType(url) {
  if (!url || typeof url !== 'string') return 'image/x-icon';
  
  const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  
  const mimeTypes = {
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'ico': 'image/x-icon',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };

  return mimeTypes[extension] || 'image/x-icon';
}

export default function App() {
  /** @type {RootLoader} */
  const data = useRouteLoaderData('root');

  if (!data) {
    return <Outlet />;
  }

  return (
    <ThemeSettingsProvider
      settings={data.themeSettings}
      announcement={data.announcement}
      socialLinks={data.socialLinks}
    >
      <Suspense fallback={<WishlistProviderFallback data={data} />}>
        <Await resolve={data.customerId} errorElement={<WishlistProviderFallback data={data} />}>
          {(customerId) => (
            <WishlistProvider customerId={customerId}>
              <ThemeStyles />
              <Analytics.Provider
                cart={data.cart}
                shop={data.shop}
                consent={data.consent}
              >
                <AnnouncementBar />
                <PageLayout {...data}>
                  <Outlet />
                </PageLayout>
              </Analytics.Provider>
            </WishlistProvider>
          )}
        </Await>
      </Suspense>
    </ThemeSettingsProvider>
  );
}

/**
 * Fallback component when customerId is loading or errored
 */
function WishlistProviderFallback({data}) {
  return (
    <WishlistProvider customerId={null}>
      <ThemeStyles />
      <Analytics.Provider
        cart={data.cart}
        shop={data.shop}
        consent={data.consent}
      >
        <AnnouncementBar />
        <PageLayout {...data}>
          <Outlet />
        </PageLayout>
      </Analytics.Provider>
    </WishlistProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}

/** @typedef {LoaderReturnData} RootLoader */

/** @typedef {import('react-router').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('./+types/root').Route} Route */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */

// Customer Account API query to get customer ID for wishlist
const CUSTOMER_ID_QUERY = `
  query CustomerIdQuery {
    customer {
      id
    }
  }
`;
