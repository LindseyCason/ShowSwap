import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserLists, updateShowStatus, deleteShow } from '../lib/api';
import type { ShowWithRating } from '../lib/api';
import RatingModal from '../components/RatingModal';

type TabType = 'watching' | 'watched' | 'toWatch';

const TABS = [
  { id: 'watching' as TabType, label: 'Watching', icon: '📺' },
  { id: 'watched' as TabType, label: 'Watched', icon: '✅' },
  { id: 'toWatch' as TabType, label: 'To Watch', icon: '📋' },
];

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

const EmptyState = ({ tab, onAddShow }: { tab: TabType; onAddShow: () => void }) => {
  const messages = {
    watching: {
      title: "No shows currently watching",
      description: "Add shows you're currently watching to track your progress",
      action: "Add a show"
    },
    watched: {
      title: "No watched shows yet",
      description: "Rate shows you've finished watching to get better recommendations",
      action: "Add a watched show"
    },
    toWatch: {
      title: "Your to-watch list is empty",
      description: "Add shows you want to watch to build your collection",
      action: "Add a show"
    }
  };

  const message = messages[tab];

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📚</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message.title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{message.description}</p>
      <button
        onClick={onAddShow}
        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <span className="mr-2">+</span>
        {message.action}
      </button>
    </div>
  );
};

const ShowCard = ({ show, currentTab, onStatusChange, onDelete }: { 
  show: ShowWithRating; 
  currentTab: TabType;
  onStatusChange: (showId: string, newStatus: string, rating?: number) => void;
  onDelete: (showId: string, showTitle: string) => void;
}) => {
  const getStatusButtons = () => {
    switch (currentTab) {
      case 'toWatch':
        return (
          <button
            onClick={() => onStatusChange(show.id, 'WatchingNow')}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Start
          </button>
        );
      
      case 'watching':
        return (
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => onStatusChange(show.id, 'Watched')}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Finished
            </button>
            <button
              onClick={() => onStatusChange(show.id, 'ToWatch')}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Watch Later
            </button>
          </div>
        );
      
      case 'watched':
        return null; // No status change buttons for watched shows
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Show Poster Placeholder */}
        <div className="w-16 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex-shrink-0 flex items-center justify-center">
          <span className="text-2xl">📺</span>
        </div>
        
        {/* Show Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-gray-900 truncate">{show.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{show.platform}</p>
          
          {/* Rating */}
          {show.rating && (
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= show.rating! ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {show.rating}/5
              </span>
            </div>
          )}
          
          {/* Added Date */}
          <p className="text-xs text-gray-500 mb-3">
            Added {new Date(show.addedAt).toLocaleDateString()}
          </p>

          {/* Status Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusButtons()}
            </div>
            
            {/* Delete Button */}
            <button
              onClick={() => onDelete(show.id, show.title)}
              className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              title="Remove from list"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShowGrid = ({ shows, tab, onAddShow, onStatusChange, onDelete }: { 
  shows: ShowWithRating[]; 
  tab: TabType; 
  onAddShow: () => void;
  onStatusChange: (showId: string, newStatus: string, rating?: number) => void;
  onDelete: (showId: string, showTitle: string) => void;
}) => {
  if (shows.length === 0) {
    return <EmptyState tab={tab} onAddShow={onAddShow} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shows.map((show) => (
        <ShowCard 
          key={show.id} 
          show={show} 
          currentTab={tab}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default function Lists() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('watching');
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    showId: string;
    showTitle: string;
  }>({
    isOpen: false,
    showId: '',
    showTitle: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    showId: string;
    showTitle: string;
  }>({
    isOpen: false,
    showId: '',
    showTitle: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const { 
    data: userLists, 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: ['userLists'],
    queryFn: getUserLists,
    retry: 1
  });

  const handleAddShow = () => {
    navigate('/add');
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleStatusChange = async (showId: string, newStatus: string, rating?: number) => {
    // If changing to "Watched", show rating modal
    if (newStatus === 'Watched' && !rating) {
      const show = userLists ? 
        [...userLists.watching, ...userLists.toWatch, ...userLists.watched]
          .find(s => s.id === showId) : null;
      
      if (show) {
        setRatingModal({
          isOpen: true,
          showId,
          showTitle: show.title
        });
      }
      return;
    }

    // Update status directly for other cases
    try {
      setIsUpdating(true);
      await updateShowStatus(showId, newStatus, rating);
      // Refetch the lists to update the UI
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
    } catch (error) {
      console.error('Failed to update show status:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRatingSubmit = async (rating: number) => {
    try {
      setIsUpdating(true);
      await updateShowStatus(ratingModal.showId, 'Watched', rating);
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
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

  const handleDelete = (showId: string, showTitle: string) => {
    setDeleteConfirmation({
      isOpen: true,
      showId,
      showTitle
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsUpdating(true);
      await deleteShow(deleteConfirmation.showId);
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      setDeleteConfirmation({ isOpen: false, showId: '', showTitle: '' });
    } catch (error) {
      console.error('Failed to delete show:', error);
      // You could add a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, showId: '', showTitle: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Lists</h1>
            <p className="text-gray-600">Loading your show collections...</p>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Lists</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Unable to Load Lists</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load your show lists'}
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={handleBackToDashboard}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getShowsForTab = (tab: TabType): ShowWithRating[] => {
    if (!userLists) return [];
    return userLists[tab] || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Lists</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBackToDashboard}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ← Dashboard
              </button>
              <button
                onClick={handleAddShow}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                + Add Show
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex justify-between px-6">
              {TABS.map((tab) => {
                const showCount = getShowsForTab(tab.id).length;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex flex-col items-center space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                      <span className="text-lg sm:text-base">{tab.icon}</span>
                      <span className="text-xs sm:text-sm">{tab.label}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {showCount}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <ShowGrid 
              shows={getShowsForTab(activeTab)} 
              tab={activeTab} 
              onAddShow={handleAddShow}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={handleRatingModalClose}
        onSubmit={handleRatingSubmit}
        showTitle={ratingModal.showTitle}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Show from List
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove "{deleteConfirmation.showTitle}" from your list? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? 'Removing...' : 'Remove Show'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Updating show status...</p>
          </div>
        </div>
      )}
    </div>
  );
}
