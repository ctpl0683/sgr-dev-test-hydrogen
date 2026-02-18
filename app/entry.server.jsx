import {ServerRouter} from 'react-router';
import {isbot} from 'isbot';
import {renderToReadableStream} from 'react-dom/server';
import {createContentSecurityPolicy} from '@shopify/hydrogen';

/**
 * @param {Request} request
 * @param {number} responseStatusCode
 * @param {Headers} responseHeaders
 * @param {EntryContext} reactRouterContext
 * @param {HydrogenRouterContextProvider} context
 */
export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  reactRouterContext,
  context,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
  });

  // Modify CSP header to allow Yotpo domains and Google Fonts
  const yotpoDomains = 'https://staticw2.yotpo.com https://*.yotpo.com';
  const googleFonts = 'https://fonts.googleapis.com https://fonts.gstatic.com';
  
  let modifiedHeader = header;
  
  // Add Yotpo to default-src (fallback for script-src-elem)
  if (modifiedHeader.includes('default-src')) {
    modifiedHeader = modifiedHeader.replace(/default-src([^;]*)/, `default-src$1 ${yotpoDomains}`);
  }
  
  // Add Yotpo to script-src
  if (modifiedHeader.includes('script-src')) {
    modifiedHeader = modifiedHeader.replace(/script-src([^;]*)/, `script-src$1 ${yotpoDomains}`);
  }
  
  // Add script-src-elem explicitly for Yotpo
  if (!modifiedHeader.includes('script-src-elem')) {
    modifiedHeader = modifiedHeader.replace(
      /script-src([^;]*);/,
      `script-src$1; script-src-elem 'self' 'unsafe-inline' https://cdn.shopify.com ${yotpoDomains};`
    );
  }
  
  // Add Yotpo to connect-src
  if (modifiedHeader.includes('connect-src')) {
    modifiedHeader = modifiedHeader.replace(/connect-src([^;]*)/, `connect-src$1 ${yotpoDomains}`);
  }
  
  // Add Yotpo and Google Fonts to style-src
  if (modifiedHeader.includes('style-src')) {
    modifiedHeader = modifiedHeader.replace(/style-src([^;]*)/, `style-src$1 ${yotpoDomains} ${googleFonts}`);
  }
  
  // Add style-src-elem for Google Fonts
  if (!modifiedHeader.includes('style-src-elem')) {
    modifiedHeader = modifiedHeader.replace(
      /style-src([^;]*);/,
      `style-src$1; style-src-elem 'self' 'unsafe-inline' https://cdn.shopify.com ${yotpoDomains} ${googleFonts};`
    );
  }
  
  // Add Yotpo to img-src
  if (modifiedHeader.includes('img-src')) {
    modifiedHeader = modifiedHeader.replace(/img-src([^;]*)/, `img-src$1 ${yotpoDomains}`);
  }
  
  // Add Yotpo to frame-src
  if (modifiedHeader.includes('frame-src')) {
    modifiedHeader = modifiedHeader.replace(/frame-src([^;]*)/, `frame-src$1 ${yotpoDomains}`);
  }
  
  // Add font-src for Google Fonts
  if (modifiedHeader.includes('font-src')) {
    modifiedHeader = modifiedHeader.replace(/font-src([^;]*)/, `font-src$1 ${googleFonts}`);
  }

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get('user-agent'))) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', modifiedHeader);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/** @typedef {import('@shopify/hydrogen').HydrogenRouterContextProvider} HydrogenRouterContextProvider */
/** @typedef {import('react-router').EntryContext} EntryContext */
