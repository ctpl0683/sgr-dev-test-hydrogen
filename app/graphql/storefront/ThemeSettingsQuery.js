/**
 * ==========================================================================
 * THEME SETTINGS GRAPHQL QUERIES
 * ==========================================================================
 * Queries for fetching theme customization data from metaobjects
 */

/**
 * Query to fetch theme settings metaobject
 * Create a metaobject definition in Shopify admin with handle: theme_settings
 */
export const THEME_SETTINGS_QUERY = `#graphql
  query ThemeSettings($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobject(handle: {handle: "global", type: "theme_settings"}) {
      id
      handle
      type
      fields {
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
      }
    }
  }
`;

/**
 * Query to fetch homepage sections configuration
 * Create metaobjects for each section type
 */
export const HOMEPAGE_SECTIONS_QUERY = `#graphql
  query HomepageSections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobjects(type: "homepage_section", first: 20, sortKey: "display_order") {
      nodes {
        id
        handle
        type
        fields {
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
            ... on Collection {
              id
              handle
              title
              image {
                url
                altText
              }
            }
            ... on Product {
              id
              handle
              title
              featuredImage {
                url
                altText
              }
            }
          }
          references(first: 10) {
            nodes {
              ... on Collection {
                id
                handle
                title
                image {
                  url
                  altText
                }
              }
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
    }
  }
`;

/**
 * Query to fetch announcement bar settings
 */
export const ANNOUNCEMENT_BAR_QUERY = `#graphql
  query AnnouncementBar($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobject(handle: {handle: "global", type: "announcement_bar"}) {
      id
      fields {
        key
        value
        type
      }
    }
  }
`;

/**
 * Query to fetch social links
 */
export const SOCIAL_LINKS_QUERY = `#graphql
  query SocialLinks($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobject(handle: {handle: "global", type: "social_links"}) {
      id
      fields {
        key
        value
        type
      }
    }
  }
`;

/**
 * Query to fetch homepage image banner metaobject
 * Metaobject type: homepage_section, handle: image-banner
 */
export const HOMEPAGE_IMAGE_BANNER_QUERY = `#graphql
  query HomepageImageBanner($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    metaobject(handle: {handle: "image-banner", type: "homepage_section"}) {
      id
      handle
      type
      fields {
        key
        value
        type
        reference {
          __typename
          ... on MediaImage {
            id
            image {
              url
              altText
              width
              height
            }
          }
          ... on Collection {
            id
            handle
            title
          }
          ... on Product {
            id
            handle
            title
          }
        }
      }
      # Also try fetching image field directly
      image: field(key: "image") {
        key
        value
        reference {
          ... on MediaImage {
            id
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
    }
  }
`;
