import { useState } from 'react'
import { useFriends, useFollow, useNewFollowers } from '../lib/hooks'
import UserProfile from '../components/UserProfile'
import { getUserProfile, searchUsers, recalculateCompatibility } from '../lib/api'
import type { User, ShowWithRating, Friend } from '../lib/api'

// Helper function to capitalize username
const capitalizeUsername = (username: string): string => {
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
};

export default function Friends() {
  const { followData, loading, error, refetch } = useFriends()
  const { followUser: followUserAction, unfollowUser: unfollowUserAction } = useFollow()
  const { markAsChecked } = useNewFollowers()
  
  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [profileShows, setProfileShows] = useState<ShowWithRating[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [compatibility, setCompatibility] = useState<number | undefined>(undefined)
  const [selectedUserRelationship, setSelectedUserRelationship] = useState<'following' | 'follower' | null>(null)

  // Search state
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingFriend, setAddingFriend] = useState<string | null>(null)

  // Remove friend confirmation state - now for unfollow
  const [unfollowingUser, setUnfollowingUser] = useState<Friend | null>(null)
  const [isUnfollowing, setIsUnfollowing] = useState(false)

  // Active tab state
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following')

  // Handle tab switching and mark followers as checked
  const handleTabSwitch = async (tab: 'following' | 'followers') => {
    setActiveTab(tab)
    
    // If switching to followers tab, mark them as checked
    if (tab === 'followers') {
      try {
        await markAsChecked()
      } catch (error) {
        console.error('Failed to mark followers as checked:', error)
      }
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      await followUserAction(userId)
      // Refetch friends list to update the data
      refetch()
    } catch (error) {
      console.error('Failed to follow user:', error)
      // Re-throw error so UserProfile can handle it
      throw error
    }
  }

  const handleFollowSuccess = async () => {
    if (!selectedUser) return;
    
    try {
      // Update relationship status immediately
      setSelectedUserRelationship('following')
      
      // Refetch the user's profile to get updated compatibility score
      const profileData = await getUserProfile(selectedUser.id)
      setCompatibility(profileData.compatibility || 0)
      setProfileShows(profileData.shows)
    } catch (error) {
      console.error('Failed to refresh profile after follow:', error)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const result = await searchUsers(query)
      setSearchResults(result.users)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddFriend = async (userId: string) => {
    setAddingFriend(userId)
    try {
      await followUserAction(userId)
      // Remove the user from search results since they're now being followed
      setSearchResults(prev => prev.filter(user => user.id !== userId))
      // Refetch friends list
      refetch()
    } catch (error) {
      console.error('Failed to follow user:', error)
    } finally {
      setAddingFriend(null)
    }
  }

  const handleFindFriendsClick = () => {
    setIsSearching(true)
  }

  const handleCancelSearch = () => {
    setIsSearching(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleRecalculateCompatibility = async () => {
    try {
      const result = await recalculateCompatibility()
      console.log('Compatibility recalculated:', result)
      refetch() // Refresh the friends list
    } catch (error) {
      console.error('Failed to recalculate compatibility:', error)
    }
  }

  const handleUnfollowClick = (friend: Friend, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent opening the profile modal
    setUnfollowingUser(friend)
  }

  const handleConfirmUnfollow = async () => {
    if (!unfollowingUser) return
    
    setIsUnfollowing(true)
    try {
      await unfollowUserAction(unfollowingUser.id)
      setUnfollowingUser(null)
      refetch() // Refresh the friends list
    } catch (error) {
      console.error('Failed to unfollow user:', error)
    } finally {
      setIsUnfollowing(false)
    }
  }

  const handleCancelUnfollow = () => {
    setUnfollowingUser(null)
  }

  // Get current data based on active tab
  const getCurrentData = () => {
    if (!followData) return []
    switch (activeTab) {
      case 'following':
        // Show all users being followed, including mutual connections
        return followData.following
      case 'followers':
        // Show all followers, including mutual connections
        return followData.followers
      default:
        return []
    }
  }

  const currentData = getCurrentData()
  const totalFollowing = followData?.following?.length || 0
  const totalFollowers = followData?.followers?.length || 0

  // Get button text based on relationship and tab
  const getActionButton = (friend: Friend) => {
    if (activeTab === 'following') {
      return (
        <button
          onClick={(event) => handleUnfollowClick(friend, event)}
          className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Unfollow
        </button>
      )
    } else if (activeTab === 'followers') {
      if (friend.isMutual) {
        return (
          <button
            onClick={(event) => handleUnfollowClick(friend, event)}
            className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Unfollow
          </button>
        )
      } else {
        return (
          <button
            onClick={(event) => {
              event.stopPropagation()
              handleAddFriend(friend.id)
            }}
            disabled={addingFriend === friend.id}
            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {addingFriend === friend.id ? 'Following...' : 'Follow Back'}
          </button>
        )
      }
    }
    return null
  }
  
  const handleUserClick = async (friend: Friend) => {
    setProfileLoading(true)
    const userForModal: User = {
      ...friend,
      createdAt: new Date().toISOString()
    }
    setSelectedUser(userForModal)
    setSelectedUserRelationship(friend.relationship || null)
    
    try {
      const profileData = await getUserProfile(friend.id)
      setProfileShows(profileData.shows)
      setSelectedUser(profileData.user)
      // Use the compatibility from the API response, fallback to friend's compatibility if not available
      setCompatibility(profileData.compatibility || friend.compatibility || 0)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const closeProfile = () => {
    setSelectedUser(null)
    setProfileShows([])
    setCompatibility(undefined)
    setSelectedUserRelationship(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Friends</h1>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Friends</h1>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load friends</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
          <p className="text-gray-600 mt-2">
            Connect with other ShowSwap users to discover new shows and see what they're watching
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabSwitch('following')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'following' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Following ({totalFollowing})
            </button>
            <button
              onClick={() => handleTabSwitch('followers')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'followers' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Followers ({totalFollowers})
            </button>
          </nav>
        </div>

        {currentData && currentData.length > 0 ? (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handleRecalculateCompatibility}
                className="px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                🔄 Recalculate Binge Bonds
              </button>
              <button
                onClick={handleFindFriendsClick}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                + Find More Friends
              </button>
            </div>
            
            {currentData.map((friend) => (
              <div 
                key={friend.id} 
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleUserClick(friend)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600">
                          {friend.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">{capitalizeUsername(friend.username)}</h3>
                          {friend.isMutual && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Mutual
                            </span>
                          )}
                          {friend.isNew && activeTab === 'followers' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              NEW
                            </span>
                          )}
                        </div>
                        {friend.compatibility > 0 && (
                          <p className="text-sm text-green-600 font-medium">
                            {friend.compatibility}% binge bond
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getActionButton(friend)}
                      <span className="text-sm text-gray-500">View Profile</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'following' && 'Not following anyone yet'}
              {activeTab === 'followers' && 'No followers yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'following' && 'You aren\'t following anyone yet. Start connecting with other users to see what they\'re watching!'}
              {activeTab === 'followers' && 'No one is following you yet. Add some shows and start connecting with others!'}
            </p>
            <button 
              onClick={handleFindFriendsClick}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Find Friends
            </button>
          </div>
        )}
      </div>

      {/* Search Friends Modal */}
      {isSearching && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 flex flex-col">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Find Friends</h3>
                <button
                  onClick={handleCancelSearch}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {searchLoading && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              {searchQuery.length > 0 && searchQuery.length < 2 && (
                <p className="text-sm text-gray-500 mt-2">Type at least 2 characters to search</p>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="p-4 space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{capitalizeUsername(user.username)}</span>
                      </div>
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        disabled={addingFriend === user.id}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingFriend === user.id ? 'Following...' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length >= 2 && !searchLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              ) : searchQuery.length >= 2 && searchLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Searching...</p>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>Start typing to search for users</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfile
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={closeProfile}
        userShows={profileShows}
        compatibility={compatibility}
        mostCompatibleFriend={null}
        onFollow={handleFollow}
        relationship={selectedUserRelationship}
        onFollowSuccess={handleFollowSuccess}
      />

      {/* Unfollow Confirmation Modal */}
      {unfollowingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Unfollow User</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to unfollow <strong>{capitalizeUsername(unfollowingUser.username)}</strong>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  • They will no longer appear in your Following list
                </p>
                <p className="text-sm text-gray-600">
                  • If they were a mutual friend, they'll move to your Followers list
                </p>
                <p className="text-sm text-gray-600">
                  • You can follow them again anytime
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelUnfollow}
                  disabled={isUnfollowing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUnfollow}
                  disabled={isUnfollowing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                >
                  {isUnfollowing ? 'Unfollowing...' : 'Unfollow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
