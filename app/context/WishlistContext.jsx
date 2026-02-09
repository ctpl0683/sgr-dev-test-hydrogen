/**
 * Wishlist Context
 * Provides global wishlist state management for the Hydrogen storefront
 */

import {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {
  fetchWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  isInWishlist as checkIsInWishlist,
} from '~/lib/wishlist';

const WishlistContext = createContext(null);

/**
 * Default context value for when used outside provider or for logged-out users
 */
const defaultContextValue = {
  wishlist: [],
  isLoading: false,
  error: null,
  isLoggedIn: false,
  customerId: null,
  isInWishlist: () => false,
  addToWishlist: async () => ({success: false, error: 'Not logged in'}),
  removeFromWishlist: async () => ({success: false, error: 'Not logged in'}),
  toggleWishlist: async () => ({success: false, error: 'Not logged in'}),
  refreshWishlist: async () => {},
};

/**
 * Wishlist Provider Component
 * Wrap your app with this to enable wishlist functionality
 * 
 * @param {{children: React.ReactNode, customerId?: string}} props
 */
export function WishlistProvider({children, customerId}) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLoggedIn = Boolean(customerId);

  /**
   * Refresh wishlist from the API
   */
  const refreshWishlist = useCallback(async () => {
    if (!customerId) {
      setWishlist([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const wishlistData = await fetchWishlist(customerId);
      setWishlist(wishlistData);
    } catch (err) {
      console.error('Error refreshing wishlist:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  /**
   * Check if a product is in the wishlist
   */
  const isInWishlist = useCallback(
    (productId) => {
      return checkIsInWishlist(wishlist, productId);
    },
    [wishlist]
  );

  /**
   * Add a product to the wishlist
   */
  const addToWishlist = useCallback(
    async (productId) => {
      if (!customerId) {
        return {success: false, error: 'Not logged in'};
      }

      // Optimistic update
      setWishlist((prev) => {
        if (prev.includes(productId)) return prev;
        return [...prev, productId];
      });

      try {
        const result = await apiAddToWishlist(customerId, productId);
        
        if (result.success && result.wishlist) {
          setWishlist(result.wishlist);
        } else if (!result.success) {
          // Revert optimistic update on failure
          setWishlist((prev) => prev.filter((id) => id !== productId));
          setError(result.error);
        }
        
        return result;
      } catch (err) {
        // Revert optimistic update on error
        setWishlist((prev) => prev.filter((id) => id !== productId));
        setError(err.message);
        return {success: false, error: err.message};
      }
    },
    [customerId]
  );

  /**
   * Remove a product from the wishlist
   */
  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!customerId) {
        return {success: false, error: 'Not logged in'};
      }

      // Store current state for potential revert
      const previousWishlist = [...wishlist];

      // Optimistic update
      setWishlist((prev) => prev.filter((id) => id !== productId));

      try {
        const result = await apiRemoveFromWishlist(customerId, productId);
        
        if (result.success && result.wishlist) {
          setWishlist(result.wishlist);
        } else if (!result.success) {
          // Revert optimistic update on failure
          setWishlist(previousWishlist);
          setError(result.error);
        }
        
        return result;
      } catch (err) {
        // Revert optimistic update on error
        setWishlist(previousWishlist);
        setError(err.message);
        return {success: false, error: err.message};
      }
    },
    [customerId, wishlist]
  );

  /**
   * Toggle a product in the wishlist (add if not present, remove if present)
   */
  const toggleWishlist = useCallback(
    async (productId) => {
      if (isInWishlist(productId)) {
        return removeFromWishlist(productId);
      } else {
        return addToWishlist(productId);
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist]
  );

  // Fetch wishlist on mount and when customerId changes
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const contextValue = {
    wishlist,
    isLoading,
    error,
    isLoggedIn,
    customerId,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    refreshWishlist,
    wishlistCount: wishlist.length,
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

/**
 * Hook to access wishlist context
 * Returns default values if used outside provider (for logged-out users)
 */
export function useWishlist() {
  const context = useContext(WishlistContext);
  
  if (!context) {
    // Return default context for logged-out users or when used outside provider
    return defaultContextValue;
  }
  
  return context;
}

export default WishlistContext;
