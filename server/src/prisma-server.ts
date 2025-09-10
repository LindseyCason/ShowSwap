import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Type definitions
// Define valid show statuses
type Status = "ToWatch" | "Watched" | "WatchingNow";

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

// NOTE: Static file serving disabled - React app runs on separate Vite dev server
// app.use(express.static(path.join(__dirname, '../../web')));

// NOTE: Root route disabled - React app handles all frontend routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../web/index.html'));
// });

// Debug endpoint to check current user
app.get('/api/debug/user', (req, res) => {
  const userId = (req.session as any)?.userId;
  console.log('Debug: Current session userId:', userId);
  res.json({ userId, session: req.session });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ShowSwap API with Prisma is running!' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, createdAt: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { username },
        select: { id: true, username: true, createdAt: true }
      });
    }

    // Store user in session
    (req.session as any).userId = user.id;
    (req.session as any).username = user.username;

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        createdAt: user.createdAt
      } 
    });
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

app.get('/api/me', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Friends endpoints
app.get('/api/friends', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: { select: { id: true, username: true } },
        userB: { select: { id: true, username: true } }
      }
    });

    const friends = friendships.map(friendship => {
      return friendship.userAId === userId ? friendship.userB : friendship.userA;
    });

    res.json(friends);
  } catch (error) {
    console.error('Friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get currently watching shows
    const watchingNow = await prisma.userShow.findMany({
      where: { 
        userId, 
        initialStatus: 'WatchingNow' 
      },
      include: {
        show: true
      },
      orderBy: { addedAt: 'desc' }
    });

    // Get recently watched shows (with ratings)
    const recentlyWatched = await prisma.userShow.findMany({
      where: { 
        userId, 
        initialStatus: 'Watched' 
      },
      include: {
        show: true,
        user: {
          include: {
            ratings: {
              where: { userId }
            }
          }
        }
      },
      orderBy: { addedAt: 'desc' },
      take: 5
    });

    // Get compatible friends
    const compatibleFriends = await prisma.compatibility.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: { select: { id: true, username: true } },
        userB: { select: { id: true, username: true } }
      },
      orderBy: { score: 'desc' },
      take: 3
    });

    const friends = compatibleFriends.map(comp => ({
      friend: comp.userAId === userId ? comp.userB : comp.userA,
      compatibility: comp.score
    }));

    res.json({
      watchingNow: watchingNow.map(us => ({
        ...us.show,
        addedAt: us.addedAt
      })),
      recentlyWatched: recentlyWatched.map(us => ({
        ...us.show,
        addedAt: us.addedAt,
        rating: us.user.ratings.find(r => r.showId === us.showId)?.stars || null
      })),
      compatibleFriends: friends
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// User profile endpoint
app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId } = req.params;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's shows with ratings
    const userShows = await prisma.userShow.findMany({
      where: { userId },
      include: {
        show: true,
        user: {
          include: {
            ratings: {
              where: { userId }
            }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    const showsWithRatings = userShows.map(us => ({
      ...us.show,
      addedAt: us.addedAt,
      rating: us.user.ratings.find(r => r.showId === us.showId)?.stars || null
    }));

    // Get user's most compatible friend (excluding the current logged-in user)
    const compatibilities = await prisma.compatibility.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: { select: { id: true, username: true } },
        userB: { select: { id: true, username: true } }
      },
      orderBy: { score: 'desc' }
    });

    let mostCompatibleFriend = null;
    if (compatibilities.length > 0) {
      // Find the first compatibility that doesn't involve the current logged-in user
      for (const comp of compatibilities) {
        const friendUser = comp.userAId === userId ? comp.userB : comp.userA;
        
        // Skip if the friend is the current logged-in user
        if (friendUser.id !== currentUserId) {
          mostCompatibleFriend = {
            friend: friendUser,
            compatibility: comp.score
          };
          break;
        }
      }
    }

    res.json({
      user,
      shows: showsWithRatings,
      mostCompatibleFriend
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Shows endpoints
app.post('/api/shows', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, platform, status, rating } = req.body;
    
    if (!title || !platform || !status) {
      return res.status(400).json({ error: 'Title, platform, and status are required' });
    }

    // Create or find show
    let show = await prisma.show.findFirst({
      where: { title, platform }
    });

    if (!show) {
      show = await prisma.show.create({
        data: { title, platform }
      });
    }

    // Create or update user show
    const userShow = await prisma.userShow.upsert({
      where: { 
        userId_showId: { userId, showId: show.id }
      },
      create: { 
        userId, 
        showId: show.id, 
        initialStatus: status 
      },
      update: { 
        initialStatus: status 
      },
      include: { show: true }
    });

    // Add rating if provided and status is Watched
    if (status === 'Watched' && rating && rating >= 1 && rating <= 5) {
      await prisma.rating.upsert({
        where: { 
          userId_showId: { userId, showId: show.id }
        },
        create: { 
          userId, 
          showId: show.id, 
          stars: rating 
        },
        update: { 
          stars: rating 
        }
      });
    }

    res.json({ 
      success: true, 
      show: userShow.show,
      status: userShow.initialStatus,
      rating: rating || null
    });
  } catch (error) {
    console.error('Add show error:', error);
    res.status(500).json({ error: 'Failed to add show' });
  }
});

// Get user's lists
app.get('/api/my/lists', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userShows = await prisma.userShow.findMany({
      where: { userId },
      include: {
        show: true,
        user: {
          include: {
            ratings: {
              where: { userId }
            }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    const lists = {
      watching: userShows.filter(us => us.initialStatus === 'WatchingNow').map(us => ({
        ...us.show,
        addedAt: us.addedAt
      })),
      toWatch: userShows.filter(us => us.initialStatus === 'ToWatch').map(us => ({
        ...us.show,
        addedAt: us.addedAt
      })),
      watched: userShows.filter(us => us.initialStatus === 'Watched').map(us => ({
        ...us.show,
        addedAt: us.addedAt,
        rating: us.user.ratings.find(r => r.showId === us.showId)?.stars || null
      }))
    };

    res.json(lists);
  } catch (error) {
    console.error('Lists error:', error);
    res.status(500).json({ error: 'Failed to get lists' });
  }
});

// Update show status
app.patch('/api/shows/:showId/status', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId } = req.params;
    const { status, rating } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['WatchingNow', 'Watched', 'ToWatch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update user show status
    const userShow = await prisma.userShow.update({
      where: { 
        userId_showId: { userId, showId }
      },
      data: { 
        initialStatus: status 
      },
      include: { show: true }
    });

    // Handle rating for watched shows
    if (status === 'Watched' && rating && rating >= 1 && rating <= 5) {
      await prisma.rating.upsert({
        where: { 
          userId_showId: { userId, showId }
        },
        create: { 
          userId, 
          showId, 
          stars: rating 
        },
        update: { 
          stars: rating 
        }
      });
    } else if (status !== 'Watched') {
      // Remove rating if status is not Watched
      await prisma.rating.deleteMany({
        where: { userId, showId }
      });
    }

    res.json({ 
      success: true, 
      show: userShow.show,
      status: userShow.initialStatus,
      rating: status === 'Watched' ? rating || null : null
    });
  } catch (error) {
    console.error('Update show status error:', error);
    res.status(500).json({ error: 'Failed to update show status' });
  }
});

// Update show status
app.patch('/api/shows/:showId/status', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId } = req.params;
    const { status, rating } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['WatchingNow', 'Watched', 'ToWatch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update user show status
    const userShow = await prisma.userShow.update({
      where: { 
        userId_showId: { userId, showId }
      },
      data: { 
        initialStatus: status 
      },
      include: { show: true }
    });

    // Handle rating for watched shows
    if (status === 'Watched' && rating && rating >= 1 && rating <= 5) {
      await prisma.rating.upsert({
        where: { 
          userId_showId: { userId, showId }
        },
        create: { 
          userId, 
          showId, 
          stars: rating 
        },
        update: { 
          stars: rating 
        }
      });
    } else if (status !== 'Watched') {
      // Remove rating if status is not Watched
      await prisma.rating.deleteMany({
        where: { userId, showId }
      });
    }

    res.json({ 
      success: true, 
      show: userShow.show,
      status: userShow.initialStatus,
      rating: status === 'Watched' ? rating || null : null
    });
  } catch (error) {
    console.error('Update show status error:', error);
    res.status(500).json({ error: 'Failed to update show status' });
  }
});

// Add show from friend to my To Watch list
app.post('/api/shows/:showId/add-to-watch', async (req, res) => {
  console.log('🎯 Add to watch endpoint called for showId:', req.params.showId);
  
  try {
    const userId = (req.session as any)?.userId;
    console.log('Current user ID:', userId);
    
    if (!userId) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId } = req.params;

    // Check if show exists
    const show = await prisma.show.findUnique({
      where: { id: showId }
    });

    console.log('Found show:', show);

    if (!show) {
      console.log('❌ Show not found in database');
      return res.status(404).json({ error: 'Show not found' });
    }

    // Check if user already has this show
    const existingUserShow = await prisma.userShow.findUnique({
      where: { 
        userId_showId: { userId, showId }
      }
    });

    console.log('Existing user show:', existingUserShow);

    if (existingUserShow) {
      console.log('❌ Show already in user list');
      return res.status(400).json({ 
        error: 'Show already in your list',
        status: existingUserShow.initialStatus 
      });
    }

    // Add show to user's "To Watch" list
    const userShow = await prisma.userShow.create({
      data: { 
        userId, 
        showId, 
        initialStatus: 'ToWatch'
      },
      include: { show: true }
    });

    console.log('✅ Successfully created user show:', userShow);

    res.json({ 
      success: true, 
      show: userShow.show,
      status: userShow.initialStatus,
      message: 'Show added to your To Watch list!'
    });
  } catch (error) {
    console.error('❌ Add show to watch error:', error);
    res.status(500).json({ error: 'Failed to add show to watch list' });
  }
});

