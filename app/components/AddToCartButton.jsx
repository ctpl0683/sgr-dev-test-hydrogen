import {CartForm} from '@shopify/hydrogen';
import {useCity} from '~/context/CityContext';

/**
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 *   includeCity?: boolean;
 * }}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  includeCity = true,
}) {
  const {selectedCity} = useCity();

  // Add city attribute to each line for cart consistency and checkout
  const linesWithAttributes = includeCity
    ? lines.map((line) => ({
        ...line,
        attributes: [
          ...(line.attributes || []),
          {key: 'selected_city', value: selectedCity},
        ],
      }))
    : lines;

  return (
    <CartForm route="/cart" inputs={{lines: linesWithAttributes}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics)}
          />
          <button
            type="submit"
            onClick={onClick}
            disabled={disabled ?? fetcher.state !== 'idle'}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */
