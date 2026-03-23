import {useState, useCallback} from 'react';
import {useFetcher} from 'react-router';
import {MapPin, Check, X, Truck, Loader2} from 'lucide-react';
import {getDeliveryEstimateText} from '~/lib/pincode-service';

/**
 * PincodeChecker Component
 * Input field with check button for pincode serviceability
 * @param {{
 *   className?: string;
 *   onResult?: (result: ServiceabilityResult) => void;
 *   productId?: string;
 * }}
 */
export function PincodeChecker({className = '', onResult, productId}) {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null);
  const fetcher = useFetcher();

  const isLoading = fetcher.state === 'submitting' || fetcher.state === 'loading';

  const handleCheck = useCallback(async () => {
    if (!pincode || pincode.length !== 6) {
      setResult({
        serviceable: false,
        message: 'Please enter a valid 6-digit pincode',
      });
      return;
    }

    fetcher.submit(
      {pincode, productId: productId || ''},
      {method: 'POST', action: '/api/pincode-check'}
    );
  }, [pincode, productId, fetcher]);

  // Update result when fetcher completes
  if (fetcher.data && fetcher.data !== result) {
    setResult(fetcher.data);
    onResult?.(fetcher.data);
  }

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
    // Clear result when input changes
    if (result) setResult(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCheck();
    }
  };

  return (
    <div className={`pincode-checker ${className}`}>
      <div className="pincode-checker__header">
        <Truck size={16} className="pincode-checker__icon" />
        <span className="pincode-checker__title">Check Delivery Availability</span>
      </div>

      <div className="pincode-checker__input-group">
        <div className="pincode-checker__input-wrapper">
          <MapPin size={16} className="pincode-checker__input-icon" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pincode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter pincode"
            className="pincode-checker__input"
            aria-label="Enter pincode"
          />
        </div>
        <button
          type="button"
          onClick={handleCheck}
          disabled={isLoading || pincode.length !== 6}
          className="pincode-checker__button"
        >
          {isLoading ? (
            <Loader2 size={16} className="pincode-checker__spinner" />
          ) : (
            'Check'
          )}
        </button>
      </div>

      {result && (
        <PincodeResult result={result} />
      )}
    </div>
  );
}

/**
 * PincodeResult Component
 * Displays the serviceability check result
 * @param {{result: ServiceabilityResult}}
 */
function PincodeResult({result}) {
  if (result.serviceable) {
    return (
      <div className="pincode-result pincode-result--success">
        <div className="pincode-result__icon">
          <Check size={16} />
        </div>
        <div className="pincode-result__content">
          <span className="pincode-result__message">{result.message}</span>
          {result.deliveryDays && (
            <span className="pincode-result__delivery">
              <Truck size={14} />
              Estimated delivery: <strong>{getDeliveryEstimateText(result.deliveryDays)}</strong>
            </span>
          )}
          {result.codAvailable && (
            <span className="pincode-result__cod">
              Cash on Delivery available
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pincode-result pincode-result--error">
      <div className="pincode-result__icon">
        <X size={16} />
      </div>
      <div className="pincode-result__content">
        <span className="pincode-result__message">{result.message}</span>
      </div>
    </div>
  );
}

/**
 * Compact Pincode Checker for product cards
 * @param {{className?: string}}
 */
export function PincodeCheckerCompact({className = ''}) {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    if (!pincode || pincode.length !== 6) return;

    setIsChecking(true);
    try {
      const response = await fetch('/api/pincode-check', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({pincode}),
      });
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setResult({serviceable: false, message: 'Error checking pincode'});
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className={`pincode-checker-compact ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={pincode}
        onChange={(e) => {
          setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
          setResult(null);
        }}
        placeholder="Pincode"
        className="pincode-checker-compact__input"
      />
      <button
        type="button"
        onClick={handleCheck}
        disabled={isChecking || pincode.length !== 6}
        className="pincode-checker-compact__button"
      >
        {isChecking ? '...' : 'Check'}
      </button>
      {result && (
        <span
          className={`pincode-checker-compact__result ${
            result.serviceable ? 'pincode-checker-compact__result--success' : 'pincode-checker-compact__result--error'
          }`}
        >
          {result.serviceable ? '✓' : '✗'}
        </span>
      )}
    </div>
  );
}

/**
 * Pincode Serviceability Badge
 * Shows serviceability status for a saved pincode
 * @param {{
 *   pincode: string;
 *   serviceable: boolean;
 *   deliveryDays?: number;
 *   className?: string;
 * }}
 */
export function PincodeServiceabilityBadge({
  pincode,
  serviceable,
  deliveryDays,
  className = '',
}) {
  if (!pincode) return null;

  return (
    <div
      className={`pincode-badge ${
        serviceable ? 'pincode-badge--success' : 'pincode-badge--error'
      } ${className}`}
    >
      <MapPin size={12} />
      <span>{pincode}</span>
      {serviceable ? (
        <>
          <Check size={12} />
          {deliveryDays && (
            <span className="pincode-badge__delivery">
              {getDeliveryEstimateText(deliveryDays)}
            </span>
          )}
        </>
      ) : (
        <X size={12} />
      )}
    </div>
  );
}

/** @typedef {import('~/lib/pincode-service').ServiceabilityResult} ServiceabilityResult */
