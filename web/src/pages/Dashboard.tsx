import { useNavigate } from 'react-router-dom'
import { useDashboard, useCurrentUser } from '../lib/hooks'
import UserProfile from '../components/UserProfile'
import { useState } from 'react'
import { getUserProfile } from '../lib/api'
import type { User, ShowWithRating, Friend } from '../lib/api'

const LoadingCard = ({ title }: { title: string }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  
  // Only fetch dashboard data if we have a user
  const shouldFetchDashboard = Boolean(!userLoading && !userError && user);
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard(shouldFetchDashboard);

  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileShows, setProfileShows] = useState<ShowWithRating[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [compatibility, setCompatibility] = useState<number | undefined>(undefined);
  const [mostCompatibleFriend, setMostCompatibleFriend] = useState<{
    friend: Friend;
    compatibility: number;
  } | null>(null);

  const handleUserClick = async (clickedUser: Friend, compatibilityScore: number) => {
    setProfileLoading(true);
    // Convert Friend to User format for the modal
    const userForModal: User = {
      ...clickedUser,
      createdAt: new Date().toISOString() // We'll get the real date from the API
    };
    setSelectedUser(userForModal);
    setCompatibility(compatibilityScore);
    
    try {
      const profileData = await getUserProfile(clickedUser.id);
      setProfileShows(profileData.shows);
      // Update with real user data from API
      setSelectedUser(profileData.user);
      // Set the most compatible friend data
      setMostCompatibleFriend(profileData.mostCompatibleFriend || null);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setProfileShows([]);
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setSelectedUser(null);
    setProfileShows([]);
    setCompatibility(undefined);
    setMostCompatibleFriend(null);
  };

  console.log('Dashboard Debug:', {
    user,
    userLoading,
    userError,
    shouldFetchDashboard,
    dashboardData,
    dashboardLoading,
    dashboardError
  });

  // If user is not authenticated, redirect to login
  if (!userLoading && userError && userError.includes('Failed to get current user')) {
    navigate('/login');
    return null;
  }

  if (userLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ShowSwap Dashboard</h1>
            <p className="text-gray-600">Loading your show recommendations...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingCard title="Currently Watching" />
            <LoadingCard title="Recently Watched" />
            <LoadingCard title="Compatible Friends" />
          </div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ShowSwap Dashboard</h1>
            <p className="text-gray-600">Welcome back{user ? `, ${user.username}` : ''}!</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Required</h3>
            <p className="text-gray-600 mb-4">Please log in to view your dashboard.</p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ShowSwap Dashboard</h1>
          <p className="text-gray-600">Welcome back{user ? `, ${user.username}` : ''}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Currently Watching */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Watching</h3>
            {dashboardData?.watchingNow.length ? (
              <div className="space-y-3">
                {dashboardData.watchingNow.map((show) => (
                  <div key={show.id} className="flex items-start space-x-3">
                    <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-gray-500">📺</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{show.title}</p>
                      <p className="text-sm text-gray-500">{show.platform}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No shows currently watching</p>
            )}
          </div>

          {/* Recently Watched */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Watched</h3>
            {dashboardData?.recentlyWatched.length ? (
              <div className="space-y-3">
                {dashboardData.recentlyWatched.map((show) => (
                  <div key={show.id} className="flex items-start space-x-3">
                    <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-gray-500">📺</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{show.title}</p>
                      <p className="text-sm text-gray-500">{show.platform}</p>
                      {show.rating && (
                        <div className="flex items-center mt-1">
                          <span className="text-yellow-400">{'★'.repeat(show.rating)}</span>
                          <span className="text-gray-300">{'★'.repeat(5 - show.rating)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recently watched shows</p>
            )}
          </div>

          {/* Compatible Friends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatible Friends</h3>
            {dashboardData?.compatibleFriends.length ? (
              <div className="space-y-3">
                {dashboardData.compatibleFriends.map((friendData) => (
                  <div 
                    key={friendData.friend.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(friendData.friend, friendData.compatibility)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {friendData.friend.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {friendData.friend.username}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-green-600">
                        {friendData.compatibility}%
                      </span>
                      <span className="text-gray-400 text-sm">→</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No compatible friends found</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/add')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">📺</div>
              <div className="text-sm font-medium text-gray-900">Add Show</div>
              <div className="text-xs text-gray-500">Add a new show to your list</div>
            </button>
            <button 
              onClick={() => navigate('/lists')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-medium text-gray-900">My Lists</div>
              <div className="text-xs text-gray-500">View all your show lists</div>
            </button>
            <button 
              onClick={() => navigate('/friends')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-900">Friends</div>
              <div className="text-xs text-gray-500">Manage your friends</div>
            </button>
            <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-medium text-gray-900">Recommendations</div>
              <div className="text-xs text-gray-500">Get personalized suggestions</div>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfile
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={closeProfile}
        userShows={profileShows}
        compatibility={compatibility}
        mostCompatibleFriend={mostCompatibleFriend}
        onViewProfile={(userId) => {
          // Find the friend data and open their profile
          if (mostCompatibleFriend && mostCompatibleFriend.friend.id === userId) {
            handleUserClick(mostCompatibleFriend.friend, mostCompatibleFriend.compatibility);
          }
        }}
      />

      {/* Loading overlay for profile */}
      {profileLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading profile...</p>
          </div>
        </div>
      )}
    </div>
  )
}