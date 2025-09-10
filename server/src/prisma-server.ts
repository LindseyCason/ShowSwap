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

    // Validate username with regex
    const usernameRegex = /^(?=.{3,30}$)(?!.*[_.]{2})[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-30 characters, start with a letter, end with a letter or number, and cannot have consecutive underscores or periods' 
      });
    }

    // Check for existing user with case-insensitive comparison
    const existingUsers = await prisma.user.findMany({
      select: { id: true, username: true, createdAt: true }
    });

    const normalizedUsername = username.toLowerCase();
    const existingUser = existingUsers.find(user => 
      user.username.toLowerCase() === normalizedUsername
    );

    let user;
    if (existingUser) {
      // User exists, use the existing user
      user = existingUser;
    } else {
      // Create new user with original case preserved
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

// Friends endpoints - now returns followers and following
app.get('/api/friends', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get users that the current user is following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, username: true } }
      }
    });

    // Get users that are following the current user
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: { select: { id: true, username: true } }
      }
    });

    // Get compatibility scores for all users I'm following
    const compatibilities = await prisma.compatibility.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      select: {
        userAId: true,
        userBId: true,
        score: true
      }
    });

    // Create a map of user ID to compatibility score
    const compatibilityMap = new Map<string, number>();
    compatibilities.forEach(comp => {
      const friendId = comp.userAId === userId ? comp.userBId : comp.userAId;
      compatibilityMap.set(friendId, comp.score);
    });

    // Check for mutual follows to determine if they're "friends"
    const followingIds = new Set(following.map(f => f.following.id));
    const followerIds = new Set(followers.map(f => f.follower.id));

    const followingData = following.map(follow => {
      const user = follow.following;
      const isMutual = followerIds.has(user.id);
      const compatibility = compatibilityMap.get(user.id) || 0;
      
      return {
        id: user.id,
        username: user.username,
        compatibility,
        isMutual,
        relationship: 'following'
      };
    });

    // Return all followers data (including mutual connections)
    const followersData = followers.map(follow => {
      const user = follow.follower;
      const isMutual = followingIds.has(user.id);
      const compatibility = compatibilityMap.get(user.id) || 0;
      
      return {
        id: user.id,
        username: user.username,
        compatibility,
        isMutual,
        relationship: 'follower'
      };
    });

    res.json({
      following: followingData,
      followers: followersData, // Show all followers including mutual ones
      mutualFriends: followingData.filter(f => f.isMutual)
    });
  } catch (error) {
    console.error('Friends error:', error);
    res.status(500).json({ error: 'Failed to get friends data' });
  }
});

// Add friend endpoint
app.post('/api/friends/:friendId', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    if (currentUserId === friendId) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: currentUserId, userBId: friendId },
          { userAId: friendId, userBId: currentUserId }
        ]
      }
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if the friend user exists
    const friendUser = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, username: true, createdAt: true }
    });

    if (!friendUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the friendship
    await prisma.friendship.create({
      data: {
        userAId: currentUserId,
        userBId: friendId
      }
    });

    res.json({
      success: true,
      message: 'Friend added successfully',
      friend: friendUser
    });

  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Remove friend endpoint
app.delete('/api/friends/:friendId', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { friendId } = req.params;

    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID is required' });
    }

    if (currentUserId === friendId) {
      return res.status(400).json({ error: 'Cannot remove yourself as a friend' });
    }

    // Find and delete the friendship
    const deletedFriendship = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userAId: currentUserId, userBId: friendId },
          { userAId: friendId, userBId: currentUserId }
        ]
      }
    });

    if (deletedFriendship.count === 0) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    // Also delete the compatibility score
    const [userAId, userBId] = currentUserId < friendId ? [currentUserId, friendId] : [friendId, currentUserId];
    await prisma.compatibility.deleteMany({
      where: { userAId, userBId }
    });

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

