# aim-coach-portal-ui

## Service Type
Frontend - React Web Application

## Description
Coach portal web application for team management, player performance tracking, drill uploads, and analytics visualization. This is the primary interface for coaches to manage their clubs, teams, and players.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Build Tool | Craco (Create React App Configuration Override) |
| UI Library | Material-UI (MUI) v6 |
| State Management | Redux Toolkit + Redux Persist |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Real-time | Socket.io Client |
| Charts | Recharts |
| Forms | Formik + Yup |
| Styling | SASS, Emotion |
| Video Processing | FFmpeg (WASM) |

---

## Project Structure

```
src/
├── api/              # API service modules
│   ├── client.js     # Axios instance with interceptors
│   ├── authService.js
│   ├── clubService.js
│   ├── drillService.js
│   ├── playerService.js
│   ├── teamService.js
│   └── socketService.js
├── assets/           # Static assets (images, icons)
├── components/       # Reusable React components
│   ├── club/         # Club-specific components
│   ├── dashboard/    # Dashboard widgets
│   ├── drills/       # Drill-related components
│   ├── forms/        # Form components
│   └── video-splitter/
├── constants/        # Application constants
├── contexts/         # React contexts
├── helpers/          # Helper functions
├── hooks/            # Custom React hooks
├── pages/            # Page components (routes)
│   ├── club/         # Club management pages
│   ├── public/       # Public pages (onboarding, consent)
│   └── superadmin/   # Super admin pages
├── services/         # Business logic services
├── store/            # Redux store configuration
├── styles/           # Global styles
└── utils/            # Utility functions
    └── videoUtils.js # Video/frame utilities with environment detection
```

---

## Environment Variables

### Required Variables
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:4003/restapi/api/v1

# Environment identifiers
REACT_APP_ENV=development          # development | staging | production
REACT_APP_ENVIRONMENT=dev2         # dev1 | dev2 | prod (for frame URLs)

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_GROUPS=true
REACT_APP_ENABLE_CHALLENGES=true
```

### Environment URL Mapping
| REACT_APP_ENVIRONMENT | Frame URL Base |
|----------------------|----------------|
| `prod` | `https://admin-ui.aim-football.com/images/prod/frames/` |
| `dev2` | `https://dev-admin-ui.aim-football.com/images/dev2/frames/` |
| `dev1` | `https://dev-admin-ui.aim-football.com/images/dev1/frames/` |

---

## Key Pages

### Club Management (`/club/*`)
- **ClubDashboard** - Main club overview
- **ClubPlayers** - Player roster management
- **ClubTeams** - Team management
- **DrillUploads** - Bulk video upload with manual annotation
- **DrillsManagement** - Manage uploaded drills
- **BulkManualAnnotationView** - Annotate multiple drills
- **PlayerInvitations** - Invite players to club
- **RecommendationRulesManager** - Training recommendations

### Player Views
- **PlayerDashboard** - Player's personal dashboard
- **PlayerProfile** - Player details and stats
- **PlayerDrills** - Player's drill history
- **DrillDetail** - Individual drill analysis

### Super Admin (`/superadmin/*`)
- **SuperAdminDashboard** - System overview
- **DrillSettingsManager** - Configure drill types
- **UserManager** - User administration

---

## API Services

All API calls go through `src/api/client.js` which:
- Sets base URL from `REACT_APP_API_URL`
- Attaches JWT token to requests
- Handles token refresh on 401 errors
- Manages authentication state

### Key Services
| Service | Purpose |
|---------|---------|
| `drillService.js` | Drill uploads, status, processing |
| `clubService.js` | Club CRUD operations |
| `playerService.js` | Player management |
| `teamService.js` | Team operations |
| `authService.js` | Authentication flows |
| `socketService.js` | Real-time updates |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Build Docker image
npm run docker:build

# Deploy to dev
npm run deploy:dev

# Deploy to prod
npm run deploy:prod
```

---

## Deployment

### GitHub Actions Workflows
- **deploy-dev.yml** - Deploy to dev environment
- **deploy-cloudrun-prod.yml** - Deploy to production

### Docker
- **Dockerfile** - Production build (used by cloudbuild.yaml)
- **deployment/Dockerfile** - Dev/staging builds

### Build Arguments
```dockerfile
ARG REACT_APP_API_URL
ARG REACT_APP_ENV
ARG REACT_APP_ENVIRONMENT
```

---

## Key Components

### Video Frame Extraction
Location: `src/components/drills/VideoFrameExtractor.jsx`
- Extracts frames from uploaded videos
- Uploads frames to GCS via presigned URLs
- Uses `constructFrameUrl()` for environment-specific URLs

### Manual Cone Detection
Location: `src/components/drills/ManualConeDetection.jsx`
- YOLO-based automatic cone detection
- Manual annotation interface
- Integrates with AI API for detection

### Environment Detection
Location: `src/utils/videoUtils.js`
```javascript
// Uses REACT_APP_ENVIRONMENT to determine frame URL paths
export const getEnvironment = () => {
  const env = process.env.REACT_APP_ENVIRONMENT || 'dev2';
  // Returns: 'prod' | 'dev1' | 'dev2'
};
```

---

## Best Practices

### Code Style
- Use functional components with hooks
- Follow existing component patterns in `src/components/`
- Use MUI components for consistency
- Handle loading and error states

### State Management
- Use Redux for global state (auth, user data)
- Use React Query or local state for component-specific data
- Persist auth state with redux-persist

### Performance
- Use React.memo for expensive components
- Implement virtualization for large lists (react-window)
- Lazy load routes and heavy components
- Optimize chart rendering with Recharts

### API Calls
- Always use services from `src/api/`
- Handle errors consistently
- Show loading states during requests
- Use toast notifications for user feedback

---

## Related Services

| Service | Description |
|---------|-------------|
| aim-coach-portal-api | Backend REST API |
| aim-admin-ui | Admin dashboard (serves frame images) |
| aim-ai-restapi | AI services (YOLO detection) |
| aim-shared-services | Shared utilities |

---

## Troubleshooting

### Environment Variables Not Loading
1. Restart dev server after `.env` changes
2. Clear `node_modules/.cache` folder
3. Ensure variables start with `REACT_APP_`

### Frame URLs Pointing to Wrong Environment
Check `REACT_APP_ENVIRONMENT` is set correctly:
- Local: Set in `.env` file
- Deployed: Set in Docker build args

### API Connection Issues
1. Verify `REACT_APP_API_URL` is correct
2. Check CORS settings on API
3. Verify JWT token is valid
