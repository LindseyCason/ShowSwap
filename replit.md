# ShowSwap MVP - Friend-Based Show Recommendations

## Project Overview
ShowSwap is a social app where friends recommend TV shows via swipeable cards. Users can add shows, browse friends' decks, mark Watching Now/Watched/Watch Later, rate shows, and see compatibility scores with friends.

## Current Status ✅ FULLY FUNCTIONAL MVP
- ✅ **Full-stack app running on port 5000** with webview interface
- ✅ **Frontend**: Complete HTML/JavaScript UI with Tailwind CSS styling
- ✅ **Backend**: Comprehensive API with all core functionality
- ✅ **Authentication**: Username-only login with session management
- ✅ **Show management**: Add, rate, and organize shows
- ✅ **Lists**: Currently Watching, Watch Later, Watched with ratings
- ✅ **Testing**: Built-in API test functionality
- 📅 **Completed**: September 7, 2025

## Tech Stack
- **Backend**: Node.js + Express (JavaScript)
- **Frontend**: HTML + JavaScript + Tailwind CSS (via CDN)
- **Database**: In-memory storage with Maps (perfect for MVP demo)
- **Auth**: Simple username-only login with express-session
- **Deployment**: Single server serving both API and frontend

## Complete API Endpoints
- `GET /` - Frontend application
- `GET /api/health` - Health check
- `POST /api/auth/login` - Username-only login
- `POST /api/auth/logout` - Logout 
- `GET /api/me` - Current user info
- `GET /api/friends` - Friends list
- `POST /api/shows` - Add new show with status and optional rating
- `GET /api/my/lists` - Get organized lists (watching/later/watched)
- `POST /api/action/watching-now` - Mark show as currently watching
- `POST /api/action/watch-later` - Add show to watch later list  
- `POST /api/action/watched` - Mark show as watched (requires rating)

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