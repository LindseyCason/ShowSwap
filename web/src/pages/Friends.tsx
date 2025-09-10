import { useState } from 'react'
import { useFriends } from '../lib/hooks'
import UserProfile from '../components/UserProfile'
import { getUserProfile, searchUsers, addFriend } from '../lib/api'
import type { User, ShowWithRating, Friend } from '../lib/api'

export default function Friends() {
  const { friends, loading, error } = useFriends()
  
  // User profile modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [profileShows, setProfileShows] = useState<ShowWithRating[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [compatibility, setCompatibility] = useState<number | undefined>(undefined)

  // Search state
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [addingFriend, setAddingFriend] = useState<string | null>(null)

  const refetch = () => {
    window.location.reload() // Simple refetch for now
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
      await addFriend(userId)
      // Remove the user from search results since they're now a friend
      setSearchResults(prev => prev.filter(user => user.id !== userId))
      // Refetch friends list
      refetch()
    } catch (error) {
      console.error('Failed to add friend:', error)
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

  const handleUserClick = async (friend: Friend) => {
    setProfileLoading(true)
    const userForModal: User = {
      ...friend,
      createdAt: new Date().toISOString()
    }
    setSelectedUser(userForModal)
    
    try {
      const profileData = await getUserProfile(friend.id)
      setProfileShows(profileData.shows)
      setSelectedUser(profileData.user)
      // Calculate compatibility if needed
      setCompatibility(Math.floor(Math.random() * 40) + 60) // Placeholder
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

        {friends && friends.length > 0 ? (
          <div className="space-y-4">
            {/* Find More Friends Button */}
            <div className="flex justify-end">
              <button
                onClick={handleFindFriendsClick}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                + Find More Friends
              </button>
            </div>
            
            {friends.map((friend) => (
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
                        <h3 className="text-lg font-semibold text-gray-900">{friend.username}</h3>
                        <p className="text-sm text-green-600 font-medium">{friend.compatibility}% compatibility</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No friends yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't connected with any friends on ShowSwap yet. Start by adding some friends to see what they're watching!
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
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </div>
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        disabled={addingFriend === user.id}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingFriend === user.id ? 'Adding...' : 'Add Friend'}
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
