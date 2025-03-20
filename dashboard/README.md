# E-Commerce Chatbot Dashboard

This dashboard provides monitoring, configuration, and analytics capabilities for the E-Commerce Chatbot system.

## Features

- **System Monitoring**: Real-time status of all platform connections, cookie health, and error logs
- **Configuration Interface**: Platform settings management and cookie refresh configuration
- **Analytics**: Usage statistics and performance metrics

## Implementation Structure

The dashboard is implemented as a React application within the existing repository:

```
dashboard/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── monitoring/  # System monitoring components
│   │   ├── config/      # Configuration interface components
│   │   └── analytics/   # Analytics components
│   ├── services/        # API services
│   ├── App.js           # Main application component
│   └── index.js         # Entry point
└── package.json         # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Navigate to the dashboard directory:
   ```
   cd dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Building for Production

To build the dashboard for production:

```
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Integration with Backend

The dashboard communicates with the backend through API endpoints defined in `server.js`. These endpoints provide:

- System status information
- Platform connection status
- Cookie health metrics
- Configuration management
- Usage statistics

## Development Roadmap

1. **Phase 1**: System Monitoring
   - Platform connection status
   - Cookie health tracking
   - Error logs

2. **Phase 2**: Configuration Interface
   - Platform settings
   - Cookie refresh settings
   - System parameters

3. **Phase 3**: Analytics
   - Usage statistics
   - Performance metrics
   - Trend analysis
