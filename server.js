import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';

/**
 * Export a fetch handler in module format.
 */
export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} executionContext
   * @return {Promise<Response>}
   */
  async fetch(request, env, executionContext) {
    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      // Add CSP headers to allow Yotpo and other required external scripts
      const cspHeader = response.headers.get('Content-Security-Policy');
      if (cspHeader) {
        // Modify existing CSP to include Yotpo domains
        let newCsp = cspHeader;
        
        // Add Yotpo to script-src
        if (newCsp.includes('script-src')) {
          newCsp = newCsp.replace(
            /script-src([^;]*)/,
            "script-src$1 https://staticw2.yotpo.com https://*.yotpo.com"
          );
        }
        
        // Add Yotpo to connect-src
        if (newCsp.includes('connect-src')) {
          newCsp = newCsp.replace(
            /connect-src([^;]*)/,
            "connect-src$1 https://*.yotpo.com"
          );
        }
        
        // Add Yotpo to style-src
        if (newCsp.includes('style-src')) {
          newCsp = newCsp.replace(
            /style-src([^;]*)/,
            "style-src$1 https://*.yotpo.com"
          );
        }
        
        // Add Yotpo to img-src
        if (newCsp.includes('img-src')) {
          newCsp = newCsp.replace(
            /img-src([^;]*)/,
            "img-src$1 https://*.yotpo.com"
          );
        }
        
        // Add Yotpo to frame-src
        if (newCsp.includes('frame-src')) {
          newCsp = newCsp.replace(
            /frame-src([^;]*)/,
            "frame-src$1 https://*.yotpo.com"
          );
        }
        
        response.headers.set('Content-Security-Policy', newCsp);
      }

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
