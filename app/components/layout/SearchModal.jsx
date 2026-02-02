import {useId} from 'react';
import {Link} from 'react-router';
import {useAside} from '~/components/Aside';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';
import {Search, X} from 'lucide-react';

/**
 * Search Modal component matching Ritual theme
 * Features: Full predictive search, product/collection/page results
 */
export function SearchModal() {
  const queriesDatalistId = useId();
  const {close} = useAside();

  return (
    <div className="search-modal">
      {/* Search Header */}
      <div className="search-modal__header">
        <span className="search-modal__title">SEARCH</span>
        <button
          className="search-modal__close"
          onClick={close}
          aria-label="Close search"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Search Form */}
      <div className="search-modal__form-wrapper">
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <div className="search-modal__form">
              <div className="search-modal__input-wrapper">
                <Search size={20} strokeWidth={1.5} className="search-modal__input-icon" />
                <input
                  name="q"
                  onChange={fetchResults}
                  onFocus={fetchResults}
                  placeholder="Search products, collections..."
                  ref={inputRef}
                  type="search"
                  className="search-modal__input"
                  list={queriesDatalistId}
                  autoComplete="off"
                />
              </div>
              <button
                onClick={goToSearch}
                className="search-modal__submit button"
              >
                Search
              </button>
            </div>
          )}
        </SearchFormPredictive>
      </div>

      {/* Search Results */}
      <div className="search-modal__results">
        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return (
                <div className="search-modal__loading">
                  <div className="spinner"></div>
                  <span>Searching...</span>
                </div>
              );
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <div className="search-modal__results-content">
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />

                {/* Products */}
                {products && products.length > 0 && (
                  <div className="search-modal__section">
                    <h5 className="search-modal__section-title">Products</h5>
                    <div className="search-modal__products">
                      {products.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.handle}`}
                          onClick={closeSearch}
                          className="search-modal__product"
                        >
                          {product.featuredImage && (
                            <img
                              src={product.featuredImage.url}
                              alt={product.featuredImage.altText || product.title}
                              className="search-modal__product-image"
                              width={60}
                              height={75}
                            />
                          )}
                          <div className="search-modal__product-info">
                            <span className="search-modal__product-title">
                              {product.title}
                            </span>
                            <span className="search-modal__product-price">
                              {product.priceRange?.minVariantPrice?.amount &&
                                new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: product.priceRange.minVariantPrice.currencyCode,
                                }).format(parseFloat(product.priceRange.minVariantPrice.amount))}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collections */}
                {collections && collections.length > 0 && (
                  <div className="search-modal__section">
                    <h5 className="search-modal__section-title">Collections</h5>
                    <div className="search-modal__list">
                      {collections.map((collection) => (
                        <Link
                          key={collection.id}
                          to={`/collections/${collection.handle}`}
                          onClick={closeSearch}
                          className="search-modal__list-item"
                        >
                          {collection.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pages */}
                {pages && pages.length > 0 && (
                  <div className="search-modal__section">
                    <h5 className="search-modal__section-title">Pages</h5>
                    <div className="search-modal__list">
                      {pages.map((page) => (
                        <Link
                          key={page.id}
                          to={`/pages/${page.handle}`}
                          onClick={closeSearch}
                          className="search-modal__list-item"
                        >
                          {page.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Articles */}
                {articles && articles.length > 0 && (
                  <div className="search-modal__section">
                    <h5 className="search-modal__section-title">Articles</h5>
                    <div className="search-modal__list">
                      {articles.map((article) => (
                        <Link
                          key={article.id}
                          to={`/blogs/${article.blog?.handle}/${article.handle}`}
                          onClick={closeSearch}
                          className="search-modal__list-item"
                        >
                          {article.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* View All Link */}
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                    className="search-modal__view-all"
                  >
                    View all results for "{term.current}" →
                  </Link>
                ) : null}
              </div>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </div>
  );
}
