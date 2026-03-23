# SGR Dev Test - Hydrogen Storefront

A custom Shopify Hydrogen storefront with advanced features including wishlist functionality, Yotpo reviews integration, dynamic theme settings via metaobjects, and modular homepage sections.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Getting Started](#-getting-started)
3. [Environment Configuration](#-environment-configuration)
4. [Feature Updates](#-feature-updates)
   - [4.1 Theme Settings via Metaobjects](#-41-theme-settings-via-metaobjects)
   - [4.2 Announcement Bar](#-42-announcement-bar)
   - [4.3 Hero Banner / Image Banner](#-43-hero-banner--image-banner)
   - [4.4 Homepage Sections](#-44-homepage-sections)
   - [4.5 Product Page Enhancements](#-45-product-page-enhancements)
   - [4.6 ❤️ Wishlist Functionality](#-46-️-wishlist-functionality)
   - [4.7 Yotpo Reviews Integration](#-47-yotpo-reviews-integration)
   - [4.8 💬 Tidio Live Chat](#-48-tidio-live-chat-integration)
   - [4.9 🏙️ City-Based Pricing](#-49-️-city-based-pricing)
   - [4.10 📍 Pincode Verification](#-410--pincode-verification)
   - [4.11 🏷️ Tier Pricing Discounts](#-411-️-tier-pricing-discounts)
5. [API Routes Reference](#-api-routes-reference)
6. [Deployment Guide](#-deployment-guide)
7. [Troubleshooting](#-troubleshooting)

---

## 🚀 Project Overview

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Hydrogen** | Latest | Shopify's React framework for headless commerce |
| **React Router** | v7 | Routing and navigation |
| **Vite** | Latest | Build tool and dev server |
| **Oxygen** | Latest | Shopify's hosting platform |
| **Shopify CLI** | Latest | Development and deployment tools |

### Project Structure

```
hydrogen-store-sgr/
├── app/
│   ├── components/          # React components
│   │   ├── layout/          # Layout components
│   │   ├── product/         # Product-related components
│   │   ├── sections/        # Homepage sections
│   │   ├── wishlist/        # Wishlist components
│   │   └── yotpo/           # Yotpo reviews components
│   ├── context/             # React contexts
│   ├── graphql/             # GraphQL queries
│   ├── lib/                 # Utility functions & API services
│   ├── routes/              # Page routes & API routes
│   └── styles/              # CSS stylesheets
├── docs/                    # Documentation assets
└── public/                  # Static assets
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** version 18.0.0 or higher
- **npm** or **yarn** package manager
- **Shopify Partner Account** (for Admin API access)
- **Yotpo Account** (for reviews integration)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hydrogen-store-sgr

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Local Development

```bash
npm run dev
```

The development server will start at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

### Deployment to Oxygen

```bash
npx shopify hydrogen deploy
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# ═══════════════════════════════════════════════════════════════
# STOREFRONT API CREDENTIALS
# ═══════════════════════════════════════════════════════════════
PUBLIC_STOREFRONT_ID=your_storefront_id
PUBLIC_STOREFRONT_API_TOKEN=your_storefront_api_token
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
PRIVATE_STOREFRONT_API_TOKEN=your_private_token

# ═══════════════════════════════════════════════════════════════
# CUSTOMER ACCOUNT API
# ═══════════════════════════════════════════════════════════════
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID=your_client_id
PUBLIC_CUSTOMER_ACCOUNT_API_URL=https://shopify.com/your_shop_id
SHOP_ID=your_shop_id
SESSION_SECRET=your_session_secret

# ═══════════════════════════════════════════════════════════════
# ADMIN API CREDENTIALS (for Wishlist functionality)
# Get from: Shopify Partners Dashboard > Apps > Your App > Settings
# ═══════════════════════════════════════════════════════════════
SHOPIFY_ADMIN_CLIENT_ID=your_admin_client_id
SHOPIFY_ADMIN_CLIENT_SECRET=your_admin_client_secret

# ═══════════════════════════════════════════════════════════════
# YOTPO REVIEWS API CREDENTIALS
# Get from: Yotpo Dashboard > Account Settings
# ═══════════════════════════════════════════════════════════════
YOTPO_APP_KEY=your_yotpo_app_key
YOTPO_SECRET_KEY=your_yotpo_secret_key
YOTPO_ACCOUNT_ID=your_yotpo_account_id
```

---

## 🔧 Feature Updates

Below is detailed documentation for each feature implemented in this project.

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   📦 4.1 THEME SETTINGS VIA METAOBJECTS                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Dynamic theme configuration system that allows merchants to customize storefront settings directly from the Shopify admin without code changes.

### 🎯 Purpose

- Enable non-technical users to modify theme settings
- Centralize configuration in Shopify admin
- Support dynamic content like announcements, social links, and banners

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/context/ThemeSettingsContext.jsx` | React context provider for theme settings |
| `app/lib/metaobjects.js` | Utility functions for parsing metaobject fields |
| `app/graphql/storefront/ThemeSettingsQuery.js` | GraphQL queries for fetching metaobjects |

### ⚙️ Metaobject Types

| Metaobject Type | Purpose | Fields |
|-----------------|---------|--------|
| `theme_settings` | Global theme configuration | Colors, fonts, layout options |
| `announcement_bar` | Top banner settings | Text, link, colors, enabled flag |
| `social_links` | Social media links | Platform URLs |
| `image_banner` | Hero section content | Image, heading, CTA button |

### 💡 Usage

```jsx
import { useThemeSettings } from '~/context/ThemeSettingsContext';

function MyComponent() {
  const { settings, announcement, socialLinks } = useThemeSettings();
  // Use settings in your component
}
```

### 📚 References

- [Shopify Metaobjects Documentation](https://shopify.dev/docs/apps/custom-data/metaobjects)
- [Storefront API Metaobject Queries](https://shopify.dev/docs/api/storefront/latest/objects/Metaobject)

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   📢 4.2 ANNOUNCEMENT BAR                                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

A customizable announcement bar displayed at the top of every page, managed via Shopify metaobjects.

### 🎯 Purpose

- Display promotional messages, shipping info, or important announcements
- Allow merchants to update content without developer intervention
- Support custom colors and optional links

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/components/AnnouncementBar.jsx` | Main component |
| `app/styles/components/announcement-bar.css` | Styling |

### ⚙️ Configuration (via Metaobject)

Create an `announcement_bar` metaobject in Shopify admin with:

| Field | Type | Description |
|-------|------|-------------|
| `text` | Single line text | Announcement message |
| `link` | URL | Optional click-through link |
| `background_color` | Color | Background color (hex) |
| `text_color` | Color | Text color (hex) |
| `enabled` | Boolean | Show/hide toggle |

### 💡 Features

- ✅ Dynamic content from Shopify admin
- ✅ Custom background and text colors
- ✅ Optional link support
- ✅ Enable/disable toggle
- ✅ Graceful fallback if not configured

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🖼️ 4.3 HERO BANNER / IMAGE BANNER                                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Dynamic hero section on the homepage with background image, overlay, and call-to-action buttons, all configurable via metaobjects.

### 🎯 Purpose

- Create visually appealing homepage hero sections
- Allow merchants to update hero content and images
- Support multiple text positioning options

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/components/sections/HeroBanner.jsx` | Hero banner component |
| `app/graphql/storefront/ThemeSettingsQuery.js` | `HOMEPAGE_IMAGE_BANNER_QUERY` |
| `app/styles/components/hero-banner.css` | Styling |

### ⚙️ Configuration (via Metaobject)

Create an `image_banner` metaobject with handle `homepage-hero`:

| Field | Type | Description |
|-------|------|-------------|
| `image` | File reference | Background image |
| `heading` | Single line text | Main heading |
| `subheading` | Single line text | Subheading text |
| `button_text` | Single line text | CTA button label |
| `button_link` | URL | CTA button destination |
| `text_position` | Single line text | `left`, `center`, or `right` |
| `overlay_opacity` | Number (decimal) | 0 to 1 (e.g., 0.3) |

### 💡 Features

- ✅ Full-width background image
- ✅ Configurable text overlay position
- ✅ Adjustable overlay opacity
- ✅ Fallback to text-only banner if no image

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🏠 4.4 HOMEPAGE SECTIONS                                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Modular homepage sections including product carousels, collection grids, featured products, and marquee text.

### 🎯 Purpose

- Create a dynamic, engaging homepage
- Showcase products and collections
- Provide reusable section components

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/components/sections/ProductCarousel.jsx` | Horizontal product slider |
| `app/components/sections/CollectionGrid.jsx` | Grid of collection cards |
| `app/components/sections/FeaturedProduct.jsx` | Highlighted product display |
| `app/components/sections/Marquee.jsx` | Scrolling text banner |
| `app/components/sections/index.js` | Section exports |

### 💡 Components

#### ProductCarousel
```jsx
<ProductCarousel 
  products={products} 
  title="Featured Products" 
/>
```

#### CollectionGrid
```jsx
<CollectionGrid 
  collections={collections} 
  columns={3} 
/>
```

#### FeaturedProduct
```jsx
<FeaturedProduct product={product} />
```

#### Marquee
```jsx
<Marquee text="Free shipping on orders over $50" />
```

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   📦 4.5 PRODUCT PAGE ENHANCEMENTS                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Enhanced product page with image gallery, variant selection, wishlist integration, and Yotpo reviews.

### 🎯 Purpose

- Improve product browsing experience
- Enable variant selection with visual feedback
- Integrate wishlist and reviews functionality

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/components/product/ProductGallery.jsx` | Image gallery with thumbnails |
| `app/components/product/ProductInfo.jsx` | Product details and options |
| `app/components/product/ProductCard.jsx` | Product card for listings |
| `app/routes/($locale).products.$handle.jsx` | Product page route |

### 💡 Features

- ✅ Image gallery with thumbnail navigation
- ✅ Variant selection (color, size, etc.)
- ✅ Price display with compare-at price
- ✅ Add to cart functionality
- ✅ Wishlist button integration
- ✅ Yotpo star rating display
- ✅ Full reviews widget at bottom

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ❤️ 4.6 WISHLIST FUNCTIONALITY                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Customer wishlist feature that allows logged-in users to save products for later. Wishlist data is stored in customer metafields using the Shopify Admin API.

### 🎯 Purpose

- Allow customers to save favorite products
- Persist wishlist data across sessions
- Provide a dedicated wishlist page in customer account

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/lib/admin-api.server.js` | Admin API client with OAuth |
| `app/lib/wishlist.js` | Client-side wishlist utilities |
| `app/context/WishlistContext.jsx` | Global wishlist state management |
| `app/components/wishlist/WishlistButton.jsx` | Heart button component |
| `app/components/wishlist/WishlistCount.jsx` | Wishlist item counter |
| `app/routes/api.wishlist.jsx` | Wishlist API route |
| `app/routes/api.wishlist-products.jsx` | Fetch wishlist product details |
| `app/routes/($locale).account.wishlist.jsx` | Wishlist page |

### ⚙️ Configuration

**Required Environment Variables:**
```env
SHOPIFY_ADMIN_CLIENT_ID=your_client_id
SHOPIFY_ADMIN_CLIENT_SECRET=your_client_secret
```

**How to get Admin API credentials:**
1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Navigate to Apps > Your App > Configuration
3. Under "Admin API access scopes", enable:
   - `read_customers`
   - `write_customers`
4. Copy the Client ID and Client Secret

### 📚 References

- [Shopify Admin API Authentication](https://shopify.dev/docs/apps/auth/admin-app-access-tokens)
- [Customer Metafields](https://shopify.dev/docs/api/admin-graphql/latest/objects/Customer)

### ⚠️ Issues Encountered

1. **OAuth Token Management**
   - Problem: Access tokens expire after 24 hours
   - Resolution: Implemented token caching with automatic refresh

2. **Metafield Storage**
   - Problem: Storing array of product IDs in metafield
   - Resolution: Used JSON serialization for the wishlist array

### ✅ How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WishlistButton │────▶│  /api/wishlist  │────▶│  Admin API      │
│  (Client)       │     │  (Server Route) │     │  (Metafields)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ WishlistContext │     │ Customer        │
│ (State)         │     │ Metafield       │
└─────────────────┘     └─────────────────┘
```

### 💡 Usage

```jsx
import { WishlistButton } from '~/components/wishlist';

// In product card or product page
<WishlistButton productId={product.id} size="medium" />
```

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⭐ 4.7 YOTPO REVIEWS INTEGRATION                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

<img src="docs/assets/yotpo-logo.svg" alt="Yotpo Logo" width="80" />

### 📌 Overview

Full Yotpo Reviews integration using the Yotpo REST API. Displays product reviews, star ratings, and allows customers to submit new reviews.

### 🎯 Purpose

- Display product reviews and ratings
- Allow customers to write reviews
- Show aggregate star ratings on product pages
- Enable review voting (helpful/not helpful)

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/lib/yotpo-api.server.js` | Server-side Yotpo API service |
| `app/routes/api.reviews.jsx` | Reviews API route (GET/POST) |
| `app/components/yotpo/YotpoReviews.jsx` | Reviews widget components |
| `app/components/yotpo/index.js` | Component exports |
| `app/styles/components/yotpo.css` | Reviews styling |

### ⚙️ Configuration

**Required Environment Variables:**
```env
YOTPO_APP_KEY=your_app_key
YOTPO_SECRET_KEY=your_secret_key
YOTPO_ACCOUNT_ID=your_account_id
```

**How to get Yotpo API credentials:**
1. Log in to [Yotpo Dashboard](https://yotpo.com/)
2. Go to **Account Settings** (gear icon)
3. Navigate to **Store Setup** or **API Credentials**
4. Copy the App Key and Secret Key

### 📚 References

- [Yotpo API Guidelines](https://apidocs.yotpo.com/reference/guidelines-and-conventions)
- [Yotpo Authentication](https://apidocs.yotpo.com/reference/yotpo-authentication)
- [Storefront Reviews API](https://apidocs.yotpo.com/reference/about-storefront-reviews)
- [Merchant Reviews API](https://apidocs.yotpo.com/reference/about-merchant-reviews)

### ⚠️ Issues Encountered

1. **Widget Approach - CSP Blocking**
   - Problem: Yotpo's JavaScript widget was blocked by Content Security Policy
   - Error: `ERR_BLOCKED_BY_ORB` in browser console
   - Attempted fixes: Modified CSP headers, added nonce attributes
   - Resolution: **Abandoned widget approach entirely**

2. **API-Based Solution**
   - Resolution: Implemented server-side API calls to Yotpo
   - Benefits: No CSP issues, full control over UI, better performance

3. **Review Display Delay**
   - Note: New reviews take up to **4 hours** to appear due to Yotpo CDN caching
   - Reviews appear immediately in Yotpo Dashboard

### ✅ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  YotpoReviews   │────▶│  /api/reviews   │────▶│  Yotpo API      │
│  Widget (React) │     │  (Server Route) │     │  (CDN/REST)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │ yotpo-api       │
         │              │ .server.js      │
         │              └─────────────────┘
         ▼
┌─────────────────┐
│ Components:     │
│ - StarRating    │
│ - ReviewCard    │
│ - WriteReview   │
│ - Pagination    │
└─────────────────┘
```

### 💡 Usage

**Star Rating Summary (in ProductInfo):**
```jsx
import { YotpoStarRatingSummary } from '~/components/yotpo';

<YotpoStarRatingSummary product={product} />
```

**Full Reviews Widget (at bottom of product page):**
```jsx
import { YotpoReviewsWidget } from '~/components/yotpo';

<YotpoReviewsWidget product={product} />
```

### 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews?productId=xxx` | GET | Fetch reviews for a product |
| `/api/reviews?productId=xxx&bottomLineOnly=true` | GET | Fetch only rating summary |
| `/api/reviews` | POST | Create a new review |
| `/api/reviews` (intent=vote) | POST | Vote on a review |

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   💬 4.8 TIDIO LIVE CHAT INTEGRATION                                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

<img src="docs/assets/tidio-logo.svg" alt="Tidio Logo" width="80" />

### 📌 Overview

Tidio Live Chat widget integration for real-time customer support and communication.

### 🎯 Purpose

- Provide real-time customer support via live chat
- Enable automated chatbot responses
- Improve customer engagement and conversion rates

### 📁 Files Modified

| File | Description |
|------|-------------|
| `app/root.jsx` | Added Tidio script tag in body |

### ⚙️ Configuration

The Tidio widget is loaded via a JavaScript snippet added to the root layout. The script loads asynchronously on all pages.

**Script Location:** `app/root.jsx` (inside `<body>` tag)

```jsx
<script src="//code.tidio.co/YOUR_TIDIO_KEY.js" async></script>
```

### 💡 How to Get Your Tidio Script

1. Log in to [Tidio Dashboard](https://www.tidio.com/)
2. Go to **Settings** → **Channels** → **Live Chat** → **Installation**
3. Copy the JavaScript snippet
4. Replace the script in `app/root.jsx` with your unique key

### 📚 References

- [Tidio Installation Guide](https://www.tidio.com/blog/how-to-install-tidio/)
- [Tidio Help Center](https://help.tidio.com/)

### ✅ Features

- ✅ Live chat with customers
- ✅ Automated chatbot responses
- ✅ Visitor tracking
- ✅ Mobile-friendly widget
- ✅ Loads asynchronously (no performance impact)

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🏙️ 4.9 CITY-BASED PRICING                                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

City-based pricing system that allows products to have different prices based on the customer's selected city. Products can have variants for different cities (e.g., Bangalore, Chennai, Mumbai), and the storefront automatically displays the correct price based on the user's city selection.

### 🎯 Requirements

- Display different prices for products based on customer's selected city
- Allow customers to select their city via a global city selector
- Persist city selection across sessions using cookies
- Show city-specific prices on PLP (Product Listing Page) and PDP (Product Detail Page)
- Handle products that are unavailable in certain cities (show as faded/unclickable)
- Sync URL with selected city for correct variant selection

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/context/CityContext.jsx` | React context for city selection state |
| `app/lib/city-variant-resolver.js` | Utility functions for resolving city variants |
| `app/components/CitySelector.jsx` | City selection dropdown component |
| `app/components/layout/Header.jsx` | Header with city selector integration |
| `app/components/product/ProductCard.jsx` | Product card with city pricing |
| `app/components/product/ProductInfo.jsx` | Product info with city availability |
| `app/components/ProductItem.jsx` | Product item with city pricing |
| `app/routes/($locale).products.$handle.jsx` | PDP with city variant resolution |
| `app/styles/components/city.css` | City selector and indicator styles |
| `app/styles/components/product-card.css` | Unavailable state styles |

### ⚙️ Shopify Configuration

**Product Setup:**
1. Create product variants with a "City" option
2. Each variant should have a city name (e.g., "Bangalore", "Chennai", "Mumbai")
3. Set different prices for each city variant

**Example Variant Structure:**
```
Product: Premium Coffee
├── Variant: Bangalore - ₹499
├── Variant: Chennai - ₹549
└── Variant: Mumbai - ₹599
```

### 💡 Solution Approach

1. **City Context**: Global React context manages selected city state
2. **Cookie Persistence**: City selection stored in `selected_city` cookie
3. **SSR Support**: City resolved from cookie in loader for no-flicker experience
4. **Client Reactivity**: City changes trigger immediate price updates
5. **URL Sync**: URL params updated when city changes on PDP
6. **Unavailable Handling**: Products without city variant shown as unavailable

### ✅ Features

- ✅ Global city selector in header
- ✅ City-specific pricing on PLP and PDP
- ✅ Cookie-based persistence across sessions
- ✅ SSR-compatible (no price flicker on load)
- ✅ URL sync for correct add-to-cart variant
- ✅ Unavailable products shown faded/unclickable
- ✅ "Unavailable in your city" messaging
- ✅ City indicator on product pages

### 🔧 Replication Steps

1. **Create City Context:**
   ```jsx
   // app/context/CityContext.jsx
   export const CITY_OPTION_NAME = 'City';
   export const DEFAULT_CITY = 'bangalore';
   export const AVAILABLE_CITIES = [
     { value: 'bangalore', label: 'Bangalore' },
     { value: 'chennai', label: 'Chennai' },
     // Add more cities
   ];
   ```

2. **Create City Variant Resolver:**
   - `findVariantByCity()` - Find variant matching city
   - `hasCityVariants()` - Check if product has city option
   - `resolveVariantForCity()` - SSR-compatible resolution

3. **Update Product Components:**
   - Use `useCity()` hook to get selected city
   - Call `findVariantByCity()` to get correct variant
   - Handle `isCityUnavailable` state

4. **Add City Selector to Header:**
   - Dropdown with available cities
   - Updates context and cookie on change

### 📚 References

- [Shopify Product Variants](https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant)
- [React Context API](https://react.dev/reference/react/useContext)

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   📍 4.10 PINCODE VERIFICATION                                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Pincode/ZIP code verification system that allows customers to check delivery availability before adding products to cart. The system validates pincodes against a serviceability database and shows delivery status.

### 🎯 Requirements

- Allow customers to enter their pincode on PDP
- Check if delivery is available for the entered pincode
- Show delivery availability status (serviceable/not serviceable)
- Persist pincode across sessions
- Provide clear feedback on delivery status

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `app/components/pincode/PincodeChecker.jsx` | Main pincode input component |
| `app/components/pincode/index.js` | Component exports |
| `app/routes/api.pincode-check.jsx` | API route for pincode validation |
| `app/styles/components/pincode.css` | Pincode checker styles |
| `app/components/product/ProductInfo.jsx` | PDP integration |

### ⚙️ Configuration

**Pincode Data Source Options:**

1. **Metafield-based** (Recommended for small datasets):
   - Store serviceable pincodes in shop metafield
   - JSON format: `{"pincodes": ["560001", "560002", ...]}`

2. **External API** (For large datasets):
   - Integrate with logistics partner API
   - Real-time serviceability check

3. **Static JSON** (For development/testing):
   ```javascript
   const SERVICEABLE_PINCODES = {
     '560001': { city: 'Bangalore', deliveryDays: 2 },
     '600001': { city: 'Chennai', deliveryDays: 3 },
   };
   ```

### 💡 Solution Approach

1. **PincodeChecker Component**: Input field with check button
2. **API Route**: Server-side validation against pincode database
3. **Status Display**: Shows serviceable/not serviceable with delivery info
4. **Cookie Storage**: Remembers last checked pincode

### ✅ Features

- ✅ Pincode input with validation
- ✅ Real-time serviceability check
- ✅ Delivery time estimation
- ✅ City name display for valid pincodes
- ✅ Error handling for invalid pincodes
- ✅ Loading state during check
- ✅ Persistent pincode storage

### 💡 Usage

```jsx
import { PincodeChecker } from '~/components/pincode';

// In ProductInfo component
<PincodeChecker 
  className="product-info__pincode" 
  productId={product.id}
/>
```

### 🔧 Replication Steps

1. **Create API Route:**
   ```jsx
   // app/routes/api.pincode-check.jsx
   export async function loader({ request }) {
     const url = new URL(request.url);
     const pincode = url.searchParams.get('pincode');
     
     // Validate against your pincode database
     const result = await checkPincodeServiceability(pincode);
     
     return json(result);
   }
   ```

2. **Create PincodeChecker Component:**
   - Input field for pincode
   - Check button to trigger validation
   - Status display area

3. **Integrate in PDP:**
   - Add component below Add to Cart button
   - Pass product ID for analytics

### 📚 References

- [India Post Pincode API](https://www.indiapost.gov.in/)
- [Logistics Partner APIs](https://developers.delhivery.com/)

---

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🏷️ 4.11 TIER PRICING DISCOUNTS                                             ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

### 📌 Overview

Tier-based pricing discount system using Shopify Functions. Provides automatic quantity-based discounts for products based on the customer's selected city. When customers add multiple items of the same city variant, they receive progressive discounts.

### 🎯 Requirements

- Apply automatic discounts based on quantity thresholds
- Support city-specific discount rules
- Display discount allocations in cart drawer
- Allow merchants to configure discount tiers via admin UI
- Show discount savings at checkout

### 📁 Files Created/Modified

| File | Description |
|------|-------------|
| `extensions/tier-pricing-discount/` | Shopify Function extension |
| `extensions/tier-pricing-discount/src/run.rs` | Rust discount logic |
| `extensions/tier-pricing-discount/src/run.graphql` | Input query |
| `app/routes/admin.tier-pricing.jsx` | Admin UI for discount management |
| `app/routes/api.admin.discounts.jsx` | Admin API for CRUD operations |
| `app/lib/admin.server.js` | Admin API client |
| `app/lib/fragments.js` | Cart fragments with discountAllocations |
| `app/components/CartLineItem.jsx` | Cart line with discount display |
| `app/styles/components/cart.css` | Discount display styles |

### ⚙️ Shopify Configuration

**1. Deploy the Shopify Function:**
```bash
cd extensions/tier-pricing-discount
npm run build
cd ../..
npx shopify app deploy
```

**2. Create Automatic Discount:**
- Go to Shopify Admin > Discounts
- Create new "Automatic discount"
- Select "Tier Pricing Discount" function
- Configure title and start date

### 💡 Solution Approach

**Discount Function Logic (Rust):**
1. Scan cart lines for products with city variants
2. Extract city from variant title (e.g., "Default Title / bangalore")
3. Group quantities by city
4. Apply tier-based percentage discount:
   - 2+ items: 5% off
   - 5+ items: 10% off
   - 10+ items: 15% off

**Admin UI:**
- React-based configuration page
- CRUD operations for discount rules
- City-specific tier configuration
- Start date scheduling

### ✅ Features

- ✅ Automatic quantity-based discounts
- ✅ City-specific discount rules
- ✅ Configurable tier thresholds
- ✅ Admin UI for merchant configuration
- ✅ Discount display in cart drawer
- ✅ Discount reflected at checkout
- ✅ Start date scheduling
- ✅ Multiple discount rules support

### 🔧 Tier Configuration

**Default Tiers (hardcoded in function):**
```rust
const TIER_RULES: [(i32, f64); 3] = [
    (2, 5.0),   // 2+ items = 5% off
    (5, 10.0),  // 5+ items = 10% off
    (10, 15.0), // 10+ items = 15% off
];
```

**Supported Cities:**
```rust
const SUPPORTED_CITIES: [&str; 5] = [
    "bangalore", "chennai", "hyderabad", "mumbai", "delhi"
];
```

### 🔧 Replication Steps

1. **Create Shopify Function Extension:**
   ```bash
   npx shopify app generate extension --type product_discounts
   ```

2. **Implement Discount Logic:**
   - Parse cart lines from input
   - Extract city from variant titles
   - Calculate applicable discount tier
   - Return discount allocations

3. **Create Admin UI:**
   - Route: `/admin/tier-pricing`
   - Fetch available discount functions
   - CRUD operations via Admin API

4. **Update Cart Fragments:**
   ```graphql
   fragment CartLine on CartLine {
     # ... existing fields
     discountAllocations {
       discountedAmount { ...Money }
       ... on CartAutomaticDiscountAllocation {
         title
       }
     }
   }
   ```

5. **Display in Cart:**
   - Map over `line.discountAllocations`
   - Show discount title and amount

### 📚 References

- [Shopify Functions](https://shopify.dev/docs/apps/functions)
- [Product Discount API](https://shopify.dev/docs/api/functions/reference/product-discounts)
- [Rust for Shopify Functions](https://shopify.dev/docs/apps/functions/programming-languages/rust)

### ⚠️ Issues Encountered

1. **GraphQL Schema Mismatch**
   - Problem: IDE showed lint errors for function GraphQL
   - Cause: IDE using Storefront API schema instead of Functions schema
   - Resolution: Errors are false positives, function works correctly

2. **Variant Title Parsing**
   - Problem: City not extracted from "Default Title / bangalore"
   - Resolution: Split title by " / " and check all parts for city match

3. **Discount Not Showing in Cart**
   - Problem: `discountAllocations` was empty in cart
   - Resolution: Added `discountAllocations` to cart GraphQL fragments

---

## 🛣️ API Routes Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/api/reviews` | GET | Fetch Yotpo reviews |
| `/api/reviews` | POST | Create review or vote |
| `/api/wishlist` | GET | Get customer wishlist |
| `/api/wishlist` | POST | Add/remove from wishlist |
| `/api/wishlist-products` | GET | Get wishlist product details |
| `/api/pincode-check` | GET | Check pincode serviceability |
| `/api/admin/discounts` | GET | List tier pricing discounts |
| `/api/admin/discounts` | POST | Create tier pricing discount |
| `/api/admin/discounts` | PUT | Update tier pricing discount |
| `/api/admin/discounts` | DELETE | Delete tier pricing discount |

---

## 🚀 Deployment Guide

### Deploy to Oxygen

```bash
# Build the project
npm run build

# Deploy to Oxygen
npx shopify hydrogen deploy
```

### Environment Variables in Oxygen

Set environment variables in Shopify admin:
1. Go to **Settings** > **Apps and sales channels**
2. Select your Hydrogen app
3. Go to **Configuration**
4. Add all required environment variables

### Production Checklist

- [ ] All environment variables configured
- [ ] Admin API credentials set up
- [ ] Yotpo API credentials configured
- [ ] Metaobjects created in Shopify admin
- [ ] Customer Account API configured

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Wishlist not working
- **Check**: Admin API credentials are correct
- **Check**: Customer is logged in
- **Check**: API scopes include `read_customers` and `write_customers`

#### 2. Reviews not displaying
- **Check**: Yotpo API credentials are correct
- **Check**: Product has reviews in Yotpo dashboard
- **Note**: New reviews take up to 4 hours to appear

#### 3. Metaobject content not showing
- **Check**: Metaobject handle matches query
- **Check**: Metaobject is published
- **Check**: Fields have correct types

#### 4. Build errors
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

#### 5. City pricing not updating
- **Check**: Product has "City" option in variants
- **Check**: Variant names match supported cities (case-insensitive)
- **Check**: Cookie `selected_city` is being set correctly

#### 6. Pincode check not working
- **Check**: API route `/api/pincode-check` is accessible
- **Check**: Pincode database/metafield is configured
- **Check**: Network requests in browser DevTools

#### 7. Tier discounts not applying
- **Check**: Shopify Function is deployed (`npx shopify app deploy`)
- **Check**: Automatic discount is created in Shopify Admin
- **Check**: Cart has sufficient quantity to trigger tier
- **Check**: Product variants contain city in title

#### 8. Discounts not showing in cart
- **Check**: `discountAllocations` is in cart GraphQL fragment
- **Check**: Console logs show discount data
- **Rebuild**: Clear cache and restart dev server

---

## 📄 License

This project is proprietary and confidential.

---

## 👥 Contributors

- Development Team at Codilar

---

*Last updated: March 2026*
