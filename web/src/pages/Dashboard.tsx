import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../lib/hooks'
import { useAuth } from '../lib/UserContext'
import UserProfile from '../components/UserProfile'
import RatingModal from '../components/RatingModal'
import { useState } from 'react'
import { getUserProfile, updateShowStatus } from '../lib/api'
import type { User, ShowWithRating, Friend, CompatibleFriend } from '../lib/api'

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

interface PaginatedTileProps<T> {
  title: string;
  data: T[];
  onItemClick?: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage: string;
}

const PaginatedTile = <T,>({ title, data, onItemClick, renderItem, emptyMessage }: PaginatedTileProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const currentItems = data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  const isOnlyOnePage = totalPages <= 1;

  // Helper function to get unique key from item
  const getItemKey = (item: T): string => {
    // Type guard for ShowWithRating
    if (item && typeof item === 'object' && 'id' in item && typeof (item as any).id === 'string') {
      return (item as any).id;
    }
    // Type guard for CompatibleFriend
    if (item && typeof item === 'object' && 'friend' in item) {
      const friendItem = item as any;
      if (friendItem.friend && typeof friendItem.friend === 'object' && 
          'id' in friendItem.friend && typeof friendItem.friend.id === 'string') {
        return `friend-${friendItem.friend.id}`;
      }
    }
    // Fallback to stringified item (not ideal but better than index)
    return JSON.stringify(item);
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {!isOnlyOnePage && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstPage}
              className={`p-1 rounded ${
                isFirstPage 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-500">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={isLastPage}
              className={`p-1 rounded ${
                isLastPage 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {currentItems.map((item) => (
            <div
              key={getItemKey(item)}
              onClick={() => onItemClick?.(item)}
              className={onItemClick ? "cursor-pointer" : ""}
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: userLoading, error: userError } = useAuth();
  
  // Only fetch dashboard data if we have a user
  const shouldFetchDashboard = Boolean(!userLoading && !userError && user);
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard(shouldFetchDashboard);

  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileShows, setProfileShows] = useState<ShowWithRating[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [compatibility, setCompatibility] = useState<number | undefined>(undefined);
  const [mostCompatibleFriend, setMostCompatibleFriend] = useState<{
    friend: Friend;
    compatibility: number;
  } | null>(null);

  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    showId: string;
    showTitle: string;
  }>({
    isOpen: false,
    showId: '',
    showTitle: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleWatchNow = async (showId: string) => {
    try {
      setIsUpdating(true);
      await updateShowStatus(showId, 'WatchingNow');
      
      // Refetch dashboard data to update the UI
      await refetchDashboard();
    } catch (error) {
      console.error('Failed to update show status to watching:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    try {
      setIsUpdating(true);
      await updateShowStatus(ratingModal.showId, 'Watched', rating);
      
      // Refetch dashboard data to update the UI
      await refetchDashboard();
      
      setRatingModal({ isOpen: false, showId: '', showTitle: '' });
    } catch (error) {
      console.error('Failed to update show status with rating:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingModalClose = () => {
    setRatingModal({ isOpen: false, showId: '', showTitle: '' });
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
          <div className="space-y-6">
            <LoadingCard title="Compatible Friends" />
            <LoadingCard title="Now Watching" />
            <LoadingCard title="Next Up" />
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

        <div className="space-y-6">
          {/* Compatible Friends Row */}
          <PaginatedTile
            title="Compatible Friends"
            data={dashboardData?.compatibleFriends || []}
            onItemClick={(friendData) => handleUserClick(friendData.friend, friendData.compatibility)}
            emptyMessage="No compatible friends found"
            renderItem={(friendData: CompatibleFriend) => (
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
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
            )}
          />

          {/* Now Watching Row */}
          <PaginatedTile
            title="Now Watching"
            data={dashboardData?.watchingNow || []}
            emptyMessage="No shows currently watching"
            renderItem={(show: ShowWithRating) => (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{show.title}</p>
                  <p className="text-sm text-gray-500">{show.platform}</p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setRatingModal({
                      isOpen: true,
                      showId: show.id,
                      showTitle: show.title
                    });
                  }}
                  className="ml-3 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Finished
                </button>
              </div>
            )}
          />

          {/* Next Up Row */}
          <PaginatedTile
            title="Next Up"
            data={dashboardData?.toWatch || []}
            emptyMessage="No shows in your watch list"
            renderItem={(show: ShowWithRating) => (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{show.title}</p>
                  <p className="text-sm text-gray-500">{show.platform}</p>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleWatchNow(show.id);
                  }}
                  className="ml-3 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Start
                </button>
              </div>
            )}
          />
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

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={handleRatingModalClose}
        onSubmit={handleRatingSubmit}
        showTitle={ratingModal.showTitle}
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

      {/* Loading overlay for status updates */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Updating show status...</p>
          </div>
        </div>
      )}
    </div>
  )
}