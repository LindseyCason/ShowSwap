import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { User, ShowWithRating, Friend } from '../lib/api'
import { addShowToWatch, getCurrentUserShows } from '../lib/api'

interface UserProfileProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  userShows?: ShowWithRating[]
  compatibility?: number
  mostCompatibleFriend?: {
    friend: Friend;
    compatibility: number;
  } | null
  onViewProfile?: (userId: string) => void
}

export default function UserProfile({ 
  user, 
  isOpen, 
  onClose, 
  userShows, 
  compatibility, 
  mostCompatibleFriend,
  onViewProfile 
}: UserProfileProps) {
  const queryClient = useQueryClient()
  const [currentUserShows, setCurrentUserShows] = useState<(ShowWithRating & { status: string })[]>([])
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [successMessages, setSuccessMessages] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(0)

  // Pagination calculations
  const itemsPerPage = 5;
  const totalPages = userShows ? Math.ceil(userShows.length / itemsPerPage) : 0;
  const currentItems = userShows ? userShows.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage) : [];
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage === totalPages - 1;
  const isOnlyOnePage = totalPages <= 1;

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

  // Load current user's shows to check which ones are already added
  useEffect(() => {
    const loadCurrentUserShows = async () => {
      try {
        const shows = await getCurrentUserShows()
        setCurrentUserShows(shows)
      } catch (error) {
        console.error('Failed to load current user shows:', error)
      }
    }

    if (isOpen) {
      setCurrentPage(0) // Reset to first page when modal opens
      loadCurrentUserShows()
    }
  }, [isOpen])

  const getShowInMyList = (showId: string) => {
    return currentUserShows.find(show => show.id === showId)
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'WatchingNow':
        return 'Watching Now'
      case 'ToWatch':
        return 'To Watch'
      case 'Watched':
        return 'Watched'
      default:
        return status
    }
  }

  const handleAddToWatch = async (showId: string) => {
    setLoadingStates(prev => ({ ...prev, [showId]: true }))
    
    try {
      const result = await addShowToWatch(showId)
      
      // Update local state
      setCurrentUserShows(prev => [...prev, { ...result.show as ShowWithRating, status: result.status }])
      setSuccessMessages(prev => ({ ...prev, [showId]: result.message }))
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['userLists'] })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[showId]
          return newMessages
        })
      }, 3000)
      
    } catch (error) {
      console.error('Failed to add show:', error)
      // Add visible error feedback
      setSuccessMessages(prev => ({ 
        ...prev, 
        [showId]: `Error: ${error instanceof Error ? error.message : 'Failed to add show'}` 
      }))
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev }
          delete newMessages[showId]
          return newMessages
        })
      }, 5000)
    } finally {
      setLoadingStates(prev => ({ ...prev, [showId]: false }))
    }
  }
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
                <p className="text-sm text-gray-500">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="mt-4 flex space-x-4">
            {/* Binge Bond - Left Side */}
            {compatibility !== undefined && compatibility !== null ? (
              compatibility > 0 ? (
                <div className="flex-1 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Binge Bond</h4>
                  <div className="flex items-center justify-center">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="rgb(220 252 231)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="rgb(34 197 94)"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - compatibility / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-300 ease-in-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-600">{compatibility}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Binge Bond</h4>
                  <div className="flex items-center justify-center">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="rgb(229 231 235)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* No progress circle for 0% */}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">0%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : null}

            {/* Friend Suggestions - Right Side */}
            {mostCompatibleFriend ? (
              <div className="flex-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Suggested Friend</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {mostCompatibleFriend.friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{mostCompatibleFriend.friend.username}</p>
                      <p className="text-xs text-blue-600">
                        {mostCompatibleFriend.compatibility}% binge bond with {user.username}
                      </p>
                    </div>
                  </div>
                  {onViewProfile && (
                    <button
                      onClick={() => onViewProfile(mostCompatibleFriend.friend.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Profile
                    </button>
                  )}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Most similar viewing preferences - consider following for great recommendations!
                </p>
              </div>
            ) : (
              <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Friend Suggestions</h4>
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    Check back later for suggestions
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {userShows && userShows.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.username}'s Shows ({userShows.length})
                </h3>
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
              <div className="space-y-3">
                {currentItems.map((show) => (
                  <div key={show.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{show.title}</h4>
                      <p className="text-sm text-gray-600">{show.platform}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Added {new Date(show.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-2">
                      {/* Ratings Section */}
                      <div className="text-right space-y-1">
                        {/* Friend's Rating */}
                        {show.rating && (
                          <div className="text-xs">
                            <span className="text-gray-500">Friend's rating:</span>
                            <div className="text-yellow-600 font-medium">
                              {'★'.repeat(show.rating)} ({show.rating}/5)
                            </div>
                          </div>
                        )}
                        
                        {/* Your Rating */}
                        {(() => {
                          const myShow = getShowInMyList(show.id);
                          return myShow?.rating && (
                            <div className="text-xs">
                              <span className="text-gray-500">Your rating:</span>
                              <div className="text-yellow-600 font-medium">
                                {'★'.repeat(myShow.rating)} ({myShow.rating}/5)
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      {/* Action Button or Status */}
                      {(() => {
                        const myShow = getShowInMyList(show.id);
                        return myShow ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ {getStatusDisplayName(myShow.status)}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToWatch(show.id)}
                            disabled={loadingStates[show.id]}
                            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {loadingStates[show.id] ? 'Adding...' : 'Add to my shows'}
                          </button>
                        );
                      })()}
                      {successMessages[show.id] && (
                        <span className={`text-xs ${successMessages[show.id].startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                          {successMessages[show.id]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No shows to display</p>
              <p className="text-sm text-gray-400 mt-1">
                {user.username} hasn't added any shows yet
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Pagination controls on the left */}
            {userShows && userShows.length > 0 && !isOnlyOnePage ? (
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
            ) : (
              <div></div>
            )}
            
            {/* Close button on the right */}
            <button
              onClick={onClose}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
