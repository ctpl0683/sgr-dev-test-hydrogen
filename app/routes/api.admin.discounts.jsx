import {json} from '@remix-run/server-runtime';
import {
  createAdminApiClient,
  getDiscountFunctions,
  getAutomaticDiscounts,
  createTierPricingDiscount,
  updateTierPricingDiscount,
  deleteTierPricingDiscount,
  toggleDiscountStatus,
} from '~/lib/admin.server';

/**
 * API Route for Discount CRUD operations
 * 
 * GET: List all tier pricing discounts
 * POST: Create new discount
 * PUT: Update existing discount
 * DELETE: Delete discount
 */

// Simple auth check - in production, use proper session management
function getAdminCredentials(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  // For MVP: token format is "shop:accessToken" base64 encoded
  try {
    const token = authHeader.slice(7);
    const decoded = atob(token);
    const [shop, accessToken] = decoded.split(':');
    
    if (!shop || !accessToken) {
      return null;
    }
    
    return { shop, accessToken };
  } catch {
    return null;
  }
}

export async function loader({request}) {
  const credentials = getAdminCredentials(request);
  
  if (!credentials) {
    return json({error: 'Unauthorized'}, {status: 401});
  }
  
  try {
    const adminClient = createAdminApiClient(credentials.shop, credentials.accessToken);
    
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    if (action === 'functions') {
      const functions = await getDiscountFunctions(adminClient);
      return json({functions});
    }
    
    const discounts = await getAutomaticDiscounts(adminClient);
    return json({discounts});
  } catch (error) {
    console.error('Admin API error:', error);
    return json({error: error.message}, {status: 500});
  }
}

export async function action({request}) {
  const credentials = getAdminCredentials(request);
  
  if (!credentials) {
    return json({error: 'Unauthorized'}, {status: 401});
  }
  
  const adminClient = createAdminApiClient(credentials.shop, credentials.accessToken);
  const method = request.method;
  
  try {
    const body = await request.json();
    
    switch (method) {
      case 'POST': {
        const {title, functionId, cityRules, startsAt} = body;
        
        if (!title || !functionId || !cityRules) {
          return json({error: 'Missing required fields'}, {status: 400});
        }
        
        const discount = await createTierPricingDiscount(adminClient, {
          title,
          functionId,
          cityRules,
          startsAt,
        });
        
        return json({discount, success: true});
      }
      
      case 'PUT': {
        const {discountId, title, cityRules, startsAt, endsAt, activate} = body;
        
        if (!discountId) {
          return json({error: 'Missing discountId'}, {status: 400});
        }
        
        // Toggle status
        if (typeof activate === 'boolean') {
          await toggleDiscountStatus(adminClient, discountId, activate);
          return json({success: true});
        }
        
        // Update config
        const discount = await updateTierPricingDiscount(adminClient, {
          discountId,
          title,
          cityRules,
          startsAt,
          endsAt,
        });
        
        return json({discount, success: true});
      }
      
      case 'DELETE': {
        const {discountId} = body;
        
        if (!discountId) {
          return json({error: 'Missing discountId'}, {status: 400});
        }
        
        await deleteTierPricingDiscount(adminClient, discountId);
        return json({success: true});
      }
      
      default:
        return json({error: 'Method not allowed'}, {status: 405});
    }
  } catch (error) {
    console.error('Admin API action error:', error);
    return json({error: error.message}, {status: 500});
  }
}
