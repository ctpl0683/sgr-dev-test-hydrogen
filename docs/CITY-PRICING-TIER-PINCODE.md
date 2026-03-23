# City-Based Pricing, Tier Pricing & Pincode Serviceability

This document provides comprehensive documentation for the three features implemented in this Hydrogen storefront.

## Table of Contents

1. [Feature 1: City-Based Pricing](#feature-1-city-based-pricing)
2. [Feature 2: Tier Pricing](#feature-2-tier-pricing)
3. [Feature 3: Pincode Serviceability](#feature-3-pincode-serviceability)
4. [Metaobject Schemas](#metaobject-schemas)
5. [Shopify Admin Setup](#shopify-admin-setup)
6. [API Reference](#api-reference)

---

## Feature 1: City-Based Pricing

### Overview

Products use variants with a "City" option (e.g., Bangalore, Chennai) to provide city-specific pricing. The system automatically resolves the correct variant based on the user's selected city.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  CityContext    │────▶│  Variant Resolver │────▶│  Product Page   │
│  (Global State) │     │  (SSR Compatible) │     │  (No Flicker)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│  Cookie Storage │                              │  Cart + Checkout│
│  (Persistence)  │                              │  (Attributes)   │
└─────────────────┘                              └─────────────────┘
```

### Files Created/Modified

| File | Purpose |
|------|---------|
| `app/context/CityContext.jsx` | Global city state management |
| `app/lib/city-variant-resolver.js` | Variant resolution utilities |
| `app/components/city/CitySelector.jsx` | UI components for city selection |
| `app/routes/api.set-city.jsx` | API endpoint for city persistence |
| `app/styles/components/city.css` | Styles for city components |
| `app/components/AddToCartButton.jsx` | Modified to include city attribute |
| `app/root.jsx` | Added CityProvider |
| `app/routes/($locale).products.$handle.jsx` | SSR variant resolution |

### Usage

#### 1. City Selector in Header

The `CitySelectorCompact` component is automatically added to the header:

```jsx
import {CitySelectorCompact} from '~/components/city/CitySelector';

// In your header
<CitySelectorCompact />
```

#### 2. Access City in Components

```jsx
import {useCity} from '~/context/CityContext';

function MyComponent() {
  const {selectedCity, setCity, getCityLabel} = useCity();
  
  return (
    <div>
      <p>Current city: {getCityLabel()}</p>
      <button onClick={() => setCity('chennai')}>
        Switch to Chennai
      </button>
    </div>
  );
}
```

#### 3. Variant Resolution in Loaders

```jsx
import {getCityFromRequest} from '~/context/CityContext';
import {resolveVariantForCity} from '~/lib/city-variant-resolver';

export async function loader({request, context}) {
  const selectedCity = getCityFromRequest(request);
  
  // ... fetch product
  
  const {variant, resolvedByCity} = resolveVariantForCity(
    product,
    selectedCity,
    new URL(request.url).searchParams
  );
  
  return {product, selectedVariant: variant};
}
```

### Supported Cities

Cities are now **dynamically fetched from a Shopify metaobject** (`supported_cities`). If the metaobject is not configured, fallback cities are used:

- Bangalore (default)
- Chennai
- Mumbai
- Delhi
- Hyderabad

To add or modify cities, update the `supported_cities` metaobject in Shopify Admin (see [Metaobject Schemas](#metaobject-schemas)).

### Cart Integration

When adding to cart, the `selected_city` attribute is automatically included:

```javascript
// Cart line attributes
{
  merchandiseId: "gid://shopify/ProductVariant/123",
  quantity: 1,
  attributes: [
    {key: "selected_city", value: "bangalore"}
  ]
}
```

---

## Feature 2: City-Based Tier Pricing

### Overview

**Discount based on TOTAL quantity of items from a specific city in the cart.**

Example:
- Buy 3 items from Bangalore → 10% off all Bangalore items
- Buy 3 items from Mumbai → 20% off all Mumbai items
- Each city has its own tier rules

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Cart Lines     │────▶│  Calculate Total │────▶│  Find Applicable│
│  (with city)    │     │  Qty Per City    │     │  Tier Per City  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Discount       │◀────│  Apply % Off to  │◀────│  City Tier      │
│  Applied        │     │  All City Items  │     │  Rules (Config) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### How It Works

1. Customer adds products to cart (each line has `selected_city` attribute)
2. Discount Function calculates **total quantity per city**
3. Looks up tier rules for each city
4. Applies percentage discount to **all items from that city**

### Files

| File | Purpose |
|------|---------|
| `app/lib/tier-pricing.js` | City tier calculation utilities |
| `app/graphql/storefront/CityTierPricingQuery.js` | Query for tier configs |
| `app/components/pricing/TierPricingTable.jsx` | UI components |
| `extensions/tier-pricing-function/` | Shopify Discount Function |

### City Tier Rules Format

Stored in the **Discount Function configuration** (not product metafield):

```json
[
  {
    "city": "bangalore",
    "tiers": [
      {"minQty": 3, "maxQty": 5, "discountPercent": 10, "label": "3-5 items"},
      {"minQty": 6, "maxQty": 10, "discountPercent": 15, "label": "6-10 items"},
      {"minQty": 11, "discountPercent": 20, "label": "11+ items"}
    ]
  },
  {
    "city": "mumbai",
    "tiers": [
      {"minQty": 3, "maxQty": 5, "discountPercent": 20, "label": "3-5 items"},
      {"minQty": 6, "maxQty": 10, "discountPercent": 25, "label": "6-10 items"},
      {"minQty": 11, "discountPercent": 30, "label": "11+ items"}
    ]
  }
]
```

### Usage

#### Calculate City Discount

```javascript
import {calculateCityDiscount, calculateCityQuantities} from '~/lib/tier-pricing';

// Cart items with city attribute
const cartItems = [
  {city: 'bangalore', quantity: 2},
  {city: 'bangalore', quantity: 1},
  {city: 'mumbai', quantity: 3},
];

// Calculate totals per city
const cityQuantities = calculateCityQuantities(cartItems);
// Result: {bangalore: 3, mumbai: 3}

// Get discount for Bangalore
const discount = calculateCityDiscount(cityTierConfigs, 'bangalore', 3);
// Result: {discountPercent: 10, tier: {...}, message: "10% off 3 items from bangalore"}
```

### Deploying the Discount Function

```bash
cd hydrogen-store-sgr
shopify app deploy
```

Then in Shopify Admin:
1. Go to **Discounts → Create discount**
2. Select **"Tier Pricing Discount"** (your function)
3. In the configuration, paste the city tier rules JSON
4. Activate the discount

---

## Feature 3: Pincode Serviceability

### Overview

Check if delivery is available to a specific pincode, with estimated delivery times and COD availability.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Pincode Input  │────▶│  API Route       │────▶│  Metaobject/    │
│  Component      │     │  /api/pincode    │     │  JSON Data      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Result Display │     │  Geo-Radius      │
│  (Serviceable?) │     │  Check (Optional)│
└─────────────────┘     └──────────────────┘
```

### Files Created

| File | Purpose |
|------|---------|
| `app/lib/pincode-service.js` | Serviceability utilities |
| `app/components/pincode/PincodeChecker.jsx` | UI components |
| `app/routes/api.pincode-check.jsx` | API endpoint |
| `app/styles/components/pincode.css` | Styles |

### Usage

#### 1. Add Pincode Checker to Product Page

```jsx
import {PincodeChecker} from '~/components/pincode/PincodeChecker';

function ProductPage({product}) {
  return (
    <div>
      {/* ... product info ... */}
      
      <PincodeChecker 
        productId={product.id}
        onResult={(result) => {
          console.log('Serviceability:', result);
        }}
      />
    </div>
  );
}
```

#### 2. Compact Checker for Product Cards

```jsx
import {PincodeCheckerCompact} from '~/components/pincode/PincodeChecker';

function ProductCard() {
  return (
    <div className="product-card">
      {/* ... */}
      <PincodeCheckerCompact />
    </div>
  );
}
```

#### 3. Check Programmatically

```javascript
const response = await fetch('/api/pincode-check', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({pincode: '560001'})
});

const result = await response.json();
// {serviceable: true, city: "Bangalore", deliveryDays: 2, codAvailable: true}
```

### Geo-Radius Based Serviceability (Optional)

For radius-based checks, use the `checkGeoRadiusServiceability` function:

```javascript
import {checkGeoRadiusServiceability} from '~/lib/pincode-service';

const result = await checkGeoRadiusServiceability(
  pincode,
  serviceCenters,
  geocodeFunction // Your geocoding implementation
);
```

---

## Metaobject Schemas

### 1. Supported Cities (`supported_cities`)

Create in Shopify Admin → Settings → Custom data → Metaobjects

| Field | Type | Description |
|-------|------|-------------|
| `handle` | Single line text | Unique identifier (use "default") |
| `cities` | JSON | Array of city objects with value and label |
| `default_city` | Single line text | Default city value (e.g., "bangalore") |

**Example JSON for `cities` field:**
```json
[
  {"value": "bangalore", "label": "Bangalore"},
  {"value": "chennai", "label": "Chennai"},
  {"value": "mumbai", "label": "Mumbai"},
  {"value": "delhi", "label": "Delhi"},
  {"value": "hyderabad", "label": "Hyderabad"},
  {"value": "kolkata", "label": "Kolkata"},
  {"value": "pune", "label": "Pune"}
]
```

**How it works:**
- Cities are fetched from the metaobject on app load (SSR)
- If metaobject is not found, fallback cities are used
- The `default_city` field sets which city is selected by default for new users
- Cities are cached using `storefront.CacheLong()` for performance

### 2. City Tier Pricing (Discount Function Configuration)

**Note:** City tier rules are stored in the **Discount Function's metafield configuration**, not a separate metaobject. When creating the discount in Shopify Admin, you'll configure the rules directly.

**Configuration JSON format:**
```json
[
  {
    "city": "bangalore",
    "tiers": [
      {"minQty": 3, "maxQty": 5, "discountPercent": 10, "label": "3-5 items"},
      {"minQty": 6, "maxQty": 10, "discountPercent": 15, "label": "6-10 items"},
      {"minQty": 11, "discountPercent": 20, "label": "11+ items"}
    ]
  },
  {
    "city": "mumbai",
    "tiers": [
      {"minQty": 3, "maxQty": 5, "discountPercent": 20, "label": "3-5 items"},
      {"minQty": 6, "maxQty": 10, "discountPercent": 25, "label": "6-10 items"},
      {"minQty": 11, "discountPercent": 30, "label": "11+ items"}
    ]
  },
  {
    "city": "chennai",
    "tiers": [
      {"minQty": 3, "maxQty": 5, "discountPercent": 12, "label": "3-5 items"},
      {"minQty": 6, "maxQty": 10, "discountPercent": 18, "label": "6-10 items"},
      {"minQty": 11, "discountPercent": 22, "label": "11+ items"}
    ]
  }
]
```

### 3. Pincode Serviceability (`pincode_serviceability`)

| Field | Type | Description |
|-------|------|-------------|
| `handle` | Single line text | Unique identifier (use "default") |
| `pincodes` | JSON | Array of serviceable pincodes |
| `service_centers` | JSON | Service centers for geo-radius (optional) |

**Example JSON for `pincodes` field:**
```json
[
  {"pincode": "560001", "city": "Bangalore", "deliveryDays": 2, "codAvailable": true, "zone": "South"},
  {"pincode": "560002", "city": "Bangalore", "deliveryDays": 2, "codAvailable": true, "zone": "South"},
  {"pincode": "600001", "city": "Chennai", "deliveryDays": 3, "codAvailable": true, "zone": "South"}
]
```

**Example JSON for `service_centers` field:**
```json
[
  {
    "city": "Bangalore",
    "location": {"lat": 12.9716, "lng": 77.5946},
    "radiusKm": 50,
    "deliveryDays": 2
  },
  {
    "city": "Chennai",
    "location": {"lat": 13.0827, "lng": 80.2707},
    "radiusKm": 40,
    "deliveryDays": 2
  }
]
```

### 3. Product Metafield for Tier Pricing

Add to products that need tier pricing:

- **Namespace:** `custom`
- **Key:** `tier_pricing`
- **Type:** JSON

---

## Shopify Admin Setup

### Step 1: Create Product Variants with City Option

1. Go to Products → Select product
2. Add option "City" with values: Bangalore, Chennai, Mumbai, Delhi, Hyderabad
3. Set different prices for each city variant

### Step 2: Create Tier Pricing Metaobject

1. Go to Settings → Custom data → Metaobjects
2. Create "tier_pricing_rule" definition
3. Add entries for products with tier pricing

### Step 3: Create Pincode Serviceability Metaobject

1. Create "pincode_serviceability" definition
2. Add entry with handle "default"
3. Populate pincodes JSON

### Step 4: Deploy Discount Function

```bash
shopify app deploy
```

### Step 5: Create Automatic Discount

1. Go to Discounts → Create discount
2. Select "Tier Pricing Discount" (your function)
3. Configure and activate

---

## API Reference

### GET /api/set-city

Get current city from cookie.

**Response:**
```json
{
  "city": "bangalore",
  "label": "Bangalore",
  "supportedCities": [...],
  "isDefault": false
}
```

### POST /api/set-city

Set selected city.

**Request:**
```json
{"city": "chennai"}
```

**Response:**
```json
{"success": true, "city": "chennai", "label": "Chennai"}
```

### POST /api/pincode-check

Check pincode serviceability.

**Request:**
```json
{"pincode": "560001", "productId": "optional"}
```

**Response (serviceable):**
```json
{
  "serviceable": true,
  "city": "Bangalore",
  "deliveryDays": 2,
  "codAvailable": true,
  "message": "Delivery available to Bangalore"
}
```

**Response (not serviceable):**
```json
{
  "serviceable": false,
  "message": "Sorry, we do not deliver to this pincode yet"
}
```

### GET /api/pincode-check

Get serviceable areas info.

**Response:**
```json
{
  "cities": [
    {"city": "Bangalore", "zone": "South", "deliveryDays": 2, "pincodeCount": 10}
  ],
  "totalPincodes": 50
}
```

---

## Performance Considerations

### SSR & Caching

1. **City cookie** is read server-side to prevent flicker
2. **Variant resolution** happens in the loader (SSR)
3. **Pincode data** is cached using `storefront.CacheShort()`
4. **Theme settings** use `storefront.CacheLong()`

### Cart Consistency

- City attribute is attached to each cart line
- Checkout receives city information via cart attributes
- Discount Function reads city from cart attributes

---

## Troubleshooting

### City not persisting

1. Check if cookies are enabled
2. Verify `/api/set-city` endpoint is working
3. Check browser console for errors

### Variant not resolving correctly

1. Ensure product has "City" option (case-sensitive)
2. Check if variant exists for the selected city
3. Verify `getCityFromRequest` is being called in loader

### Tier pricing not applying

1. Verify product has `custom.tier_pricing` metafield
2. Check Discount Function is deployed and active
3. Ensure cart has `selected_city` attribute

### Pincode check failing

1. Verify metaobject exists with handle "default"
2. Check JSON format in pincodes field
3. Test with example data (fallback)

---

## File Structure Summary

```
app/
├── context/
│   └── CityContext.jsx           # City state management
├── lib/
│   ├── city-variant-resolver.js  # Variant resolution
│   ├── tier-pricing.js           # Tier calculations
│   └── pincode-service.js        # Pincode utilities
├── components/
│   ├── city/
│   │   └── CitySelector.jsx      # City UI components
│   ├── pricing/
│   │   └── TierPricingTable.jsx  # Tier pricing UI
│   └── pincode/
│       └── PincodeChecker.jsx    # Pincode UI
├── routes/
│   ├── api.set-city.jsx          # City API
│   └── api.pincode-check.jsx     # Pincode API
└── styles/components/
    ├── city.css
    ├── tier-pricing.css
    └── pincode.css

extensions/
└── tier-pricing-function/
    ├── shopify.extension.toml
    └── src/
        ├── run.js
        └── run.graphql
```
