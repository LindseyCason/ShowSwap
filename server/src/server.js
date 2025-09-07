const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for MVP
const users = new Map();
const shows = new Map();
const userShows = new Map(); // userId -> [showIds]
const ratings = new Map(); // userId:showId -> rating

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: 'showswap-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../../web')));

// Main route - serve the simple frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../web/simple-index.html'));
});

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShowSwap API is running!' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    let user = users.get(username);
    if (!user) {
      user = {
        id: `user_${Date.now()}_${Math.random()}`,
        username,
        createdAt: new Date().toISOString()
      };
      users.set(username, user);
    }

    req.session.userId = user.id;
    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/me', (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Basic friends endpoint
app.get('/api/friends', (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // For MVP, return empty friends list initially
    res.json([]);
  } catch (error) {
    console.error('Friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Shows endpoints
app.post('/api/shows', (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, platform, posterUrl, initialStatus, rating } = req.body;
    if (!title || !platform) {
      return res.status(400).json({ error: 'Title and platform are required' });
    }

    // Create or find existing show
    const showKey = `${title}|${platform}`;
    let show = Array.from(shows.values()).find(s => `${s.title}|${s.platform}` === showKey);
    
    if (!show) {
      show = {
        id: `show_${Date.now()}_${Math.random()}`,
        title,
        platform,
        posterUrl: posterUrl || null,
        createdAt: new Date().toISOString()
      };
      shows.set(show.id, show);
    }

    // Add to user's shows
    if (!userShows.has(userId)) {
      userShows.set(userId, []);
    }
    const userShowList = userShows.get(userId);
    if (!userShowList.find(us => us.showId === show.id)) {
      userShowList.push({
        showId: show.id,
        addedAt: new Date().toISOString(),
        initialStatus: initialStatus || 'ToWatch'
      });
    }

    // Add rating if provided
    if (initialStatus === 'Watched' && rating) {
      const ratingKey = `${userId}:${show.id}`;
      ratings.set(ratingKey, {
        userId,
        showId: show.id,
        stars: parseInt(rating),
        createdAt: new Date().toISOString()
      });
    }

    res.json({ show, userShow: userShowList.find(us => us.showId === show.id) });
  } catch (error) {
    console.error('Add show error:', error);
    res.status(500).json({ error: 'Failed to add show' });
  }
});

// Get user's lists
app.get('/api/my/lists', (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userShowList = userShows.get(userId) || [];
    const lists = {
      watchingNow: [],
      watchLater: [],
      watched: []
    };

    userShowList.forEach(userShow => {
      const show = shows.get(userShow.showId);
      if (show) {
        const ratingKey = `${userId}:${show.id}`;
        const rating = ratings.get(ratingKey);
        
        const showData = {
          ...show,
          addedAt: userShow.addedAt,
          rating: rating ? rating.stars : null
        };

        if (userShow.initialStatus === 'WatchingNow') {
          lists.watchingNow.push(showData);
        } else if (userShow.initialStatus === 'WatchLater') {
          lists.watchLater.push(showData);
        } else if (userShow.initialStatus === 'Watched') {
          lists.watched.push(showData);
        }
      }
    });

    res.json(lists);
  } catch (error) {
    console.error('Lists error:', error);
    res.status(500).json({ error: 'Failed to get lists' });
  }
});

