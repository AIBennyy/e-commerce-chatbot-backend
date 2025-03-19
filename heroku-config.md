# Backend Configuration for Heroku Deployment

This document provides instructions for configuring and deploying the backend proxy server to Heroku.

## Prerequisites

1. Create a Heroku account at [heroku.com](https://heroku.com) if you don't already have one
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) (optional, for local testing)
3. Extract cookies from the e-commerce websites (Motonet and/or Rusta)

## Configuration Steps

### 1. Create a new Heroku app

```bash
# Login to Heroku
heroku login

# Create a new app
heroku create e-commerce-chatbot-api

# Or if you want a random name assigned by Heroku
heroku create
```

### 2. Configure environment variables

Set up the required environment variables in the Heroku dashboard or using the CLI:

```bash
# Set the allowed origins for CORS
heroku config:set ALLOWED_ORIGINS=https://e-commerce-chatbot-demo.vercel.app

# Set the Motonet configuration
heroku config:set MOTONET_URL=https://www.motonet.fi
heroku config:set MOTONET_API_CART_ADD=/api/cart/add
heroku config:set MOTONET_COOKIE="your_cookie_string_here"

# Set the Rusta configuration
heroku config:set RUSTA_URL=https://www.rusta.com/fi
heroku config:set RUSTA_API_CART_ADD=/api/cart/add
heroku config:set RUSTA_COOKIE="your_cookie_string_here"

# Set Node environment
heroku config:set NODE_ENV=production
```

### 3. Deploy to Heroku

There are multiple ways to deploy to Heroku:

#### Option 1: Deploy using Git

```bash
# Initialize Git repository (if not already done)
cd /path/to/backend
git init

# Add Heroku remote
heroku git:remote -a your-app-name

# Add files
git add .
git commit -m "Initial deployment"

# Push to Heroku
git push heroku master
```

#### Option 2: Deploy using Heroku CLI

```bash
# From the backend directory
heroku deploy
```

#### Option 3: Connect to GitHub repository

1. In the Heroku dashboard, go to your app
2. Go to the "Deploy" tab
3. Select "GitHub" as the deployment method
4. Connect to your GitHub repository
5. Enable automatic deploys from the main branch

### 4. Verify deployment

After deployment, verify that your app is running:

```bash
# Open the app in your browser
heroku open

# Check the logs
heroku logs --tail
```

Visit the `/health` endpoint to verify that the API is working correctly:
```
https://your-app-name.herokuapp.com/health
```

## Updating Cookies

E-commerce website cookies expire periodically. To update them:

1. Extract fresh cookies from your browser
2. Update the environment variables in Heroku:

```bash
heroku config:set MOTONET_COOKIE="your_new_cookie_string_here"
heroku config:set RUSTA_COOKIE="your_new_cookie_string_here"
```

## Troubleshooting

### App crashes on startup

Check the logs for errors:
```bash
heroku logs --tail
```

Common issues:
- Missing required environment variables
- Syntax errors in the code
- Dependency issues

### 503 Service Unavailable errors

If the API returns 503 errors when trying to add items to cart:
- Cookies might be expired - extract fresh ones
- The e-commerce website API might have changed - check the network requests in your browser

### Cold start delays

Free tier Heroku apps "sleep" after 30 minutes of inactivity. To minimize this:
- Set up a service like UptimeRobot to ping your app every 25 minutes
- Upgrade to a paid Heroku plan
