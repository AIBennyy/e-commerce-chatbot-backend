# E-Commerce Chatbot - Vercel Deployment Configuration

This file contains the necessary configuration for deploying the e-commerce chatbot frontend to Vercel.

## Environment Variables

Set the following environment variables in your Vercel project settings:

```
NEXT_PUBLIC_API_URL=https://e-commerce-chatbot-api-c98f6282375a.herokuapp.com
NEXT_PUBLIC_DASHBOARD_URL=https://e-commerce-chatbot-api-c98f6282375a.herokuapp.com/dashboard
```

## Build Settings

Configure the following build settings in your Vercel project:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Deployment Hooks

To enable automatic deployments when the backend is updated, create a deployment hook in Vercel and add it to your Heroku app as a post-deploy hook:

1. In Vercel, go to your project settings > Git > Deploy Hooks
2. Create a new hook named "Heroku Backend Update"
3. Copy the generated URL
4. In Heroku, add a post-deploy hook:
   ```
   heroku addons:create deployhooks:http --url=YOUR_VERCEL_HOOK_URL -a your-app-name
   ```

## Routing Configuration

Create a `vercel.json` file in your project root with the following content:

```json
{
  "routes": [
    { "src": "/dashboard", "dest": "https://e-commerce-chatbot-api-c98f6282375a.herokuapp.com/dashboard" },
    { "src": "/dashboard/(.*)", "dest": "https://e-commerce-chatbot-api-c98f6282375a.herokuapp.com/dashboard/$1" },
    { "src": "/api/(.*)", "dest": "https://e-commerce-chatbot-api-c98f6282375a.herokuapp.com/api/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

This configuration will:
- Proxy dashboard requests to the backend
- Proxy API requests to the backend
- Serve all other requests from the frontend

## Performance Optimizations

To optimize the frontend performance:

1. Enable Vercel Edge Network caching for static assets
2. Configure Incremental Static Regeneration (ISR) for pages that don't change frequently
3. Use Vercel's Image Optimization for images
4. Enable Vercel Analytics to monitor performance

## Monitoring and Logging

Enable the following Vercel integrations:

- Vercel Analytics
- Sentry (for error tracking)
- LogDNA (for log management)

## Instructions

1. Connect your GitHub repository to Vercel
2. Configure the environment variables
3. Set up the build settings
4. Add the `vercel.json` file to your repository
5. Deploy the project
6. Set up monitoring and logging integrations
7. Configure deployment hooks for automatic updates
