import {useLoaderData, useSearchParams, useNavigate, Link} from 'react-router';
import {getPaginationVariables, Analytics, Money, Image} from '@shopify/hydrogen';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {getEmptyPredictiveSearchResult, urlWithTrackingParams} from '~/lib/search';
import {useState, useCallback} from 'react';

/**
 * @type {Route.MetaFunction}
 */
export const meta = () => {
  return [{title: `Hydrogen | Search`}];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({request, context})
    : regularSearch({request, context});

  searchPromise.catch((error) => {
    console.error(error);
    return {term: '', result: null, error: error.message};
  });

  return await searchPromise;
}

/**
 * Renders the /search route
 */
export default function SearchPage() {
  /** @type {LoaderReturnData} */
  const {type, term, result, error, filters, appliedFilters, sortOptions, selectedSort} = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  if (type === 'predictive') return null;

  const productCount = result?.items?.products?.nodes?.length || 0;
  const totalCount = result?.total || 0;

  // Handle filter changes
  const handleFilterChange = useCallback((filterType, value, checked) => {
    const params = new URLSearchParams(searchParams);
    const currentValues = params.getAll(filterType);
    
    if (checked) {
      params.append(filterType, value);
    } else {
      params.delete(filterType);
      currentValues.filter(v => v !== value).forEach(v => params.append(filterType, v));
    }
    
    navigate(`/search?${params.toString()}`);
  }, [searchParams, navigate]);

  // Handle sort change
  const handleSortChange = useCallback((sortKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortKey);
    navigate(`/search?${params.toString()}`);
  }, [searchParams, navigate]);

  // Handle price range
  const handlePriceRange = useCallback((min, max) => {
    const params = new URLSearchParams(searchParams);
    if (min) params.set('minPrice', min);
    else params.delete('minPrice');
    if (max) params.set('maxPrice', max);
    else params.delete('maxPrice');
    navigate(`/search?${params.toString()}`);
  }, [searchParams, navigate]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set('q', term);
    navigate(`/search?${params.toString()}`);
  }, [term, navigate]);

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-page__header">
        <div className="search-page__header-inner page-width">
          <h1 className="search-page__title">
            {term ? `Search results for "${term}"` : 'Search'}
          </h1>
          {term && totalCount > 0 && (
            <p className="search-page__count">
              {totalCount} {totalCount === 1 ? 'result' : 'results'} found
            </p>
          )}
          
          {/* Search Form */}
          <SearchForm>
            {({inputRef}) => (
              <div className="search-page__form">
                <div className="search-page__input-wrapper">
                  <svg className="search-page__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    defaultValue={term}
                    name="q"
                    placeholder="Search products, articles..."
                    ref={inputRef}
                    type="search"
                    className="search-page__input"
                  />
                </div>
                <button type="submit" className="search-page__submit button">
                  Search
                </button>
              </div>
            )}
          </SearchForm>
        </div>
      </div>

      {error && (
        <div className="search-page__error page-width">
          <p>{error}</p>
        </div>
      )}

      {!term ? (
        <div className="search-page__empty page-width">
          <div className="search-page__empty-content">
            <svg className="search-page__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <h2>Start your search</h2>
            <p>Enter a search term to find products, articles, and more.</p>
          </div>
        </div>
      ) : !result?.total ? (
        <div className="search-page__empty page-width">
          <div className="search-page__empty-content">
            <svg className="search-page__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <path d="M8 8l6 6M14 8l-6 6"/>
            </svg>
            <h2>No results found</h2>
            <p>Try adjusting your search or browse our collections.</p>
            <Link to="/collections" className="button">Browse Collections</Link>
          </div>
        </div>
      ) : (
        <div className="search-page__content page-width">
          {/* Mobile Filter Toggle */}
          <button 
            className="search-page__filter-toggle"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
            Filters {appliedFilters?.length > 0 && `(${appliedFilters.length})`}
          </button>

          <div className="search-page__layout">
            {/* Filters Sidebar */}
            <aside className={`search-page__filters ${mobileFiltersOpen ? 'search-page__filters--open' : ''}`}>
              <div className="search-page__filters-header">
                <h3>Filters</h3>
                {appliedFilters?.length > 0 && (
                  <button className="search-page__clear-filters" onClick={clearFilters}>
                    Clear all
                  </button>
                )}
                <button 
                  className="search-page__filters-close"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  ×
                </button>
              </div>

              {/* Applied Filters */}
              {appliedFilters?.length > 0 && (
                <div className="search-page__applied-filters">
                  {appliedFilters.map((filter, index) => (
                    <button 
                      key={index}
                      className="search-page__applied-filter"
                      onClick={() => handleFilterChange(filter.type, filter.value, false)}
                    >
                      {filter.label}
                      <span>×</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Price Range Filter */}
              <div className="search-page__filter-group">
                <h4 className="search-page__filter-title">Price</h4>
                <div className="search-page__price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    defaultValue={searchParams.get('minPrice') || ''}
                    onBlur={(e) => handlePriceRange(e.target.value, searchParams.get('maxPrice'))}
                    className="search-page__price-input"
                  />
                  <span>—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    defaultValue={searchParams.get('maxPrice') || ''}
                    onBlur={(e) => handlePriceRange(searchParams.get('minPrice'), e.target.value)}
                    className="search-page__price-input"
                  />
                </div>
              </div>

              {/* Dynamic Filters from Search & Discovery */}
              {filters?.map((filterGroup) => (
                <div key={filterGroup.id} className="search-page__filter-group">
                  <h4 className="search-page__filter-title">{filterGroup.label}</h4>
                  <div className="search-page__filter-options">
                    {filterGroup.values.slice(0, 10).map((option) => (
                      <label key={option.id} className="search-page__filter-option">
                        <input
                          type="checkbox"
                          checked={searchParams.getAll(filterGroup.id).includes(option.value)}
                          onChange={(e) => handleFilterChange(filterGroup.id, option.value, e.target.checked)}
                        />
                        <span className="search-page__filter-label">
                          {option.label}
                          {option.count && <span className="search-page__filter-count">({option.count})</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </aside>

            {/* Results */}
            <div className="search-page__results">
              {/* Sort & View Options */}
              <div className="search-page__toolbar">
                <div className="search-page__sort">
                  <label htmlFor="sort">Sort by:</label>
                  <select 
                    id="sort" 
                    value={selectedSort || 'relevance'}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="title-asc">A-Z</option>
                    <option value="title-desc">Z-A</option>
                    <option value="created-desc">Newest</option>
                  </select>
                </div>
                <p className="search-page__results-count">
                  Showing {productCount} products
                </p>
              </div>

              {/* Products Grid */}
              <SearchResultsProducts 
                products={result.items.products} 
                term={term} 
              />

              {/* Articles & Pages */}
              {(result.items.articles?.nodes?.length > 0 || result.items.pages?.nodes?.length > 0) && (
                <div className="search-page__other-results">
                  {result.items.articles?.nodes?.length > 0 && (
                    <div className="search-page__articles">
                      <h3>Articles</h3>
                      <ul>
                        {result.items.articles.nodes.map((article) => (
                          <li key={article.id}>
                            <SearchResultLink
                              to={`/blogs/${article.handle}`}
                              trackingParams={article.trackingParameters}
                              term={term}
                            >
                              {article.title}
                            </SearchResultLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.items.pages?.nodes?.length > 0 && (
                    <div className="search-page__pages">
                      <h3>Pages</h3>
                      <ul>
                        {result.items.pages.nodes.map((page) => (
                          <li key={page.id}>
                            <SearchResultLink
                              to={`/pages/${page.handle}`}
                              trackingParams={page.trackingParameters}
                              term={term}
                            >
                              {page.title}
                            </SearchResultLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Analytics.SearchView data={{searchTerm: term, searchResults: result}} />
    </div>
  );
}

/**
 * Search Result Link with click tracking
 */
function SearchResultLink({to, trackingParams, term, children, className}) {
  const url = trackingParams 
    ? urlWithTrackingParams({baseUrl: to, trackingParams, term})
    : to;

  return (
    <Link 
      to={url} 
      className={className}
      onClick={() => {
        // Track search result click for relevance learning
        if (typeof window !== 'undefined' && window.Shopify?.analytics) {
          window.Shopify.analytics.publish('search_result_click', {
            searchTerm: term,
            clickedUrl: to,
          });
        }
      }}
    >
      {children}
    </Link>
  );
}

/**
 * Products grid with click tracking
 */
function SearchResultsProducts({products, term}) {
  if (!products?.nodes?.length) return null;

  return (
    <div className="search-page__products-grid">
      {products.nodes.map((product) => (
        <SearchProductCard key={product.id} product={product} term={term} />
      ))}
    </div>
  );
}

/**
 * Product card with click tracking
 */
function SearchProductCard({product, term}) {
  const variant = product.selectedOrFirstAvailableVariant;
  const image = variant?.image;
  const price = variant?.price;
  const compareAtPrice = variant?.compareAtPrice;
  const isOnSale = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price?.amount || '0');

  const productUrl = product.trackingParameters
    ? urlWithTrackingParams({
        baseUrl: `/products/${product.handle}`,
        trackingParams: product.trackingParameters,
        term,
      })
    : `/products/${product.handle}`;

  const handleClick = () => {
    // Track search result click for relevance learning
    if (typeof window !== 'undefined' && window.Shopify?.analytics) {
      window.Shopify.analytics.publish('search_result_click', {
        searchTerm: term,
        productId: product.id,
        productTitle: product.title,
      });
    }
  };

  return (
    <div className="search-product-card">
      <Link 
        to={productUrl} 
        className="search-product-card__link"
        onClick={handleClick}
      >
        <div className="search-product-card__media">
          {image ? (
            <Image
              alt={image.altText || product.title}
              data={image}
              loading="lazy"
              sizes="(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw"
            />
          ) : (
            <div className="search-product-card__placeholder" />
          )}
          {isOnSale && (
            <span className="search-product-card__badge">Sale</span>
          )}
        </div>
        <div className="search-product-card__info">
          {product.vendor && (
            <span className="search-product-card__vendor">{product.vendor}</span>
          )}
          <h3 className="search-product-card__title">{product.title}</h3>
          <div className="search-product-card__price">
            {price && <Money data={price} />}
            {isOnSale && compareAtPrice && (
              <s className="search-product-card__compare-price">
                <Money data={compareAtPrice} />
              </s>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment SearchProduct on Product {
    __typename
    handle
    id
    publishedAt
    title
    trackingParameters
    vendor
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
`;

const SEARCH_PAGE_FRAGMENT = `#graphql
  fragment SearchPage on Page {
     __typename
     handle
    id
    title
    trackingParameters
  }
`;

const SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment SearchArticle on Article {
    __typename
    handle
    id
    title
    trackingParameters
  }
`;

const PAGE_INFO_FRAGMENT = `#graphql
  fragment PageInfoFragment on PageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
  query RegularSearch(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $term: String!
    $startCursor: String
    $productFilters: [ProductFilter!]
    $sortKey: SearchSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    articles: search(
      query: $term,
      types: [ARTICLE],
      first: 5,
    ) {
      nodes {
        ...on Article {
          ...SearchArticle
        }
      }
    }
    pages: search(
      query: $term,
      types: [PAGE],
      first: 5,
    ) {
      nodes {
        ...on Page {
          ...SearchPage
        }
      }
    }
    products: search(
      after: $endCursor,
      before: $startCursor,
      first: $first,
      last: $last,
      query: $term,
      sortKey: $sortKey,
      reverse: $reverse,
      types: [PRODUCT],
      unavailableProducts: HIDE,
      productFilters: $productFilters,
    ) {
      nodes {
        ...on Product {
          ...SearchProduct
        }
      }
      pageInfo {
        ...PageInfoFragment
      }
    }
  }
  ${SEARCH_PRODUCT_FRAGMENT}
  ${SEARCH_PAGE_FRAGMENT}
  ${SEARCH_ARTICLE_FRAGMENT}
  ${PAGE_INFO_FRAGMENT}
`;

/**
 * Regular search fetcher with filter support
 * @param {Pick<
 *   Route.LoaderArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<RegularSearchReturn>}
 */
async function regularSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const variables = getPaginationVariables(request, {pageBy: 24});
  const term = String(url.searchParams.get('q') || '');
  
  // Get filter parameters
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const vendors = url.searchParams.getAll('vendor');
  const productTypes = url.searchParams.getAll('productType');
  const sortParam = url.searchParams.get('sort') || 'relevance';

  // Build product filters for the query
  const productFilters = [];
  
  // Price filter
  if (minPrice || maxPrice) {
    const priceFilter = {price: {}};
    if (minPrice) priceFilter.price.min = parseFloat(minPrice);
    if (maxPrice) priceFilter.price.max = parseFloat(maxPrice);
    productFilters.push(priceFilter);
  }
  
  // Vendor filter
  vendors.forEach(vendor => {
    productFilters.push({productVendor: vendor});
  });
  
  // Product type filter
  productTypes.forEach(type => {
    productFilters.push({productType: type});
  });

  // Map sort parameter to Shopify sort key
  const sortKeyMap = {
    'relevance': 'RELEVANCE',
    'price-asc': 'PRICE',
    'price-desc': 'PRICE',
    'title-asc': 'TITLE',
    'title-desc': 'TITLE',
    'created-desc': 'CREATED_AT',
  };
  const sortKey = sortKeyMap[sortParam] || 'RELEVANCE';
  const reverse = sortParam.includes('desc');

  // Search articles, pages, and products for the `q` term
  const {errors, ...items} = await storefront.query(SEARCH_QUERY, {
    variables: {
      ...variables, 
      term,
      productFilters: productFilters.length > 0 ? productFilters : undefined,
      sortKey,
      reverse,
    },
  });

  if (!items) {
    throw new Error('No search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, {nodes}) => acc + nodes.length,
    0,
  );

  const error = errors
    ? errors.map(({message}) => message).join(', ')
    : undefined;

  // Build applied filters list for UI
  const appliedFilters = [];
  if (minPrice) appliedFilters.push({type: 'minPrice', value: minPrice, label: `Min: $${minPrice}`});
  if (maxPrice) appliedFilters.push({type: 'maxPrice', value: maxPrice, label: `Max: $${maxPrice}`});
  vendors.forEach(v => appliedFilters.push({type: 'vendor', value: v, label: v}));
  productTypes.forEach(t => appliedFilters.push({type: 'productType', value: t, label: t}));

  // Extract available filters from results (vendors, product types)
  const availableVendors = new Set();
  const availableTypes = new Set();
  items.products?.nodes?.forEach(product => {
    if (product.vendor) availableVendors.add(product.vendor);
  });

  const filters = [
    {
      id: 'vendor',
      label: 'Brand',
      values: Array.from(availableVendors).map(v => ({id: v, value: v, label: v})),
    },
  ];

  return {
    type: 'regular', 
    term, 
    error, 
    result: {total, items},
    filters,
    appliedFilters,
    selectedSort: sortParam,
  };
}

/**
 * Predictive search query and fragments
 * (adjust as needed)
 */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
`;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
    }
  }
`;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/predictiveSearch
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;

/**
 * Predictive search fetcher
 * @param {Pick<
 *   Route.ActionArgs,
 *   'request' | 'context'
 * >}
 * @return {Promise<PredictiveSearchReturn>}
 */
async function predictiveSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Predictively search articles, collections, pages, products, and queries (suggestions)
  const {predictiveSearch: items, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        // customize search options as needed
        limit,
        limitScope: 'EACH',
        term,
      },
    },
  );

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc, item) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}

/** @typedef {import('./+types/search').Route} Route */
/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
/** @typedef {import('storefrontapi.generated').RegularSearchQuery} RegularSearchQuery */
/** @typedef {import('storefrontapi.generated').PredictiveSearchQuery} PredictiveSearchQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
