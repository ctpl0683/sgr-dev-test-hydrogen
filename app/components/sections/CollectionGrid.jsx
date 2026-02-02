import {Link} from 'react-router';
import {Image} from '@shopify/hydrogen';

/**
 * Collection Grid Section
 * Displays a grid of collection cards with images
 * Matching Ritual theme's collection-list section
 * @param {{collections: Array, heading?: string, columns?: number}}
 */
export function CollectionGrid({collections, heading, columns = 4}) {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="collection-grid-section">
      <div className="collection-grid-section__inner page-width">
        {heading && (
          <h2 className="collection-grid-section__heading">{heading}</h2>
        )}
        <div 
          className="collection-grid" 
          style={{'--columns': columns}}
        >
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Individual Collection Card
 * @param {{collection: object}}
 */
function CollectionCard({collection}) {
  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="collection-card"
    >
      <div className="collection-card__image-wrapper">
        {collection.image ? (
          <Image
            data={collection.image}
            className="collection-card__image"
            sizes="(min-width: 990px) 25vw, (min-width: 750px) 33vw, 50vw"
          />
        ) : (
          <div className="collection-card__placeholder" />
        )}
      </div>
      <div className="collection-card__content">
        <h3 className="collection-card__title">{collection.title}</h3>
        {collection.description && (
          <p className="collection-card__description">
            {collection.description.substring(0, 100)}
            {collection.description.length > 100 ? '...' : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
