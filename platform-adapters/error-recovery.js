/**
 * Error Recovery Module
 * Provides error recovery mechanisms for platform adapters
 */

// Basic error recovery strategies
const errorRecoveryStrategies = {
  // Authentication errors
  authenticationError: async (error, adapter) => {
    console.log(`Attempting to recover from authentication error for ${adapter.platformId}`);
    // Refresh cookies and retry
    await adapter.getCookies();
    return true; // Indicate recovery was attempted
  },
  
  // Rate limiting errors
  rateLimitError: async (error, adapter) => {
    console.log(`Handling rate limit error for ${adapter.platformId}`);
    // Implement exponential backoff
    const delay = Math.floor(Math.random() * 3000) + 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  },
  
  // Network errors
  networkError: async (error, adapter) => {
    console.log(`Recovering from network error for ${adapter.platformId}`);
    // Simple retry after delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  },
  
  // Default fallback
  defaultRecovery: async (error, adapter) => {
    console.log(`Using default recovery for ${adapter.platformId}`);
    return false; // Indicate no recovery was possible
  }
};

module.exports = {
  // Detect error type and apply appropriate recovery strategy
  recoverFromError: async (error, adapter) => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('login')) {
      return await errorRecoveryStrategies.authenticationError(error, adapter);
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return await errorRecoveryStrategies.rateLimitError(error, adapter);
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return await errorRecoveryStrategies.networkError(error, adapter);
    }
    
    // Default fallback
    return await errorRecoveryStrategies.defaultRecovery(error, adapter);
  }
};