// Follow user endpoint
app.post('/api/follow/:userId', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId: targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, createdAt: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    });

    // Check if this creates a mutual follow (friendship)
    const reverseFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: currentUserId
        }
      }
    });

    let isMutual = false;
    if (reverseFollow) {
      // Both users follow each other - calculate compatibility
      isMutual = true;
      const score = await calculateCompatibility(currentUserId, targetUserId);
      
      if (score !== null) {
        const [userAId, userBId] = currentUserId < targetUserId ? [currentUserId, targetUserId] : [targetUserId, currentUserId];
        
        await prisma.compatibility.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId, score },
          update: { score },
        });
      }
    }

    res.json({
      success: true,
      message: 'User followed successfully',
      user: targetUser,
      isMutual
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user endpoint
app.delete('/api/follow/:userId', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId: targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }

    // Find and delete the follow relationship
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    });

    if (deletedFollow.count === 0) {
      return res.status(404).json({ error: 'You are not following this user' });
    }

    // If there was a mutual follow, remove the compatibility score
    const [userAId, userBId] = currentUserId < targetUserId ? [currentUserId, targetUserId] : [targetUserId, currentUserId];
    await prisma.compatibility.deleteMany({
      where: { userAId, userBId }
    });

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get new followers count for notification
app.get('/api/followers/new', async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // For now, we'll consider all followers as "new" 
    // In a real app, you'd track when the user last checked
    const newFollowersCount = await prisma.follow.count({
      where: { followingId: userId }
    });

    res.json({
      count: newFollowersCount,
      hasNewFollowers: newFollowersCount > 0
    });

  } catch (error) {
    console.error('Get new followers error:', error);
    res.status(500).json({ error: 'Failed to get new followers' });
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

    // Get to watch shows
    const toWatch = await prisma.userShow.findMany({
      where: { 
        userId, 
        initialStatus: 'ToWatch' 
      },
      include: {
        show: true
      },
      orderBy: { addedAt: 'desc' }
    });

    // Get compatible friends (people I follow, sorted by compatibility)
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, username: true } }
      }
    });

    // Get compatibility scores for people I follow
    const compatibilities = await prisma.compatibility.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      select: {
        userAId: true,
        userBId: true,
        score: true
      }
    });

    // Create a map of user ID to compatibility score
    const compatibilityMap = new Map<string, number>();
    compatibilities.forEach(comp => {
      const friendId = comp.userAId === userId ? comp.userBId : comp.userAId;
      compatibilityMap.set(friendId, comp.score);
    });

    // Get top 3 compatible people I follow
    const compatibleFriends = following
      .map(follow => ({
        friend: follow.following,
        compatibility: compatibilityMap.get(follow.following.id) || 0
      }))
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 3);

    res.json({
      watchingNow: watchingNow.map(us => ({
        ...us.show,
        addedAt: us.addedAt
      })),
      toWatch: toWatch.map(us => ({
        ...us.show,
        addedAt: us.addedAt
      })),
      recentlyWatched: recentlyWatched.map(us => ({
        ...us.show,
        addedAt: us.addedAt,
        rating: us.user.ratings.find(r => r.showId === us.showId)?.stars || null
      })),
      compatibleFriends: compatibleFriends
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Search users endpoint
app.get('/api/users/search', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Get users that the current user is already following to exclude them from results
    const currentUserFollowing = await prisma.follow.findMany({
      where: {
        followerId: currentUserId
      },
      select: {
        followingId: true
      }
    });

    const followingIds = currentUserFollowing.map(f => f.followingId);
    
    // Always exclude current user, plus anyone they're following
    const excludeIds = [currentUserId, ...followingIds];

    // Search for users by username (case-insensitive contains search)
    // Exclude current user and users already being followed
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            username: {
              contains: query
            }
          },
          {
            id: {
              notIn: excludeIds
            }
          },
          {
            id: {
              not: currentUserId // Extra safety check to exclude current user
            }
          }
        ]
      },
      select: {
        id: true,
        username: true,
        createdAt: true
      },
      take: 20 // Limit results
    });

    // Sort by first occurrence of search term in username
    const sortedUsers = users.sort((a, b) => {
      const aIndex = a.username.toLowerCase().indexOf(query.toLowerCase());
      const bIndex = b.username.toLowerCase().indexOf(query.toLowerCase());
      return aIndex - bIndex;
    });

    res.json({
      success: true,
      users: sortedUsers
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
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
    console.log('📋 Profile request for userId:', userId, 'by currentUser:', currentUserId);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📋 Found user:', user.username);

    // Get user's shows with ratings
    const userShows = await prisma.userShow.findMany({
      where: { userId },
      include: {
        show: true
      },
      orderBy: { addedAt: 'desc' }
    });

    console.log('📋 Found userShows count:', userShows.length);

    // Get all ratings for this user
    const userRatings = await prisma.rating.findMany({
      where: { userId }
    });

    console.log('📋 Found userRatings count:', userRatings.length);

    const showsWithRatings = userShows.map(us => ({
      ...us.show,
      addedAt: us.addedAt,
      rating: userRatings.find(r => r.showId === us.showId)?.stars || null
    }));

    console.log('📋 Final showsWithRatings count:', showsWithRatings.length);

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
    let currentUserCompatibility = null;
    
    if (compatibilities.length > 0) {
      // Find the compatibility between current user and viewed user
      const directCompatibility = compatibilities.find(comp => 
        (comp.userAId === currentUserId && comp.userBId === userId) ||
        (comp.userAId === userId && comp.userBId === currentUserId)
      );
      
      if (directCompatibility) {
        currentUserCompatibility = directCompatibility.score;
      }
      
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

    const responseData = {
      user,
      shows: showsWithRatings,
      mostCompatibleFriend,
      compatibility: currentUserCompatibility
    };

    res.json(responseData);
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Helper function to calculate compatibility between two users
async function calculateCompatibility(userAId: string, userBId: string) {
  // Get ratings for both users
  const [ratingsA, ratingsB] = await Promise.all([
    prisma.rating.findMany({ 
      where: { userId: userAId }, 
      select: { showId: true, stars: true } 
    }),
    prisma.rating.findMany({ 
      where: { userId: userBId }, 
      select: { showId: true, stars: true } 
    }),
  ]);

  // Find mutual shows (shows both users have rated)
  const ratingsMapA = new Map(ratingsA.map(r => [r.showId, r.stars]));
  const mutualRatings: { showId: string; starsA: number; starsB: number }[] = [];
  
  for (const ratingB of ratingsB) {
    const starsA = ratingsMapA.get(ratingB.showId);
    if (typeof starsA === 'number') {
      mutualRatings.push({ 
        showId: ratingB.showId, 
        starsA: starsA, 
        starsB: ratingB.stars 
      });
    }
  }

  // Need at least 3 mutual ratings to calculate compatibility
  if (mutualRatings.length < 3) {
    return null;
  }

  // Calculate mean absolute difference
  const differences = mutualRatings.map(m => Math.abs(m.starsA - m.starsB));
  const meanAbsoluteDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  
  // Convert to compatibility score (0-100)
  // MAD of 0 = 100% compatibility, MAD of 4 = 0% compatibility
  const compatibilityScore = Math.round(100 * (1 - meanAbsoluteDifference / 4));
  
  return Math.max(0, Math.min(100, compatibilityScore));
}

// Endpoint to recalculate compatibilities (for testing/debugging)
app.post('/api/debug/recalculate-compatibility', async (req, res) => {
  try {
    const currentUserId = (req.session as any)?.userId;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all friendships for the current user
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId }
        ]
      },
      include: {
        userA: { select: { id: true, username: true } },
        userB: { select: { id: true, username: true } }
      }
    });

    const results = [];

    for (const friendship of friendships) {
      const friendId = friendship.userAId === currentUserId ? friendship.userBId : friendship.userAId;
      const friendUsername = friendship.userAId === currentUserId ? friendship.userB.username : friendship.userA.username;
      
      const score = await calculateCompatibility(currentUserId, friendId);
      
      if (score !== null) {
        // Ensure userAId < userBId for consistent storage
        const [userAId, userBId] = currentUserId < friendId ? [currentUserId, friendId] : [friendId, currentUserId];
        
        await prisma.compatibility.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId, score },
          update: { score },
        });
        
        results.push({ friend: friendUsername, score });
      } else {
        results.push({ friend: friendUsername, score: 'Not enough mutual ratings (need ≥3)' });
      }
    }

    res.json({
      success: true,
      message: 'Compatibility scores recalculated',
      results
    });

  } catch (error) {
    console.error('Recalculate compatibility error:', error);
    res.status(500).json({ error: 'Failed to recalculate compatibility' });
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
        show: true
      },
      orderBy: { addedAt: 'desc' }
    });

    // Get all ratings for this user
    const userRatings = await prisma.rating.findMany({
      where: { userId }
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
        rating: userRatings.find(r => r.showId === us.showId)?.stars || null
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
