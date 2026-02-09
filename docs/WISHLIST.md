# Wishlist System Documentation

A complete wishlist system for Shopify Hydrogen storefronts using customer metafields.
**No separate app required** - runs entirely within Hydrogen.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     HYDROGEN STOREFRONT                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ ProductCard │  │    PDP      │  │    Wishlist Page        │ │
│  │ + Wishlist  │  │ + Wishlist  │  │ (Account Section)       │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   WishlistContext     │                          │
│              │   + useWishlist hook  │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │  /api/wishlist route  │ ◄── Server-side route    │
│              │  (Hydrogen internal)  │                          │
│              └───────────┬───────────┘                          │
│                          │                                      │
│              ┌───────────▼───────────┐                          │
│              │  Admin API Client     │                          │
│              │  (admin-api.server.js)│                          │
│              └───────────────────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │ Admin API
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPIFY ADMIN                                │
│  Customer Metafield: custom.wishlist (list.product_reference)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Shopify Admin Setup

### Step 1: Create Customer Metafield Definition

1. Go to **Shopify Admin** → **Settings** → **Custom data**
2. Click on **Customers**
3. Click **Add definition**
4. Fill in the following:
   - **Name**: `Wishlist`
   - **Namespace and key**: `custom.wishlist`
   - **Type**: Select **Product** → **List of products**
   - **Description**: `Customer's saved products wishlist`
5. Click **Save**

### Step 2: Create Admin API Access Token

1. Go to **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name it `Hydrogen Wishlist` and click **Create app**
4. Go to **Configuration** → **Admin API integration**
5. Select scopes: `read_customers`, `write_customers`, `read_products`
6. Click **Save** → **Install app**
7. Copy the **Admin API access token** (starts with `shpat_`)

### Step 3: Add Environment Variable

Add to your Hydrogen `.env` file:

```env
# Admin API token for wishlist (from Step 2)
SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
```

> ⚠️ **Security**: Never commit this token to version control.

---

## Hydrogen Setup

### Step 1: Add WishlistProvider to Root Layout

Update your `app/root.jsx` to include the WishlistProvider:

```jsx
import {WishlistProvider} from '~/context/WishlistContext';

export function Layout({children}) {
  // Get customer ID from your auth system
  const customerId = useCustomerId(); // Implement based on your auth

  return (
    <WishlistProvider customerId={customerId}>
      {children}
    </WishlistProvider>
  );
}
```

### Step 3: Add WishlistButton to ProductCard

Update your `ProductCard` component:

```jsx
import {WishlistButton} from '~/components/wishlist';

export function ProductCard({product}) {
  return (
    <div className="product-card">
      <WishlistButton 
        productId={product.id} 
        className="product-card__wishlist"
        size="small"
      />
      {/* Rest of product card */}
    </div>
  );
}
```

### Step 4: Add WishlistButton to Product Page

Update your product page:

```jsx
import {WishlistButton} from '~/components/wishlist';

export default function ProductPage() {
  const {product} = useLoaderData();

  return (
    <div className="product-page">
      <WishlistButton 
        productId={product.id}
        showLabel={true}
        size="large"
      />
      {/* Rest of product page */}
    </div>
  );
}
```

### Step 5: Add Wishlist Link to Account Navigation

Add a link to the wishlist page in your account navigation:

```jsx
<NavLink to="/account/wishlist">
  My Wishlist
</NavLink>
```

---

## API Reference

### GET /api/wishlist

Fetches the customer's wishlist.

**Query Parameters:**
- `customerId` (required): Customer GID (e.g., `gid://shopify/Customer/123`)

**Response:**
```json
{
  "success": true,
  "wishlist": [
    "gid://shopify/Product/123",
    "gid://shopify/Product/456"
  ]
}
```

### POST /api/wishlist/add

Adds a product to the wishlist.

**Request Body:**
```json
{
  "customerId": "gid://shopify/Customer/123",
  "productId": "gid://shopify/Product/456"
}
```

**Response:**
```json
{
  "success": true,
  "wishlist": [
    "gid://shopify/Product/123",
    "gid://shopify/Product/456"
  ]
}
```

### POST /api/wishlist/remove

Removes a product from the wishlist.

**Request Body:**
```json
{
  "customerId": "gid://shopify/Customer/123",
  "productId": "gid://shopify/Product/456"
}
```

**Response:**
```json
{
  "success": true,
  "wishlist": [
    "gid://shopify/Product/123"
  ]
}
```

---

## Component Reference

### WishlistButton

Heart icon button to add/remove products from wishlist.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `productId` | `string` | required | Product GID |
| `className` | `string` | `''` | Additional CSS classes |
| `showLabel` | `boolean` | `false` | Show "Save"/"Saved" label |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button size |

**Example:**
```jsx
<WishlistButton 
  productId="gid://shopify/Product/123"
  showLabel={true}
  size="large"
/>
```

### WishlistCount

Badge showing wishlist item count.

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `showZero` | `boolean` | `false` | Show badge when count is 0 |

**Example:**
```jsx
<WishlistCount showZero={false} />
```

### useWishlist Hook

Access wishlist state and actions.

**Returns:**
```typescript
{
  wishlist: string[];           // Array of product GIDs
  isLoading: boolean;           // Loading state
  error: string | null;         // Error message
  isLoggedIn: boolean;          // Whether user is logged in
  customerId: string | null;    // Customer GID
  wishlistCount: number;        // Number of items
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<Result>;
  removeFromWishlist: (productId: string) => Promise<Result>;
  toggleWishlist: (productId: string) => Promise<Result>;
  refreshWishlist: () => Promise<void>;
}
```

**Example:**
```jsx
function MyComponent() {
  const {isInWishlist, toggleWishlist, isLoggedIn} = useWishlist();

  const handleClick = async (productId) => {
    if (!isLoggedIn) {
      // Show login prompt
      return;
    }
    await toggleWishlist(productId);
  };

  return (
    <button onClick={() => handleClick('gid://shopify/Product/123')}>
      {isInWishlist('gid://shopify/Product/123') ? 'Saved' : 'Save'}
    </button>
  );
}
```

---

## File Structure

### Hydrogen Store Files
```
hydrogen-store-sgr/app/
├── context/
│   └── WishlistContext.jsx       # Global wishlist state
├── components/
│   └── wishlist/
│       ├── WishlistButton.jsx    # Heart icon button
│       ├── WishlistCount.jsx     # Badge with count
│       └── index.js
├── routes/
│   ├── api.wishlist.jsx          # Internal API route
│   └── ($locale).account.wishlist.jsx
├── lib/
│   ├── wishlist.js               # Client-side API calls
│   └── admin-api.server.js       # Admin API client (server-only)
├── graphql/storefront/
│   └── WishlistQuery.js          # Storefront queries
└── styles/components/
    └── wishlist.css
```

---

## Troubleshooting

### Wishlist not persisting

1. Verify the customer metafield definition exists in Shopify Admin
2. Check that the app has `write_customers` scope
3. Verify the customer ID format is correct (`gid://shopify/Customer/123`)

### Admin API errors

1. Verify `SHOPIFY_ADMIN_API_ACCESS_TOKEN` is set in your `.env` file
2. Check that the token has `read_customers` and `write_customers` scopes
3. Ensure `PUBLIC_STORE_DOMAIN` is set correctly

### Products not showing in wishlist

1. Verify products exist and are published to the Online Store channel
2. Check that product IDs are in the correct format

### Login prompt not showing

1. Ensure `WishlistProvider` is wrapping your app
2. Verify `customerId` is being passed correctly to the provider
