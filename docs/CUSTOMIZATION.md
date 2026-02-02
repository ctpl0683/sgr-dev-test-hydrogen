# Hydrogen Store Customization Guide

This guide explains how to customize your Hydrogen storefront using Shopify's metaobjects and metafields through the Shopify admin.

## Table of Contents
1. [Overview](#overview)
2. [Metaobject Definitions](#metaobject-definitions)
3. [Metafield Definitions](#metafield-definitions)
4. [Setup Instructions](#setup-instructions)
5. [Usage Examples](#usage-examples)

---

## Overview

This Hydrogen store supports customization through:
- **Metaobjects**: For structured theme settings and content blocks
- **Metafields**: For extending products, collections, and shop data
- **Menus**: For navigation (already built into Shopify)

---

## Metaobject Definitions

Create these metaobject definitions in Shopify Admin → Settings → Custom data → Metaobject definitions.

### 1. Theme Settings (`theme_settings`)

Global theme configuration.

| Field Key | Type | Description |
|-----------|------|-------------|
| `color_scheme` | Single line text | Active color scheme (scheme-1 to scheme-6) |
| `primary_color` | Color | Primary brand color |
| `secondary_color` | Color | Secondary color |
| `accent_color` | Color | Accent/highlight color |
| `heading_font` | Single line text | Heading font family |
| `body_font` | Single line text | Body font family |
| `page_width` | Single line text | Max page width (e.g., "1400px") |
| `header_transparent_homepage` | Boolean | Transparent header on homepage |
| `header_sticky` | Boolean | Sticky header enabled |
| `logo` | File (Image) | Site logo |
| `favicon` | File (Image) | Site favicon |

**Create an entry with handle: `global`**

### 2. Announcement Bar (`announcement_bar`)

Top-of-page announcement banner.

| Field Key | Type | Description |
|-----------|------|-------------|
| `enabled` | Boolean | Show/hide announcement |
| `text` | Single line text | Announcement message |
| `link` | URL | Optional link URL |
| `background_color` | Color | Background color |
| `text_color` | Color | Text color |

**Create an entry with handle: `global`**

### 3. Social Links (`social_links`)

Social media profile links.

| Field Key | Type | Description |
|-----------|------|-------------|
| `instagram` | URL | Instagram profile URL |
| `twitter` | URL | Twitter/X profile URL |
| `facebook` | URL | Facebook page URL |
| `tiktok` | URL | TikTok profile URL |
| `youtube` | URL | YouTube channel URL |
| `pinterest` | URL | Pinterest profile URL |

**Create an entry with handle: `global`**

### 4. Homepage Section (`homepage_section`)

Dynamic homepage sections.

| Field Key | Type | Description |
|-----------|------|-------------|
| `section_type` | Single line text | Type: hero, collection_grid, featured_product, product_carousel, marquee, image_banner |
| `display_order` | Integer | Order on page (1, 2, 3...) |
| `enabled` | Boolean | Show/hide section |
| `heading` | Single line text | Section heading |
| `subheading` | Single line text | Section subheading |
| `background_color` | Color | Section background |
| `text_color` | Color | Section text color |
| `collection` | Collection reference | For collection-based sections |
| `collections` | List of Collection references | For multi-collection sections |
| `product` | Product reference | For featured product section |
| `products` | List of Product references | For product carousel |
| `image` | File (Image) | Background/hero image |
| `button_text` | Single line text | CTA button text |
| `button_link` | URL | CTA button link |

---

## Metafield Definitions

Create these metafield definitions in Shopify Admin → Settings → Custom data.

### Product Metafields

| Namespace | Key | Type | Description |
|-----------|-----|------|-------------|
| `custom` | `badge` | Single line text | Product badge (e.g., "New", "Sale", "Bestseller") |
| `custom` | `subtitle` | Single line text | Product subtitle |
| `custom` | `features` | List of single line text | Product features list |
| `custom` | `care_instructions` | Rich text | Care/washing instructions |
| `custom` | `size_guide` | Rich text | Size guide content |
| `custom` | `video_url` | URL | Product video URL |
| `custom` | `related_products` | List of Product references | Manually curated related products |

### Collection Metafields

| Namespace | Key | Type | Description |
|-----------|-----|------|-------------|
| `custom` | `banner_image` | File (Image) | Collection banner image |
| `custom` | `banner_heading` | Single line text | Banner heading override |
| `custom` | `banner_subheading` | Single line text | Banner subheading |
| `custom` | `featured_products` | List of Product references | Featured products to highlight |
| `custom` | `show_filters` | Boolean | Show/hide filters |
| `custom` | `products_per_row` | Integer | Products per row (2-6) |

### Shop Metafields

| Namespace | Key | Type | Description |
|-----------|-----|------|-------------|
| `custom` | `logo` | File (Image) | Site logo |
| `custom` | `favicon` | File (Image) | Site favicon |
| `custom` | `announcement_text` | Single line text | Quick announcement text |
| `custom` | `announcement_link` | URL | Announcement link |
| `custom` | `free_shipping_threshold` | Number (decimal) | Free shipping minimum |

---

## Setup Instructions

### Step 1: Create Metaobject Definitions

1. Go to Shopify Admin → Settings → Custom data → Metaobject definitions
2. Click "Add definition"
3. Create each metaobject type listed above
4. Add the fields as specified

### Step 2: Create Metaobject Entries

1. Go to Shopify Admin → Content → Metaobjects
2. Select the metaobject type
3. Click "Add entry"
4. For global settings, use handle: `global`
5. Fill in the values

### Step 3: Create Metafield Definitions

1. Go to Shopify Admin → Settings → Custom data
2. Select Products, Collections, or Shop
3. Click "Add definition"
4. Create each metafield as specified

### Step 4: Add Metafield Values

1. Go to a product/collection in Shopify Admin
2. Scroll to the Metafields section
3. Fill in the custom fields

---

## Usage Examples

### Accessing Theme Settings in Components

```jsx
import {useThemeSettings} from '~/context/ThemeSettingsContext';

function MyComponent() {
  const {settings, getSetting} = useThemeSettings();
  
  const primaryColor = getSetting('primary_color', '#000000');
  const isSticky = getSetting('header_sticky', true);
  
  return (
    <div style={{color: primaryColor}}>
      {/* Your content */}
    </div>
  );
}
```

### Accessing Product Metafields

```jsx
import {getMetafield} from '~/lib/metaobjects';

function ProductBadge({product}) {
  const badge = getMetafield(product, 'custom', 'badge');
  
  if (!badge) return null;
  
  return <span className="product-badge">{badge}</span>;
}
```

### Accessing Collection Metafields

```jsx
import {getMetafield} from '~/lib/metaobjects';

function CollectionBanner({collection}) {
  const bannerImage = getMetafield(collection, 'custom', 'banner_image');
  const heading = getMetafield(collection, 'custom', 'banner_heading') || collection.title;
  
  return (
    <div className="collection-banner">
      {bannerImage && <img src={bannerImage.image.url} alt={heading} />}
      <h1>{heading}</h1>
    </div>
  );
}
```

### Dynamic Homepage Sections

The homepage can be configured to show different sections based on metaobject entries. Each `homepage_section` entry defines a section with its type, content, and display order.

---

## GraphQL Queries

The following queries are available in `app/graphql/storefront/`:

- `ThemeSettingsQuery.js` - Theme settings, homepage sections, announcement bar
- `MetafieldQueries.js` - Product, collection, and shop metafield fragments

### Adding Metafields to Existing Queries

To add metafields to a product query:

```graphql
query Product($handle: String!) {
  product(handle: $handle) {
    id
    title
    # ... other fields
    metafields(identifiers: [
      {namespace: "custom", key: "badge"},
      {namespace: "custom", key: "features"}
    ]) {
      namespace
      key
      value
      type
    }
  }
}
```

---

## Best Practices

1. **Use consistent naming**: Follow the `namespace.key` pattern (e.g., `custom.badge`)
2. **Provide defaults**: Always have fallback values in your components
3. **Cache appropriately**: Metaobject queries can be cached longer than product data
4. **Document changes**: Update this guide when adding new customization options
5. **Test thoroughly**: Test with empty/missing metafield values

---

## Troubleshooting

### Metafields not showing?
- Ensure the metafield definition exists
- Check the namespace and key match exactly
- Verify the metafield has a value set

### Metaobject not found?
- Check the handle matches (e.g., `global`)
- Ensure the metaobject type is correct
- Verify the entry is published

### Changes not reflecting?
- Clear browser cache
- Restart the dev server
- Check for GraphQL query errors in console
