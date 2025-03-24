/**
 * Main entry point for the platform adapters module
 * Exports the adapter factory and platform-specific adapters
 */
const BaseECommerceAdapter = require('./base-adapter');
const MotonetAdapter = require('./adapters/motonet-adapter');
const ECommerceAdapterFactory = require('./adapter-factory');
const { enhanceAdapterFactoryWithErrorRecovery } = require('./error-recovery-integration');

/**
 * Create a new adapter factory instance with error recovery capabilities
 * @param {Object} cookieManager - Cookie management system instance
 * @returns {ECommerceAdapterFactory} - Enhanced adapter factory instance
 */
function createAdapterFactory(cookieManager) {
  const adapterFactory = new ECommerceAdapterFactory(cookieManager);
  return enhanceAdapterFactoryWithErrorRecovery(adapterFactory);
}

module.exports = {
  BaseECommerceAdapter,
  MotonetAdapter,
  ECommerceAdapterFactory,
  createAdapterFactory
};
