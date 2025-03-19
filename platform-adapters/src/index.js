/**
 * Main entry point for the platform adapters module
 * Exports the adapter factory and platform-specific adapters
 */
const BaseECommerceAdapter = require('./base-adapter');
const MotonetAdapter = require('./adapters/motonet-adapter');
const ECommerceAdapterFactory = require('./adapter-factory');

/**
 * Create a new adapter factory instance
 * @param {Object} cookieManager - Cookie management system instance
 * @returns {ECommerceAdapterFactory} - Adapter factory instance
 */
function createAdapterFactory(cookieManager) {
  return new ECommerceAdapterFactory(cookieManager);
}

module.exports = {
  BaseECommerceAdapter,
  MotonetAdapter,
  ECommerceAdapterFactory,
  createAdapterFactory
};
