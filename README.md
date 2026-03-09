# AIM Coach Portal UI

React web application for the AIM Coach Portal.

## Features

- Team management dashboard
- Player roster and analytics
- Performance tracking and visualization
- Group oversight
- Challenge creation and monitoring
- Communication tools (messages, announcements, feedback)
- Real-time updates via Socket.io

## Tech Stack

- React 18
- Material-UI (MUI)
- Redux Toolkit + Redux Persist
- React Router v6
- Recharts (data visualization)
- Axios (HTTP client)
- Socket.io Client (real-time)

## Prerequisites

- Node.js 18 or higher
- Access to aim-coach-portal-api backend

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API URL
nano .env
```

## Development

```bash
# Start development server
npm start

# The app will open at http://localhost:3000
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Building

```bash
# Create production build
npm run build

# The build folder will contain optimized static files
```

## Project Structure

```
aim-coach-portal-ui/
├── public/              # Static files
├── src/
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   ├── store/           # Redux store and slices
│   ├── api/             # API client configuration
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Helper functions
│   ├── constants/       # App constants
│   ├── styles/          # Global styles and theme
│   ├── App.js           # Main app component
│   └── index.js         # Entry point
├── build_scripts/       # Jenkins deployment scripts
└── package.json
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run jenkins-artifact` - Create deployment artifact

## Environment Variables

See `.env.example` for required environment variables:

- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.io server URL
- `REACT_APP_ENV` - Environment name

## Deployment

The application is deployed as a static site to AWS S3 + CloudFront or similar hosting.

## License

Proprietary - AIM Application
