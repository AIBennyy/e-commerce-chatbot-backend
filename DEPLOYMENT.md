# Deployment Instructions for E-Commerce Chatbot

This document provides detailed instructions for deploying the enhanced e-commerce chatbot system with the newly implemented features: GitHub Actions workflows, multi-platform cookie management, and comprehensive error recovery mechanisms.

## Heroku Deployment

### Initial Setup

1. **Create a Heroku account** if you don't already have one at [heroku.com](https://heroku.com)

2. **Install the Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**:
   ```bash
   heroku login
   ```

4. **Create a new Heroku app** (or use an existing one):
   ```bash
   heroku create e-commerce-chatbot-api
   ```

### Environment Variables Configuration

Set the following environment variables in your Heroku app:

#### Core Configuration
```bash
heroku config:set NODE_ENV=production
heroku config:set ENCRYPTION_KEY=your_secure_random_string
```

#### Cookie Management
```bash
# Initial cookies (will be managed automatically after setup)
heroku config:set MOTONET_COOKIE=your_initial_motonet_cookie
heroku config:set SRYHMA_COOKIE=your_initial_sryhma_cookie
heroku config:set GIGANTTI_COOKIE=your_initial_gigantti_cookie

# Cookie refresh settings
heroku config:set REFRESH_INTERVAL="0 */12 * * *"
heroku config:set MOTONET_COOKIE_MAX_AGE=86400000
heroku config:set SRYHMA_COOKIE_MAX_AGE=86400000
heroku config:set GIGANTTI_COOKIE_MAX_AGE=86400000
```

#### Authentication (Required for S-ryhmä)
```bash
heroku config:set SRYHMA_USERNAME=your_sryhma_username
heroku config:set SRYHMA_PASSWORD=your_sryhma_password

# Optional for other platforms
heroku config:set MOTONET_USERNAME=your_motonet_username
heroku config:set MOTONET_PASSWORD=your_motonet_password
heroku config:set GIGANTTI_USERNAME=your_gigantti_username
heroku config:set GIGANTTI_PASSWORD=your_gigantti_password
```

#### Error Recovery
```bash
heroku config:set MAX_RETRIES=3
heroku config:set BASE_RETRY_DELAY=1000
heroku config:set MAX_RETRY_DELAY=60000
heroku config:set LOG_LEVEL=info
```

### Deployment

1. **Deploy the application to Heroku**:
   ```bash
   git push heroku main
   ```

2. **Ensure at least one dyno is running**:
   ```bash
   heroku ps:scale web=1
   ```

3. **Open the application**:
   ```bash
   heroku open
   ```

## GitHub Actions Setup

To enable the CI/CD and cookie refresh workflows:

1. **Go to your GitHub repository settings**

2. **Navigate to Secrets and Variables > Actions**

3. **Add the following repository secrets**:
   - `HEROKU_API_KEY`: Your Heroku API key (find in your Heroku account settings)
   - `HEROKU_EMAIL`: Your Heroku email address
   - `HEROKU_PRODUCTION_APP_NAME`: Your Heroku production app name (e.g., e-commerce-chatbot-api)
   - `HEROKU_STAGING_APP_NAME`: Your Heroku staging app name (e.g., e-commerce-chatbot-api-staging)
   - `ENCRYPTION_KEY`: The same secure random string used in Heroku config

4. **The workflows will automatically run**:
   - CI workflow: On every push and pull request
   - Deployment workflows: When pushing to develop (staging) or main (production)
   - Cookie refresh workflow: Every 12 hours and can be manually triggered

## Frontend Deployment (Vercel)

The frontend is deployed on Vercel:

1. **Fork or clone the frontend repository**

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```

5. **Set environment variables in Vercel**:
   - `NEXT_PUBLIC_API_URL`: Your Heroku backend URL (e.g., https://e-commerce-chatbot-api.herokuapp.com)

## Monitoring and Maintenance

### Dashboard Access

Access the monitoring dashboard at:
```
https://your-heroku-app-name.herokuapp.com/dashboard
```

### Manual Cookie Refresh

If you need to manually refresh cookies:

1. **Through the dashboard**:
   - Navigate to the dashboard
   - Go to the Cookie Management section
   - Click "Refresh Cookies"

2. **Through the GitHub Actions**:
   - Go to the Actions tab in your GitHub repository
   - Select the "Refresh Cookies" workflow
   - Click "Run workflow"

3. **Through the API**:
   ```bash
   curl -X POST https://your-heroku-app-name.herokuapp.com/api/dashboard/cookies/refresh
   ```

### Logs

View application logs:
```bash
heroku logs --tail
```

## Troubleshooting

### Common Issues

1. **Cookie Refresh Failures**:
   - Check if login credentials are correct
   - Verify that the website structure hasn't changed
   - Check Puppeteer dependencies on Heroku

2. **API Connection Issues**:
   - Verify that cookies are valid
   - Check rate limiting on the e-commerce platforms
   - Ensure error recovery is properly configured

3. **Deployment Failures**:
   - Check Heroku build logs
   - Verify GitHub Actions secrets are correctly set
   - Ensure all dependencies are properly listed in package.json

### Support

For additional support, please open an issue in the GitHub repository or contact the development team.
