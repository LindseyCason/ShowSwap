import express from 'express';
import cors from 'cors';
import session from 'express-session';

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage for MVP (will replace with database later)
const users = new Map();
const sessions = new Map();

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

    // Validate username with regex
    const usernameRegex = /^(?=.{3,30}$)(?!.*[_.]{2})[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-30 characters, start with a letter, end with a letter or number, and cannot have consecutive underscores or periods' 
      });
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

    (req.session as any).userId = user.id;
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
    const userId = (req.session as any)?.userId;
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
    const userId = (req.session as any)?.userId;
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

app.listen(PORT, () => {
  console.log(`🚀 ShowSwap API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;