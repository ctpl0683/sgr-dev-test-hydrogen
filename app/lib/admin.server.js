/**
 * Admin API utilities for Shopify Admin operations
 * Used for discount function CRUD operations
 */

/**
 * Create Admin API client with access token
 * For MVP, we use a simple token-based approach
 */
export function createAdminApiClient(shop, accessToken) {
  const apiVersion = '2024-10';
  
  return {
    async query(query, variables = {}) {
      const response = await fetch(
        `https://${shop}/admin/api/${apiVersion}/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
          },
          body: JSON.stringify({ query, variables }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Admin API error: ${response.status}`);
      }
      
      return response.json();
    },
  };
}

/**
 * Get all Shopify Functions of type product_discounts
 */
export async function getDiscountFunctions(adminClient) {
  const query = `
    query {
      shopifyFunctions(first: 25) {
        nodes {
          id
          title
          apiType
          app {
            title
          }
        }
      }
    }
  `;
  
  const result = await adminClient.query(query);
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  return result.data.shopifyFunctions.nodes.filter(
    f => f.apiType === 'product_discounts'
  );
}

/**
 * Get all automatic app discounts
 */
export async function getAutomaticDiscounts(adminClient) {
  const query = `
    query {
      discountNodes(first: 50, query: "type:automatic") {
        nodes {
          id
          discount {
            ... on DiscountAutomaticApp {
              title
              status
              startsAt
              endsAt
              discountId
              appDiscountType {
                functionId
                title
              }
            }
          }
          metafield(namespace: "$app:tier-pricing-discount", key: "function-configuration") {
            value
          }
        }
      }
    }
  `;
  
  const result = await adminClient.query(query);
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  // Filter to only tier pricing discounts
  return result.data.discountNodes.nodes.filter(
    node => node.discount?.appDiscountType?.title?.toLowerCase().includes('tier')
  );
}

/**
 * Create a new automatic discount with tier pricing configuration
 */
export async function createTierPricingDiscount(adminClient, { title, functionId, cityRules, startsAt }) {
  const mutation = `
    mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
        automaticAppDiscount {
          discountId
          title
          status
          startsAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    automaticAppDiscount: {
      title,
      functionId,
      startsAt: startsAt || new Date().toISOString(),
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: false,
        shippingDiscounts: true,
      },
      metafields: [
        {
          namespace: "$app:tier-pricing-discount",
          key: "function-configuration",
          type: "json",
          value: JSON.stringify({ cityRules }),
        },
      ],
    },
  };
  
  const result = await adminClient.query(mutation, variables);
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  if (result.data.discountAutomaticAppCreate.userErrors.length > 0) {
    throw new Error(result.data.discountAutomaticAppCreate.userErrors[0].message);
  }
  
  return result.data.discountAutomaticAppCreate.automaticAppDiscount;
}

/**
 * Update an existing discount's configuration
 */
export async function updateTierPricingDiscount(adminClient, { discountId, title, cityRules, startsAt, endsAt }) {
  const mutation = `
    mutation discountAutomaticAppUpdate($automaticAppDiscount: DiscountAutomaticAppInput!, $id: ID!) {
      discountAutomaticAppUpdate(automaticAppDiscount: $automaticAppDiscount, id: $id) {
        automaticAppDiscount {
          discountId
          title
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const variables = {
    id: discountId,
    automaticAppDiscount: {
      title,
      startsAt,
      endsAt,
      metafields: [
        {
          namespace: "$app:tier-pricing-discount",
          key: "function-configuration",
          type: "json",
          value: JSON.stringify({ cityRules }),
        },
      ],
    },
  };
  
  const result = await adminClient.query(mutation, variables);
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  if (result.data.discountAutomaticAppUpdate.userErrors.length > 0) {
    throw new Error(result.data.discountAutomaticAppUpdate.userErrors[0].message);
  }
  
  return result.data.discountAutomaticAppUpdate.automaticAppDiscount;
}

/**
 * Delete a discount
 */
export async function deleteTierPricingDiscount(adminClient, discountId) {
  const mutation = `
    mutation discountAutomaticDelete($id: ID!) {
      discountAutomaticDelete(id: $id) {
        deletedAutomaticDiscountId
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const result = await adminClient.query(mutation, { id: discountId });
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  if (result.data.discountAutomaticDelete.userErrors.length > 0) {
    throw new Error(result.data.discountAutomaticDelete.userErrors[0].message);
  }
  
  return result.data.discountAutomaticDelete.deletedAutomaticDiscountId;
}

/**
 * Activate or deactivate a discount
 */
export async function toggleDiscountStatus(adminClient, discountId, activate) {
  const mutation = activate
    ? `mutation discountAutomaticActivate($id: ID!) {
        discountAutomaticActivate(id: $id) {
          automaticDiscountNode { id }
          userErrors { field message }
        }
      }`
    : `mutation discountAutomaticDeactivate($id: ID!) {
        discountAutomaticDeactivate(id: $id) {
          automaticDiscountNode { id }
          userErrors { field message }
        }
      }`;
  
  const result = await adminClient.query(mutation, { id: discountId });
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  const data = activate 
    ? result.data.discountAutomaticActivate 
    : result.data.discountAutomaticDeactivate;
  
  if (data.userErrors.length > 0) {
    throw new Error(data.userErrors[0].message);
  }
  
  return true;
}
