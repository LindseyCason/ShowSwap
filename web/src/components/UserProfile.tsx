import type { User, ShowWithRating, Friend } from '../lib/api'

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
          
          {compatibility && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Compatibility Score</span>
                <span className="text-lg font-bold text-green-600">{compatibility}%</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Based on shared shows and similar ratings
              </p>
            </div>
          )}

          {mostCompatibleFriend ? (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                      {mostCompatibleFriend.compatibility}% compatible with {user.username}
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
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Friend Suggestions</h4>
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  Check back later to see who {user.username} is compatible with!
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  More suggestions will appear as the network grows
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {userShows && userShows.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {user.username}'s Shows ({userShows.length})
              </h3>
              <div className="space-y-3">
                {userShows.map((show) => (
                  <div key={show.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{show.title}</h4>
                      <p className="text-sm text-gray-600">{show.platform}</p>
                      {show.rating && (
                        <p className="text-sm text-yellow-600 mt-1">
                          {'★'.repeat(show.rating)} ({show.rating}/5)
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Added {new Date(show.addedAt).toLocaleDateString()}
                      </p>
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
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
