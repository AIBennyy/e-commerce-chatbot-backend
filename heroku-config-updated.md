# Heroku Deployment Configuration
# This file contains the necessary configuration for deploying the e-commerce chatbot to Heroku

# Node.js buildpack configuration
node_version=20.x
npm_version=10.x

# Environment variables required for deployment
ENCRYPTION_KEY=<secure random string for encrypting stored cookies>
MOTONET_COOKIE=<fresh cookies from your browser (will be managed automatically after setup)>
SRYHMA_COOKIE=<fresh cookies from your browser (will be managed automatically after setup)>
GIGANTTI_COOKIE=<fresh cookies from your browser (will be managed automatically after setup)>
REFRESH_INTERVAL=0 */12 * * * # Cron expression for cookie refresh (every 12 hours)
MOTONET_COOKIE_MAX_AGE=86400000 # Cookie expiration time in milliseconds (24 hours)
SRYHMA_COOKIE_MAX_AGE=86400000 # Cookie expiration time in milliseconds (24 hours)
GIGANTTI_COOKIE_MAX_AGE=86400000 # Cookie expiration time in milliseconds (24 hours)
LOG_LEVEL=info # Logging level (debug, info, warn, error)
ALLOWED_ORIGINS=https://e-commerce-chatbot-frontend.vercel.app # Comma-separated list of allowed origins for CORS

# Heroku-specific configuration
WEB_CONCURRENCY=2 # Number of worker processes
WEB_MEMORY=512 # Memory limit per worker in MB

# Redis configuration (for session storage and caching)
# Uncomment and set these if using Redis add-on
# REDIS_URL=<redis connection string>
# SESSION_SECRET=<secure random string for session encryption>

# Database configuration (for persistent storage)
# Uncomment and set these if using database add-on
# DATABASE_URL=<database connection string>

# Monitoring and logging configuration
# Uncomment and set these if using monitoring add-ons
# SENTRY_DSN=<sentry connection string>
# NEW_RELIC_LICENSE_KEY=<new relic license key>

# Instructions:
# 1. Copy this file to .env for local development
# 2. Set the environment variables in Heroku dashboard or using Heroku CLI:
#    heroku config:set ENCRYPTION_KEY=your_secure_key -a your-app-name
# 3. Make sure to set fresh cookies for each platform before deployment
# 4. The system will automatically refresh cookies based on the REFRESH_INTERVAL
