# ShowSwap MVP - Friend-Based Show Recommendations

## Project Overview
ShowSwap is a social app where friends recommend TV shows via swipeable cards. Users can add shows, browse friends' decks, mark Watching Now/Watched/Watch Later, rate shows, and see compatibility scores with friends.

## Current Status
- ✅ Backend API server running on port 3001
- ✅ Basic authentication system with username-only login  
- ✅ In-memory storage (will migrate to Prisma + SQLite later)
- 🔄 Frontend React app in development
- 📅 Started: September 7, 2025

## Tech Stack
- **Backend**: Node.js + Express (JavaScript for now, will migrate to TypeScript)
- **Frontend**: React + Vite + TypeScript + TailwindCSS  
- **Database**: In-memory storage (migrating to SQLite via Prisma)
- **Auth**: Simple username-only login with express-session

## Working API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/login` - Username-only login
- `POST /api/auth/logout` - Logout 
- `GET /api/me` - Current user info
- `GET /api/friends` - Friends list (empty for now)

## Project Structure
```
/
├── server/               # Backend API
│   ├── src/
│   │   ├── server.js    # Main server (JavaScript)
│   │   └── index.ts     # TypeScript version (has issues)
│   └── package.json
├── web/                 # Frontend React app
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   └── components/
│   └── package.json
└── package.json         # Root workspace config
```

## Development Notes
- Server running on port 3001 with workflow "ShowSwap Server"
- Frontend needs dependency installation fixes (esbuild issues)
- Will implement Prisma database integration after frontend is working
- Need to build out show management, ratings, and compatibility scoring

## Next Steps
1. Fix frontend dependencies and get React app running
2. Implement more backend API endpoints
3. Add database integration with Prisma
4. Build swipeable card interface
5. Implement compatibility scoring algorithm