// Delete show from user's list
app.delete('/api/shows/:showId', async (req, res) => {
  console.log('🗑️ Delete show endpoint called for showId:', req.params.showId);
  
  try {
    const userId = (req.session as any)?.userId;
    console.log('Current user ID:', userId);
    
    if (!userId) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId } = req.params;

    // Check if user has this show
    const existingUserShow = await prisma.userShow.findUnique({
      where: { 
        userId_showId: { userId, showId }
      }
    });

    console.log('Existing user show:', existingUserShow);

    if (!existingUserShow) {
      console.log('❌ Show not found in user list');
      return res.status(404).json({ error: 'Show not found in your list' });
    }

    // Delete any rating for this show
    await prisma.rating.deleteMany({
      where: { 
        userId, 
        showId 
      }
    });

    // Delete the user show
    await prisma.userShow.delete({
      where: { 
        userId_showId: { userId, showId }
      }
    });

    console.log('✅ Successfully deleted show from user list');

    res.json({ 
      success: true,
      message: 'Show removed from your list'
    });
  } catch (error) {
    console.error('❌ Delete show error:', error);
    res.status(500).json({ error: 'Failed to remove show from list' });
  }
});

// Action endpoints
app.post('/api/action/watching-now', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId } = req.body;
    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    await prisma.userShow.update({
      where: { 
        userId_showId: { userId, showId }
      },
      data: { 
        initialStatus: 'WatchingNow' 
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Watching now error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/action/watch-later', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId } = req.body;
    if (!showId) {
      return res.status(400).json({ error: 'Show ID is required' });
    }

    await prisma.userShow.update({
      where: { 
        userId_showId: { userId, showId }
      },
      data: { 
        initialStatus: 'WatchLater' 
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Watch later error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.post('/api/action/watched', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { showId, rating } = req.body;
    if (!showId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Show ID and rating (1-5) are required' });
    }

    // Update status
    await prisma.userShow.update({
      where: { 
        userId_showId: { userId, showId }
      },
      data: { 
        initialStatus: 'Watched' 
      }
    });

    // Add/update rating
    await prisma.rating.upsert({
      where: { 
        userId_showId: { userId, showId }
      },
      create: { 
        userId, 
        showId, 
        stars: rating 
      },
      update: { 
        stars: rating 
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Watched error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

app.listen(PORT, () => {
  console.log(`🚀 ShowSwap API server with Prisma running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📺 Add shows: POST http://localhost:${PORT}/api/shows`);
  console.log(`📋 My lists: GET http://localhost:${PORT}/api/my/lists`);
});

export default app;
