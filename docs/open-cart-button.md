# Open Cart Button Feature

This document provides information about the "Open my cart" button feature that allows users to open their shopping cart in the corresponding e-commerce platform.

## Overview

The "Open my cart" button feature enhances the e-commerce chatbot by providing a direct link to the user's shopping cart on the respective platform (Motonet, S-ryhmä, or Gigantti). This allows users to:

1. Verify that items have been successfully added to their cart
2. Continue with the checkout process manually
3. Make additional modifications to their cart if needed

## Implementation Details

### Backend Components

The feature is implemented with the following components:

1. **Base Adapter Enhancement**: The `BaseECommerceAdapter` class has been extended with:
   - A `cartPath` property to store the platform-specific cart path
   - A `getCartUrl()` method that returns the full URL to the shopping cart

2. **Platform-Specific Adapters**: Each platform adapter has been updated with its specific cart path:
   - Motonet: `/fi/ostoskori`
   - S-ryhmä: `/cart`
   - Gigantti: `/cart`

3. **API Endpoint**: A new endpoint has been added at `/api/cart/url` that:
   - Accepts a `platform` query parameter
   - Returns the cart URL for the specified platform
   - Maintains session cookies for authentication

### Frontend Component

A React component `OpenCartButton` has been created that:
- Displays only when there are items in the cart
- Calls the backend API to get the cart URL
- Opens the cart URL in a new browser window
- Provides appropriate loading and error states

## Usage

The "Open my cart" button appears in the shopping cart section of the UI after items have been added to the cart. When clicked, it opens the corresponding e-commerce platform's cart page in a new browser tab, allowing the user to continue with the checkout process manually.

## Integration Instructions

To integrate this feature into the frontend application:

1. Copy the `OpenCartButton.jsx` component to your components directory
2. Import and add the component to your shopping cart section
3. Pass the current platform and cart status as props

Example:
```jsx
import OpenCartButton from './components/OpenCartButton';

function ShoppingCart({ items, platform }) {
  const hasItems = items && items.length > 0;
  
  return (
    <div className="shopping-cart">
      {/* Cart items display */}
      {hasItems && (
        <OpenCartButton 
          platform={platform} 
          hasItems={hasItems} 
        />
      )}
    </div>
  );
}
```

## Testing

The feature has been tested with all supported platforms:
- Motonet: https://www.motonet.fi/fi/ostoskori
- S-ryhmä: https://www.s-kaupat.fi/cart
- Gigantti: https://www.gigantti.fi/cart

All tests confirm that the cart URLs are generated correctly and maintain the user's session.
