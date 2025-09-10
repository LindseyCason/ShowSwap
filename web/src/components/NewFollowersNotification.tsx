import { useNewFollowers } from '../lib/hooks'

interface NewFollowersNotificationProps {
  onClose?: () => void
  className?: string
}

export default function NewFollowersNotification({ onClose, className = '' }: NewFollowersNotificationProps) {
  const { data: newFollowersData, loading, error } = useNewFollowers()

  if (loading || error || !newFollowersData?.hasNewFollowers) {
    return null
  }

  const { count, newFollowers } = newFollowersData

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="text-blue-600 text-lg mr-2">👥</span>
            <h3 className="text-sm font-medium text-blue-800">
              {count === 1 ? 'New Follower!' : `${count} New Followers!`}
            </h3>
          </div>
          
          {newFollowers && newFollowers.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {newFollowers.slice(0, 3).map((follower) => (
                  <div key={follower.id} className="flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs">
                    <span className="font-medium text-gray-700">
                      {follower.username}
                    </span>
                  </div>
                ))}
                {newFollowers.length > 3 && (
                  <div className="flex items-center space-x-1 bg-white rounded-full px-2 py-1 text-xs">
                    <span className="font-medium text-gray-500">
                      +{newFollowers.length - 3} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-blue-400 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
