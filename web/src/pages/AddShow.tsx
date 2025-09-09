import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addShow } from '../lib/api';

const PLATFORMS = [
  'Netflix',
  'Hulu',
  'Disney+',
  'HBO Max',
  'Amazon Prime',
  'Apple TV+',
  'Paramount+',
  'Peacock',
  'Other'
];

const STATUSES = [
  { value: 'watched', label: 'Watched' },
  { value: 'to-watch', label: 'To Watch' }
];

export default function AddShow() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    customPlatform: '',
    status: 'to-watch',
    rating: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.platform) {
        throw new Error('Platform is required');
      }
      if (formData.platform === 'Other' && !formData.customPlatform.trim()) {
        throw new Error('Custom platform name is required');
      }
      if (formData.status === 'watched' && formData.rating === 0) {
        throw new Error('Rating is required for watched shows');
      }

      // Determine the final platform value
      const finalPlatform = formData.platform === 'Other' ? formData.customPlatform.trim() : formData.platform;

      const showData = {
        title: formData.title.trim(),
        platform: finalPlatform,
        status: formData.status,
        ...(formData.status === 'watched' && formData.rating > 0 ? { rating: formData.rating } : {})
      };

      await addShow(showData);
      
      // Navigate back to dashboard on success
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add show');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Show</h1>
          <p className="text-gray-600">Add a new show to your collection</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Show Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter show title"
                required
              />
            </div>

            {/* Platform */}
            <div>
              <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-2">
                Platform *
              </label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  platform: e.target.value,
                  // Clear custom platform when switching away from "Other"
                  customPlatform: e.target.value === 'Other' ? prev.customPlatform : ''
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select a platform</option>
                {PLATFORMS.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            {/* Custom Platform Input (only shown when "Other" is selected) */}
            {formData.platform === 'Other' && (
              <div>
                <label htmlFor="customPlatform" className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name *
                </label>
                <input
                  type="text"
                  id="customPlatform"
                  value={formData.customPlatform}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPlatform: e.target.value }))}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter platform name (max 50 characters)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.customPlatform.length}/50 characters
                </p>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Status *
              </label>
              <div className="space-y-2">
                {STATUSES.map(status => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value={status.value}
                      checked={formData.status === status.value}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value,
                        // Reset rating when switching to "to-watch"
                        rating: e.target.value === 'to-watch' ? 0 : prev.rating
                      }))}
                      className="mr-3 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating (only shown if status is "watched") */}
            {formData.status === 'watched' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rating *
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      className={`text-2xl transition-colors ${
                        star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.rating > 0 ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'Click to rate'}
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Show'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
