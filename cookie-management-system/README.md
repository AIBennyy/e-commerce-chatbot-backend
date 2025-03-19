# Automated Cookie Management System

A robust system for automatically managing cookies across multiple e-commerce platforms, eliminating the need for manual cookie updates.

## Features

- **Automated Cookie Extraction**: Uses headless browser automation to extract cookies from e-commerce websites
- **Secure Storage**: Encrypts and stores cookies in a local database
- **Scheduled Refreshes**: Automatically refreshes cookies before they expire
- **Multi-Platform Support**: Designed to work with Motonet, S-ryhmä, Gigantti, and more
- **REST API**: Provides API endpoints for cookie management
- **Error Handling**: Includes retry logic and comprehensive error handling
- **Logging**: Detailed logging for monitoring and troubleshooting

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Edit the `config.js` file to configure platforms, scheduling, and other settings. Alternatively, use environment variables:

```bash
# Create a .env file
cp .env.example .env
# Edit the .env file with your settings
```

## Usage

```bash
# Start the cookie management system
node index.js
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/cookies/:platform` - Get cookies for a specific platform
- `POST /api/cookies/:platform/refresh` - Manually trigger cookie refresh
- `GET /api/status` - Get status of all platforms

## Integration

See [INTEGRATION.md](./INTEGRATION.md) for detailed instructions on integrating with your e-commerce chatbot.

## Adding New Platforms

To add support for a new e-commerce platform:

1. Update the config.js file with the new platform configuration
2. Implement platform-specific login and cookie extraction logic in cookie-extractor.js
3. Restart the cookie management system

## Development

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## License

MIT
