import {useCity} from '~/context/CityContext';
import {useNavigate, useLocation} from 'react-router';
import {ChevronDown, MapPin} from 'lucide-react';

/**
 * City Selector Dropdown Component
 * Allows users to select their city for pricing
 */
export function CitySelector({className = '', showLabel = true, showIcon = true}) {
  const {selectedCity, setCity, supportedCities, cityOptionName} = useCity();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCityChange = async (e) => {
    const newCity = e.target.value;
    const success = await setCity(newCity);
    
    if (!success) return;
    
    // If on a product page, update URL to reflect new city variant
    if (location.pathname.includes('/products/')) {
      const params = new URLSearchParams(location.search);
      params.set(cityOptionName, newCity);
      navigate(`${location.pathname}?${params.toString()}`, {replace: true});
    } else if (location.pathname.includes('/collections/')) {
      // Refresh collection page to get updated prices
      navigate(location.pathname + location.search, {replace: true});
    }
  };

  return (
    <div className={`city-selector ${className}`}>
      {showIcon && (
        <MapPin className="city-selector__icon" size={16} aria-hidden="true" />
      )}
      {showLabel && (
        <label htmlFor="city-select" className="city-selector__label">
          Deliver to:
        </label>
      )}
      <div className="city-selector__wrapper">
        <select
          id="city-select"
          value={selectedCity}
          onChange={handleCityChange}
          className="city-selector__select"
          aria-label="Select your city for pricing"
        >
          {supportedCities.map((city) => (
            <option key={city.value} value={city.value}>
              {city.label}
            </option>
          ))}
        </select>
        <ChevronDown className="city-selector__chevron" size={14} aria-hidden="true" />
      </div>
    </div>
  );
}

/**
 * City Banner Component
 * Displays current city with option to change
 */
export function CityBanner({className = ''}) {
  const {getCityLabel} = useCity();

  return (
    <div className={`city-banner ${className}`}>
      <MapPin className="city-banner__icon" size={16} aria-hidden="true" />
      <span className="city-banner__text">
        Delivering to <strong>{getCityLabel()}</strong>
      </span>
      <CitySelector showLabel={false} showIcon={false} className="city-banner__selector" />
    </div>
  );
}

/**
 * Compact City Selector for Header
 */
export function CitySelectorCompact({className = ''}) {
  const {selectedCity, setCity, supportedCities, cityOptionName} = useCity();
  const navigate = useNavigate();
  const location = useLocation();

  const handleCityChange = async (e) => {
    const newCity = e.target.value;
    const success = await setCity(newCity);
    
    if (!success) return;
    
    if (location.pathname.includes('/products/')) {
      const params = new URLSearchParams(location.search);
      params.set(cityOptionName, newCity);
      navigate(`${location.pathname}?${params.toString()}`, {replace: true});
    }
  };

  return (
    <div className={`city-selector-compact ${className}`}>
      <MapPin className="city-selector-compact__icon" size={14} aria-hidden="true" />
      <select
        value={selectedCity}
        onChange={handleCityChange}
        className="city-selector-compact__select"
        aria-label="Select your city"
      >
        {supportedCities.map((city) => (
          <option key={city.value} value={city.value}>
            {city.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * City Selector Modal/Popup for first-time visitors
 */
export function CitySelectionModal({isOpen, onClose}) {
  const {selectedCity, setCity, supportedCities} = useCity();

  const handleCitySelect = async (cityValue) => {
    await setCity(cityValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="city-modal-overlay" onClick={onClose}>
      <div 
        className="city-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-modal-title"
      >
        <h2 id="city-modal-title" className="city-modal__title">
          Select Your City
        </h2>
        <p className="city-modal__description">
          Choose your city to see accurate pricing and delivery options
        </p>
        <div className="city-modal__grid">
          {supportedCities.map((city) => (
            <button
              key={city.value}
              type="button"
              className={`city-modal__option ${
                selectedCity === city.value ? 'city-modal__option--selected' : ''
              }`}
              onClick={() => handleCitySelect(city.value)}
            >
              <MapPin size={18} />
              <span>{city.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="city-modal__close"
          onClick={onClose}
          aria-label="Close city selection"
        >
          Continue with {supportedCities.find(c => c.value === selectedCity)?.label}
        </button>
      </div>
    </div>
  );
}
