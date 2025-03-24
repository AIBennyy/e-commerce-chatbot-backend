/**
 * Error Recovery Integration Module
 * Integrates the error recovery system with platform adapters
 */
const errorRecoverySystem = require('../error-recovery');

/**
 * Higher-order function to wrap adapter methods with error recovery
 * @param {Function} method - The adapter method to wrap
 * @param {string} platform - Platform identifier (e.g., 'motonet', 'sryhma', 'gigantti')
 * @param {string} operation - Operation name (e.g., 'searchProducts', 'addToCart')
 * @returns {Function} - Wrapped method with error recovery
 */
function withErrorRecovery(method, platform, operation) {
  return async function(...args) {
    try {
      // Attempt to execute the original method
      return await method.apply(this, args);
    } catch (error) {
      // Handle error with recovery system
      return await errorRecoverySystem.handleError(
        error,
        platform,
        operation,
        // Retry callback
        async () => {
          // Reset any internal state if necessary
          if (this.resetState) {
            this.resetState();
          }
          // Retry the original method
          return await method.apply(this, args);
        }
      );
    }
  };
}

/**
 * Apply error recovery to all methods of an adapter
 * @param {Object} adapter - The platform adapter instance
 * @param {string} platform - Platform identifier
 * @returns {Object} - Enhanced adapter with error recovery
 */
function enhanceAdapterWithErrorRecovery(adapter, platform) {
  // List of methods to enhance with error recovery
  const methodsToEnhance = [
    'searchProducts',
    'getProductDetails',
    'addToCart',
    'getCart',
    'updateCartItem',
    'removeCartItem',
    'checkout',
    'getCategories',
    'getProductsByCategory'
  ];
  
  // Create a new object with the same prototype
  const enhancedAdapter = Object.create(Object.getPrototypeOf(adapter));
  
  // Copy all properties from the original adapter
  Object.getOwnPropertyNames(adapter).forEach(prop => {
    if (prop !== 'constructor') {
      enhancedAdapter[prop] = adapter[prop];
    }
  });
  
  // Enhance methods with error recovery
  methodsToEnhance.forEach(method => {
    if (typeof adapter[method] === 'function') {
      enhancedAdapter[method] = withErrorRecovery(adapter[method], platform, method);
    }
  });
  
  return enhancedAdapter;
}

/**
 * Enhance adapter factory to create error-recovery-enabled adapters
 * @param {Object} adapterFactory - The original adapter factory
 * @returns {Object} - Enhanced adapter factory
 */
function enhanceAdapterFactoryWithErrorRecovery(adapterFactory) {
  // Store the original getAdapter method
  const originalGetAdapter = adapterFactory.getAdapter;
  
  // Override the getAdapter method
  adapterFactory.getAdapter = function(platform) {
    // Get the original adapter
    const originalAdapter = originalGetAdapter.call(this, platform);
    
    // Enhance it with error recovery
    return enhanceAdapterWithErrorRecovery(originalAdapter, platform);
  };
  
  return adapterFactory;
}

module.exports = {
  withErrorRecovery,
  enhanceAdapterWithErrorRecovery,
  enhanceAdapterFactoryWithErrorRecovery
};
