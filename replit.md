# ShowSwap MVP - Friend-Based Show Recommendations

## Project Overview

ShowSwap is a social app where friends recommend TV shows via swipeable cards. Users can add shows, browse friends' decks, mark Watching Now/Watched/Watch Later, rate shows, and see compatibility scores with friends.

## Current Status ✅ FULLY FUNCTIONAL MVP

- ✅ **Full-stack app running with development servers**
- ✅ **Frontend**: React + TypeScript + Tailwind CSS (Vite dev server)
- ✅ **Backend**: Node.js + Express API server with Prisma database
- ✅ **Database**: SQLite with Prisma ORM, seeded with realistic data
- ✅ **Authentication**: Username-only login with session management
- ✅ **Show management**: Add, rate, and organize shows with custom platforms
- ✅ **Lists**: Currently Watching, Watch Later, Watched with ratings
- ✅ **Enhanced Dashboard**: Dynamic sections with currently watching, recently watched, and top compatible friends
- ✅ **Friends System**: Compatibility scoring based on shared shows and similar ratings
- ✅ **Friend Search**: Live search functionality with 'contains' text matching (limit 10 users)
- ✅ **Friend Management**: Add/remove friends with bidirectional relationships
- ✅ **Smart Navigation**: Dashboard buttons link to specific My Lists tabs
- ✅ **Toast Notifications**: Success/error feedback on form submissions
- 📅 **Completed**: September 7, 2025

## Tech Stack

- **Backend**: Node.js + Express (JavaScript)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Auth**: Simple username-only login with express-session
- **Development**: Concurrent dev servers with proxy configuration

## Complete API Endpoints

- `GET /` - Frontend application
- `GET /api/health` - Health check
- `POST /api/auth/login` - Username-only login
- `POST /api/auth/logout` - Logout
- `GET /api/me` - Current user info
- `GET /api/friends` - Friends list
- `GET /api/dashboard` - Dashboard data (currently watching, recently watched, compatible friends)
- `POST /api/shows` - Add new show with status and optional rating
- `GET /api/my/lists` - Get organized lists (watching/later/watched)
- `POST /api/action/watching-now` - Mark show as currently watching
- `POST /api/action/watch-later` - Add show to watch later list
- `POST /api/action/watched` - Mark show as watched (requires rating)

## How to Use

### 🚀 Quick Start

1. **Install dependencies and start the application:**

   ```bash
   npm install
   npm run dev
   ```

   This will start both the backend (port 3000) and frontend (port 5001) servers.

2. **Access the application:**
   - **Main App**: Open `http://localhost:5001` in your browser
   - **Backend API**: `http://localhost:3000`
   - **Health Check**: `http://localhost:3000/api/health`

### 📊 Database Management

The application uses SQLite with Prisma ORM and comes pre-seeded with realistic data.

**Database Commands:**

```bash
cd server

# View database in browser GUI
npm run db:studio

# Reset and reseed database
rm prisma/dev.db
npx prisma db push
npm run db:seed

# Apply schema changes
npm run db:push

# Generate Prisma client (after schema changes)
npx prisma generate
```

**Seeded Data Includes:**

- **4 Users**: lindsey, alex, sam, taylor
- **9 TV Shows**: The Bear, Watchmen, Stranger Things, Severance, etc.
- **4 Friendships** with compatibility scores (83-94%)
- **21 User-Show relationships** with various statuses
- **16 Ratings** for watched shows (1-5 stars)

### 🎯 Application Features

**1. Authentication**

- Simple username-only login (no passwords needed)
- Session-based authentication
- Try logging in as: `lindsey`, `alex`, `sam`, or `taylor`

**2. Show Management**

- Add new shows with platform and status
- Rate shows (1-5 stars) when marking as "Watched"
- Organize shows into lists: To Watch, Watch Later, Watching Now, Watched

**3. Social Features**

- Search and add friends
- View compatibility scores based on similar ratings
- Browse friends' show recommendations
- See what friends are currently watching

**4. Dashboard**

- View currently watching shows
- See recently watched shows
- Check top compatible friends
- Quick access to your lists

### 🛠️ Development Commands

**Root Level:**

```bash
npm run dev          # Start both servers
npm run dev:server   # Start only backend
npm run dev:web      # Start only frontend
npm run build        # Build both projects
```

**Server Commands:**

```bash
cd server
npm run dev          # Start backend server
npm run dev-ts       # Start with TypeScript (ts-node-dev)
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
npm run db:push      # Apply schema changes
```

**Web Commands:**

```bash
cd web
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Project Structure

```
/
├── server/                    # Backend API
│   ├── src/
│   │   ├── server.js         # Main Express server
│   │   ├── index.ts          # TypeScript entry point
│   │   ├── lib/              # Utilities
│   │   ├── middleware/       # Express middleware
│   │   └── routes/           # API routes
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Database seed script
│   │   ├── test-data.ts      # Data verification script
│   │   └── dev.db            # SQLite database file
│   └── package.json
├── web/                      # Frontend React app
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   ├── main.tsx         # React entry point
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   └── lib/             # Frontend utilities
│   ├── vite.config.ts       # Vite configuration with proxy
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── package.json
└── package.json             # Root workspace config
```

## Development Notes

- **Backend**: Running on port 3000 with Express + Prisma
- **Frontend**: Running on port 5001 with Vite dev server
- **Proxy**: Vite proxies `/api/*` requests to backend server
- **Database**: SQLite with full relational schema and seed data
- **Authentication**: Session-based with username-only login
- **Development**: Hot reload enabled for both frontend and backend

## Database Schema

- **Users**: Basic user profiles with usernames
- **Shows**: TV shows with titles, platforms, and poster URLs
- **UserShows**: User's show lists with statuses and timestamps
- **Ratings**: 1-5 star ratings for watched shows
- **Friendships**: Bidirectional friend relationships
- **Compatibility**: Calculated compatibility scores between friends
- **Sessions**: User authentication sessions
