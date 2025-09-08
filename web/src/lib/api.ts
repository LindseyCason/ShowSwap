// API utility functions for the ShowSwap frontend

const API_BASE_URL = '';  // Use relative URLs since we have proxy configured

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface Show {
  id: string;
  title: string;
  platform: string;
  posterUrl?: string | null;
  createdAt: string;
}

export interface ShowWithRating extends Show {
  rating?: number | null;
  addedAt: string;
}

export interface Friend {
  id: string;
  username: string;
}

export interface CompatibleFriend {
  friend: Friend;
  compatibility: number;
}

export interface DashboardData {
  watchingNow: ShowWithRating[];
  recentlyWatched: ShowWithRating[];
  compatibleFriends: CompatibleFriend[];
}

export interface UserLists {
  watching: ShowWithRating[];
  watchLater: ShowWithRating[];
  toWatch: ShowWithRating[];
  watched: ShowWithRating[];
}

// Auth API
export const login = async (username: string): Promise<{ success: boolean; user: User }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};

export const logout = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
};

export const getCurrentUser = async (): Promise<{ user: User }> => {
  const response = await fetch(`${API_BASE_URL}/api/me`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get current user');
  }
  
  return response.json();
};

// Dashboard API
export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get dashboard data');
  }
  
  return response.json();
};

// Lists API
export const getUserLists = async (): Promise<UserLists> => {
  const response = await fetch(`${API_BASE_URL}/api/my/lists`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user lists');
  }
  
  return response.json();
};

// Friends API
export const getFriends = async (): Promise<Friend[]> => {
  const response = await fetch(`${API_BASE_URL}/api/friends`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get friends');
  }
  
  return response.json();
};

// Shows API
export const addShow = async (show: {
  title: string;
  platform: string;
  status: string;
  rating?: number;
}): Promise<{ success: boolean; show: Show; status: string; rating?: number | null }> => {
  const response = await fetch(`${API_BASE_URL}/api/shows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(show),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to add show');
  }
  
  return response.json();
};

export interface UserProfileData {
  user: User;
  shows: ShowWithRating[];
  mostCompatibleFriend?: {
    friend: Friend;
    compatibility: number;
  } | null;
}

// User profile API
export const getUserProfile = async (userId: string): Promise<UserProfileData> => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }
  
  return response.json();
};

// Health check
export const healthCheck = async (): Promise<{ status: string; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  
  return response.json();
};
