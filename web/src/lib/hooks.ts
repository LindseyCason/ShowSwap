import { useState, useEffect } from 'react';
import * as api from './api';
import type { DashboardData, UserLists, User, Friend, FollowData, NewFollowersData } from './api';

// Custom hook for dashboard data
export const useDashboard = (enabled: boolean = true) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const dashboardData = await api.getDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [enabled]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await api.getDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Dashboard refetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
};

// Custom hook for user lists
export const useUserLists = (enabled: boolean = true) => {
  const [lists, setLists] = useState<UserLists | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchLists = async () => {
      try {
        setLoading(true);
        setError(null);
        const userLists = await api.getUserLists();
        setLists(userLists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lists');
        console.error('Lists error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [enabled]);

  return { lists, loading, error };
};

// Custom hook for current user
export const useCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await api.getCurrentUser();
      setUser(userData.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setUser(null); // Clear user on error
      console.error('User error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = () => {
    fetchUser();
  };

  const clearUser = () => {
    setUser(null);
    setError(null);
  };

  return { user, loading, error, setUser, refreshUser, clearUser };
};

// Custom hook for friends
export const useFriends = () => {
  const [followData, setFollowData] = useState<FollowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError(null);
        const friendsData = await api.getFriends();
        setFollowData(friendsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load friends');
        console.error('Friends error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const refetch = async () => {
    try {
      setError(null);
      const friendsData = await api.getFriends();
      setFollowData(friendsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
      console.error('Friends refetch error:', err);
    }
  };

  return { 
    followData, 
    loading, 
    error, 
    refetch,
    // For backward compatibility, still provide friends as array
    friends: followData?.mutualFriends || []
  };
};

// Custom hook for follow operations
export const useFollow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const followUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.followUser(userId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to follow user';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.unfollowUser(userId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unfollow user';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { followUser, unfollowUser, loading, error };
};

// Custom hook for new followers notifications
export const useNewFollowers = () => {
  const [data, setData] = useState<NewFollowersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewFollowers = async () => {
      try {
        setLoading(true);
        setError(null);
        const newFollowersData = await api.getNewFollowers();
        setData(newFollowersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load new followers');
        console.error('New followers error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNewFollowers();
  }, []);

  const refetch = async () => {
    try {
      setError(null);
      const newFollowersData = await api.getNewFollowers();
      setData(newFollowersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load new followers');
      console.error('New followers refetch error:', err);
    }
  };

  return { data, loading, error, refetch };
};
