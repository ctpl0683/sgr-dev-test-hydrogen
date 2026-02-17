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

  // Modify CSP header to allow Yotpo domains
  const yotpoDomains = 'https://staticw2.yotpo.com https://*.yotpo.com';
  let modifiedHeader = header;
  
  // Add Yotpo to script-src
  modifiedHeader = modifiedHeader.replace(
    /script-src([^;]*)/,
    `script-src$1 ${yotpoDomains}`
  );
  
  // Add Yotpo to connect-src
  modifiedHeader = modifiedHeader.replace(
    /connect-src([^;]*)/,
    `connect-src$1 ${yotpoDomains}`
  );
  
  // Add Yotpo to style-src
  modifiedHeader = modifiedHeader.replace(
    /style-src([^;]*)/,
    `style-src$1 ${yotpoDomains}`
  );
  
  // Add Yotpo to img-src
  modifiedHeader = modifiedHeader.replace(
    /img-src([^;]*)/,
    `img-src$1 ${yotpoDomains}`
  );
  
  // Add Yotpo to frame-src
  modifiedHeader = modifiedHeader.replace(
    /frame-src([^;]*)/,
    `frame-src$1 ${yotpoDomains}`
  );

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
