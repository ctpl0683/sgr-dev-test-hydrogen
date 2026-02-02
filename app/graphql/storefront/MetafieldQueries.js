/**
 * ==========================================================================
 * METAFIELD GRAPHQL FRAGMENTS & QUERIES
 * ==========================================================================
 * Reusable fragments for fetching metafields on products, collections, etc.
 */

/**
 * Product metafields fragment
 * Add this to your product queries to fetch custom metafields
 */
export const PRODUCT_METAFIELDS_FRAGMENT = `#graphql
  fragment ProductMetafields on Product {
    metafields(identifiers: [
      {namespace: "custom", key: "badge"},
      {namespace: "custom", key: "subtitle"},
      {namespace: "custom", key: "features"},
      {namespace: "custom", key: "care_instructions"},
      {namespace: "custom", key: "size_guide"},
      {namespace: "custom", key: "video_url"},
      {namespace: "custom", key: "related_products"}
    ]) {
      namespace
      key
      value
      type
      reference {
        ... on MediaImage {
          image {
            url
            altText
          }
        }
        ... on Video {
          sources {
            url
            mimeType
          }
        }
      }
      references(first: 10) {
        nodes {
          ... on Product {
            id
            handle
            title
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Collection metafields fragment
 */
export const COLLECTION_METAFIELDS_FRAGMENT = `#graphql
  fragment CollectionMetafields on Collection {
    metafields(identifiers: [
      {namespace: "custom", key: "banner_image"},
      {namespace: "custom", key: "banner_heading"},
      {namespace: "custom", key: "banner_subheading"},
      {namespace: "custom", key: "featured_products"},
      {namespace: "custom", key: "show_filters"},
      {namespace: "custom", key: "products_per_row"}
    ]) {
      namespace
      key
      value
      type
      reference {
        ... on MediaImage {
          image {
            url
            altText
            width
            height
          }
        }
      }
      references(first: 10) {
        nodes {
          ... on Product {
            id
            handle
            title
          }
        }
      }
    }
  }
`;

/**
 * Shop metafields query for global settings
 */
export const SHOP_METAFIELDS_QUERY = `#graphql
  query ShopMetafields($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    shop {
      id
      name
      metafields(identifiers: [
        {namespace: "custom", key: "logo"},
        {namespace: "custom", key: "favicon"},
        {namespace: "custom", key: "announcement_text"},
        {namespace: "custom", key: "announcement_link"},
        {namespace: "custom", key: "free_shipping_threshold"},
        {namespace: "custom", key: "social_instagram"},
        {namespace: "custom", key: "social_twitter"},
        {namespace: "custom", key: "social_facebook"},
        {namespace: "custom", key: "social_tiktok"}
      ]) {
        namespace
        key
        value
        type
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
  }
`;
