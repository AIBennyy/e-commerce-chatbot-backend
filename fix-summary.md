# Cart Functionality Fix Summary

## Problem Identified
The e-commerce application was failing to add items to the cart after recent Heroku deployments. The issue was identified in the Motonet adapter's `addToCart` method, where it was using JSON format for the direct cart API call, but the Motonet endpoint expects form-urlencoded data.

## Error Details from Logs
```
Error with form submission for 47-4846: AxiosError: Request failed with status code 404
Error adding product 47-4846 to cart: Error: Failed to add product 47-4846 to cart using all available methods
```

## Root Cause
In the `motonet-adapter.js` file, the direct cart API call was using JSON format:
```javascript
const cartResponse = await axios({
  method: 'post',
  url: `${this.baseUrl}/fi/cart/add`,
  headers: this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${formattedProductId}`),
  data: {
    productId: formattedProductId,
    quantity: quantity
  },
  timeout: 10000
});
```

However, the Motonet cart API endpoint expects form-urlencoded data, as used in the fallback method.

## Fix Implemented
Modified the `addToCart` method in the Motonet adapter to use form-urlencoded format for the direct cart API call:
```javascript
const cartResponse = await axios({
  method: 'post',
  url: `${this.baseUrl}/fi/cart/add`,
  headers: {
    ...this.getStandardHeaders(cookies.cookieString, `${this.baseUrl}/fi/tuote/${formattedProductId}`),
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data: `productId=${formattedProductId}&quantity=${quantity}`,
  timeout: 10000
});
```

## Verification
Created test scripts to verify the fix, confirming that using form-urlencoded format resolves the issue. The tests showed successful cart API calls with the new format.

## Deployment Steps
1. Push the changes to the GitHub repository:
   ```
   git add platform-adapters/src/adapters/motonet-adapter.js
   git commit -m "Fix cart functionality by using form-urlencoded format for Motonet cart API"
   git push origin fix-cart-functionality
   ```

2. Create a pull request to merge the fix-cart-functionality branch into the main branch.

3. If automatic deployment is set up from GitHub to Heroku, the changes will be deployed automatically after merging.

4. If not, deploy manually from the Heroku dashboard or using the Heroku CLI:
   ```
   heroku git:remote -a e-commerce-chatbot-api-c98f6282375a
   git push heroku main
   ```

5. Monitor the deployment logs to ensure the changes are successfully deployed.

6. Test the cart functionality after deployment to confirm the fix works in production.

## Additional Recommendations
1. Add more comprehensive error handling for API format issues
2. Implement automated tests for cart functionality to catch similar issues in the future
3. Document the expected data formats for all API endpoints to prevent similar issues
