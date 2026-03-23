/**
 * Script to create the city-based tier pricing discount via Admin API
 * 
 * Usage:
 * 1. Get your Admin API access token from Shopify Admin
 * 2. Run: SHOPIFY_ADMIN_TOKEN=your_token SHOPIFY_STORE=your-store.myshopify.com node scripts/create-tier-discount.js
 */

const CITY_TIER_CONFIG = {
  cityRules: [
    {
      city: "bangalore",
      tiers: [
        { minQty: 3, discountPercent: 10 },
        { minQty: 6, discountPercent: 15 },
        { minQty: 11, discountPercent: 20 },
      ],
    },
    {
      city: "mumbai",
      tiers: [
        { minQty: 3, discountPercent: 20 },
        { minQty: 6, discountPercent: 25 },
        { minQty: 11, discountPercent: 30 },
      ],
    },
    {
      city: "chennai",
      tiers: [
        { minQty: 3, discountPercent: 12 },
        { minQty: 6, discountPercent: 18 },
        { minQty: 11, discountPercent: 22 },
      ],
    },
    {
      city: "delhi",
      tiers: [
        { minQty: 3, discountPercent: 8 },
        { minQty: 6, discountPercent: 12 },
        { minQty: 11, discountPercent: 18 },
      ],
    },
    {
      city: "hyderabad",
      tiers: [
        { minQty: 3, discountPercent: 15 },
        { minQty: 6, discountPercent: 20 },
        { minQty: 11, discountPercent: 25 },
      ],
    },
  ],
};

async function createDiscount() {
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  const store = process.env.SHOPIFY_STORE;

  if (!token || !store) {
    console.error('Missing environment variables:');
    console.error('  SHOPIFY_ADMIN_TOKEN - Your Admin API access token');
    console.error('  SHOPIFY_STORE - Your store domain (e.g., your-store.myshopify.com)');
    process.exit(1);
  }

  // First, get the function ID
  const functionsQuery = `
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

  const functionsResponse = await fetch(`https://${store}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query: functionsQuery }),
  });

  const functionsData = await functionsResponse.json();
  
  if (functionsData.errors) {
    console.error('Error fetching functions:', functionsData.errors);
    process.exit(1);
  }

  const tierPricingFunction = functionsData.data.shopifyFunctions.nodes.find(
    f => f.title.toLowerCase().includes('tier') && f.apiType === 'product_discounts'
  );

  if (!tierPricingFunction) {
    console.error('Tier Pricing Discount function not found. Available functions:');
    console.log(functionsData.data.shopifyFunctions.nodes);
    process.exit(1);
  }

  console.log('Found function:', tierPricingFunction.title, tierPricingFunction.id);

  // Create the automatic discount
  const createMutation = `
    mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
        automaticAppDiscount {
          discountId
          title
          startsAt
          endsAt
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
    automaticAppDiscount: {
      title: "City Bulk Discount",
      functionId: tierPricingFunction.id,
      startsAt: new Date().toISOString(),
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
          value: JSON.stringify(CITY_TIER_CONFIG),
        },
      ],
    },
  };

  const createResponse = await fetch(`https://${store}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query: createMutation, variables }),
  });

  const createData = await createResponse.json();

  if (createData.errors) {
    console.error('GraphQL errors:', createData.errors);
    process.exit(1);
  }

  if (createData.data.discountAutomaticAppCreate.userErrors.length > 0) {
    console.error('User errors:', createData.data.discountAutomaticAppCreate.userErrors);
    process.exit(1);
  }

  console.log('✅ Discount created successfully!');
  console.log(createData.data.discountAutomaticAppCreate.automaticAppDiscount);
}

createDiscount().catch(console.error);
