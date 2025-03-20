// Import the dashboard API module
const dashboardApi = require('./dashboard-api');

// Add the dashboard API routes
app.use('/api/dashboard', dashboardApi.router);

// Middleware to log API operations
app.use((req, res, next) => {
  const originalSend = res.send;
  const start = Date.now();
  
  res.send = function(data) {
    const responseTime = Date.now() - start;
    const platform = req.body?.platform || currentPlatform;
    const operation = req.path;
    
    if (res.statusCode >= 400) {
      dashboardApi.logError(platform, operation, `HTTP ${res.statusCode}: ${data}`);
    } else {
      dashboardApi.logSuccess(platform, operation, responseTime);
    }
    
    return originalSend.apply(res, arguments);
  };
  
  next();
});
