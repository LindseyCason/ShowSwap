import { useState, useEffect } from 'react';
import * as api from './api';
import type { DashboardData, UserLists, User, Friend } from './api';

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
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setLoading(true);
        setError(null);
        const friendsData = await api.getFriends();
        setFriends(friendsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load friends');
        console.error('Friends error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  return { friends, loading, error };
};
