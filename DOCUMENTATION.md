# E-Commerce Chatbot Enhanced Documentation

## Overview
This document provides comprehensive documentation for the enhanced e-commerce chatbot system, including the newly implemented features: GitHub Actions workflows, cookie management for multiple platforms, and comprehensive error recovery mechanisms.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Platform Adapters](#platform-adapters)
3. [Cookie Management System](#cookie-management-system)
4. [Error Recovery System](#error-recovery-system)
5. [CI/CD Workflows](#cicd-workflows)
6. [Deployment Instructions](#deployment-instructions)
7. [Environment Variables](#environment-variables)
8. [Monitoring and Dashboard](#monitoring-and-dashboard)

## System Architecture
The e-commerce chatbot uses a modular architecture with these key components:

- **Cookie Management System**: Automatically extracts and refreshes cookies for each platform
- **Platform Adapters**: Modular components for each e-commerce platform (Motonet, S-ryhmä, Gigantti)
- **Error Recovery System**: Automatically detects and recovers from common errors
- **Monitoring System**: Tracks system health and provides status information
- **Dashboard**: Web-based interface for monitoring and configuration

The system is designed to operate autonomously with minimal technical input and allows for easy addition of new platforms through its modular architecture.

## Platform Adapters
The platform adapters provide a unified interface for interacting with different e-commerce platforms. Each adapter implements the following methods:

- `searchProducts(query, options)`: Search for products on the platform
- `getProductDetails(productId)`: Get detailed information about a specific product
- `addToCart(productId, quantity)`: Add a product to the shopping cart
- `getCart()`: Get the current contents of the shopping cart
- `updateCartItem(itemId, quantity)`: Update the quantity of an item in the cart
- `removeCartItem(itemId)`: Remove an item from the cart

### Supported Platforms
- **Motonet**: Automotive parts and accessories
- **S-ryhmä**: Grocery and general merchandise
- **Gigantti**: Electronics and appliances

### Adding a New Platform
To add a new platform adapter:

1. Create a new adapter class that extends `BaseECommerceAdapter`
2. Implement all required methods for the platform
3. Add the platform to the `ECommerceAdapterFactory`
4. Update the cookie management system configuration for the new platform

## Cookie Management System
The cookie management system handles authentication and session management for all supported platforms. It automatically extracts and refreshes cookies to maintain persistent connections with e-commerce websites.

### Key Components
- **Cookie Extractor**: Uses Puppeteer to extract cookies from e-commerce websites
- **Cookie Storage**: Securely stores cookies with encryption
- **Cookie Refresh**: Automatically refreshes cookies before they expire
- **Platform-Specific Handlers**: Custom logic for each platform's authentication flow

### Platform-Specific Cookie Management
Each platform has specific cookie requirements and authentication flows:

#### Motonet
- Essential cookies: `cartId`, `puid`, `first_session`
- No login required for basic functionality

#### S-ryhmä
- Essential cookies: `JSESSIONID`, `AWSALB`, `AWSALBCORS`, `s_kaupat_session`, `selectedStore`, `selectedStoreId`, `cartId`, `customerId`, `customerToken`, `sessionId`, `_ga`, `_gid`, `OptanonConsent`
- Login required for full functionality

#### Gigantti
- Essential cookies: `JSESSIONID`, `ASP.NET_SessionId`, `cart-id`, `customer-id`, `gigantti_session`, `gigantti_cart`, `gigantti_user`, `gigantti_auth`, `BVBRANDID`, `BVBRANDSID`, `_ga`, `_gid`, `coi_status`, `dwanonymous_*`, `dwsecuretoken_*`, `dwsid`, `__cq_dnt`, `dw_*`
- Login optional for basic functionality

### Cookie Refresh Process
The cookie refresh process is automated through a GitHub Actions workflow that runs on a schedule. The process:

1. Launches a headless browser for each platform
2. Navigates to the platform website
3. Handles cookie consent dialogs
4. Performs login if required
5. Performs additional actions to ensure all necessary cookies are set
6. Extracts and filters essential cookies
7. Updates the Heroku environment variables with the new cookies

## Error Recovery System
The error recovery system provides automatic detection and recovery from common errors that may occur when interacting with e-commerce platforms.

### Error Types Handled
- **Authentication Errors**: Automatically refreshes cookies and retries the operation
- **Rate Limiting Errors**: Implements exponential backoff with jitter and respects platform-specific retry headers
- **Server Errors**: Implements exponential backoff and retries the operation
- **Network Errors**: Implements exponential backoff and retries the operation

### Error Recovery Process
When an error occurs:

1. The error is logged with detailed context
2. The error type is determined based on error properties and platform
3. The appropriate recovery strategy is applied
4. The operation is retried with exponential backoff
5. If the maximum number of retries is exceeded, the error is propagated

### Integration with Platform Adapters
The error recovery system is integrated with platform adapters through a higher-order function that wraps adapter methods with error recovery capabilities. This ensures that all platform operations automatically benefit from error recovery without modifying the adapter code.

## CI/CD Workflows
The system uses GitHub Actions for continuous integration and deployment, ensuring code quality and streamlining the deployment process.

### CI Workflow
The CI workflow runs on every push and pull request to the main and develop branches:

- Runs on multiple Node.js versions (16.x, 18.x, 20.x)
- Installs dependencies
- Runs linting
- Runs tests
- Generates coverage reports

### Deployment Workflows
Two deployment workflows are implemented:

#### Staging Deployment
- Triggers on push to the develop branch
- Runs tests
- Deploys to Heroku staging environment
- Performs health check
- Rolls back on failure

#### Production Deployment
- Triggers on push to the main branch
- Runs tests
- Deploys to Heroku production environment
- Performs health check
- Rolls back on failure

### Cookie Refresh Workflow
The cookie refresh workflow runs on a schedule (every 12 hours) and can also be triggered manually:

- Installs dependencies and Puppeteer
- Runs the cookie refresh script
- Updates Heroku environment variables with new cookies

## Deployment Instructions
Follow these steps to deploy the e-commerce chatbot:

### Prerequisites
- Heroku account
- GitHub account
- Node.js and npm installed locally

### Initial Setup
1. Clone the repository:
   ```
   git clone https://github.com/AIBennyy/e-commerce-chatbot-backend.git
   cd e-commerce-chatbot-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a Heroku app:
   ```
   heroku create e-commerce-chatbot-api
   ```

4. Set up environment variables (see [Environment Variables](#environment-variables) section)

5. Deploy to Heroku:
   ```
   git push heroku main
   ```

### CI/CD Setup
To enable the GitHub Actions workflows:

1. Go to your GitHub repository settings
2. Navigate to Secrets and Variables > Actions
3. Add the following secrets:
   - `HEROKU_API_KEY`: Your Heroku API key
   - `HEROKU_EMAIL`: Your Heroku email
   - `HEROKU_STAGING_APP_NAME`: Your Heroku staging app name
   - `HEROKU_PRODUCTION_APP_NAME`: Your Heroku production app name
   - `ENCRYPTION_KEY`: A secure random string for encrypting cookies

### Manual Deployment
If you prefer to deploy manually:

1. Build the application:
   ```
   npm run build
   ```

2. Start the server:
   ```
   npm start
   ```

## Environment Variables
The following environment variables are required for deployment:

### Core Configuration
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development, staging, production)
- `ENCRYPTION_KEY`: Key for encrypting stored cookies

### Cookie Management
- `MOTONET_COOKIE`: Motonet cookies (will be managed automatically after setup)
- `SRYHMA_COOKIE`: S-ryhmä cookies (will be managed automatically after setup)
- `GIGANTTI_COOKIE`: Gigantti cookies (will be managed automatically after setup)
- `REFRESH_INTERVAL`: Cron expression for cookie refresh (e.g., "0 */12 * * *" for every 12 hours)
- `MOTONET_COOKIE_MAX_AGE`: Cookie expiration time in milliseconds (e.g., 86400000 for 24 hours)
- `SRYHMA_COOKIE_MAX_AGE`: Cookie expiration time for S-ryhmä
- `GIGANTTI_COOKIE_MAX_AGE`: Cookie expiration time for Gigantti

### Authentication (Optional)
- `MOTONET_USERNAME`: Motonet username (if login required)
- `MOTONET_PASSWORD`: Motonet password (if login required)
- `SRYHMA_USERNAME`: S-ryhmä username
- `SRYHMA_PASSWORD`: S-ryhmä password
- `GIGANTTI_USERNAME`: Gigantti username (optional)
- `GIGANTTI_PASSWORD`: Gigantti password (optional)

### Error Recovery
- `MAX_RETRIES`: Maximum retry attempts (default: 3)
- `BASE_RETRY_DELAY`: Base delay for exponential backoff in milliseconds (default: 1000)
- `MAX_RETRY_DELAY`: Maximum delay for exponential backoff in milliseconds (default: 60000)
- `LOG_LEVEL`: Logging level (default: info)

## Monitoring and Dashboard
The system includes a web-based dashboard for monitoring and configuration, accessible at the `/dashboard` endpoint.

### Dashboard Features
- **System Status**: Overall system health and platform connection status
- **Cookie Health**: Cookie status and expiration times for each platform
- **Error Logs**: Recent errors and their details
- **Configuration**: System configuration settings
- **Analytics**: Usage statistics and performance metrics

### API Endpoints
The dashboard is powered by the following API endpoints:

- `GET /api/dashboard/status`: Platform connection status
- `GET /api/dashboard/cookies`: Cookie health and expiration
- `GET /api/dashboard/errors`: Error logs
- `GET /api/dashboard/config`: System configuration
- `GET /api/dashboard/stats`: Usage statistics
- `GET /api/dashboard/metrics`: Performance metrics
- `POST /api/dashboard/cookies/refresh`: Trigger cookie refresh