// Action endpoints for updating show status
app.post('/api/action/watching-now', (req, res) => {
  try {
    const userId = req.session?.userId;
    const { showId } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!showId) return res.status(400).json({ error: 'Show ID required' });

    const userShowList = userShows.get(userId) || [];
    const userShow = userShowList.find(us => us.showId === showId);
    
    if (userShow) {
      userShow.initialStatus = 'WatchingNow';
    } else {
      userShowList.push({
        showId,
        addedAt: new Date().toISOString(),
        initialStatus: 'WatchingNow'
      });
      userShows.set(userId, userShowList);
    }

    res.json({ success: true, status: 'WatchingNow' });
  } catch (error) {
    console.error('Watching now error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/action/watch-later', (req, res) => {
  try {
    const userId = req.session?.userId;
    const { showId } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!showId) return res.status(400).json({ error: 'Show ID required' });

    const userShowList = userShows.get(userId) || [];
    const userShow = userShowList.find(us => us.showId === showId);
    
    if (userShow) {
      userShow.initialStatus = 'WatchLater';
    } else {
      userShowList.push({
        showId,
        addedAt: new Date().toISOString(),
        initialStatus: 'WatchLater'
      });
      userShows.set(userId, userShowList);
    }

    res.json({ success: true, status: 'WatchLater' });
  } catch (error) {
    console.error('Watch later error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/action/watched', (req, res) => {
  try {
    const userId = req.session?.userId;
    const { showId, rating } = req.body;
    
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!showId) return res.status(400).json({ error: 'Show ID required' });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating (1-5) required for watched shows' });
    }

    const userShowList = userShows.get(userId) || [];
    const userShow = userShowList.find(us => us.showId === showId);
    
    if (userShow) {
      userShow.initialStatus = 'Watched';
    } else {
      userShowList.push({
        showId,
        addedAt: new Date().toISOString(),
        initialStatus: 'Watched'
      });
      userShows.set(userId, userShowList);
    }

    // Add rating
    const ratingKey = `${userId}:${showId}`;
    ratings.set(ratingKey, {
      userId,
      showId,
      stars: parseInt(rating),
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, status: 'Watched', rating: parseInt(rating) });
  } catch (error) {
    console.error('Watched error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Dashboard API endpoint
app.get('/api/dashboard', (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userShowList = userShows.get(userId) || [];
    
    // Get currently watching shows (most recent first)
    const currentlyWatching = userShowList
      .filter(us => us.initialStatus === 'WatchingNow')
      .map(userShow => {
        const show = shows.get(userShow.showId);
        return show ? { ...show, addedAt: userShow.addedAt } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    // Get watched shows (most recent first)
    const watchedShows = userShowList
      .filter(us => us.initialStatus === 'Watched')
      .map(userShow => {
        const show = shows.get(userShow.showId);
        if (!show) return null;
        
        const ratingKey = `${userId}:${show.id}`;
        const rating = ratings.get(ratingKey);
        
        return {
          ...show,
          addedAt: userShow.addedAt,
          rating: rating ? rating.stars : null
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    // Generate mock friends data with compatibility
    const currentUser = Array.from(users.values()).find(u => u.id === userId);
    const otherUsers = Array.from(users.values()).filter(u => u.id !== userId);
    
    const compatibleFriends = otherUsers.map(friend => {
      // Calculate compatibility based on shared shows and similar ratings
      const friendShows = userShows.get(friend.id) || [];
      const userWatchedShows = userShowList.filter(us => us.initialStatus === 'Watched');
      const friendWatchedShows = friendShows.filter(us => us.initialStatus === 'Watched');
      
      let sharedShows = 0;
      let ratingDifferences = [];
      
      userWatchedShows.forEach(userShow => {
        const friendShow = friendWatchedShows.find(fs => fs.showId === userShow.showId);
        if (friendShow) {
          sharedShows++;
          
          const userRating = ratings.get(`${userId}:${userShow.showId}`)?.stars || 0;
          const friendRating = ratings.get(`${friend.id}:${friendShow.showId}`)?.stars || 0;
          
          if (userRating && friendRating) {
            ratingDifferences.push(Math.abs(userRating - friendRating));
          }
        }
      });
      
      // Calculate compatibility score (0-100)
      let compatibility = 0;
      if (sharedShows > 0) {
        const avgRatingDiff = ratingDifferences.length > 0 
          ? ratingDifferences.reduce((a, b) => a + b, 0) / ratingDifferences.length 
          : 0;
        
        // Higher shared shows = higher compatibility, lower rating differences = higher compatibility
        compatibility = Math.min(100, (sharedShows * 20) + (Math.max(0, 25 - (avgRatingDiff * 5))));
      }
      
      return {
        id: friend.id,
        username: friend.username,
        compatibility: Math.round(compatibility),
        sharedShows
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, 5); // Top 5

    res.json({
      currentlyWatching: {
        recent: currentlyWatching[0] || null,
        total: currentlyWatching.length,
        hasMore: currentlyWatching.length > 1
      },
      recentlyWatched: {
        recent: watchedShows[0] || null,
        total: watchedShows.length,
        hasMore: watchedShows.length > 1
      },
      compatibleFriends: compatibleFriends
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ShowSwap full-stack app running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📺 Add shows: POST http://localhost:${PORT}/api/shows`);
  console.log(`📋 My lists: GET http://localhost:${PORT}/api/my/lists`);
});

module.exports = app;