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
  { value: 'WatchingNow', label: 'Watching Now' },
  { value: 'Watched', label: 'Watched' },
  { value: 'ToWatch', label: 'To Watch' }
];

export default function AddShow() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    customPlatform: '',
    status: 'WatchingNow',
    rating: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      title: '',
      platform: '',
      customPlatform: '',
      status: 'WatchingNow',
      rating: 0
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
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
      if (formData.status === 'Watched' && formData.rating === 0) {
        throw new Error('Rating is required for watched shows');
      }

      // Determine the final platform value
      const finalPlatform = formData.platform === 'Other' ? formData.customPlatform.trim() : formData.platform;

      const showData = {
        title: formData.title.trim(),
        platform: finalPlatform,
        status: formData.status,
        ...(formData.status === 'Watched' && formData.rating > 0 ? { rating: formData.rating } : {})
      };

      await addShow(showData);
      
      // Show success message and reset form for next entry
      setSuccessMessage(`"${formData.title}" has been added to your ${formData.status === 'WatchingNow' ? 'Watching' : formData.status === 'ToWatch' ? 'To Watch' : 'Watched'} list!`);
      resetForm();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Show</h1>
              <p className="text-gray-600">Add a new show to your collection</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              title="Close and return to dashboard"
            >
              ×
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

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
                        // Reset rating when switching away from "Watched"
                        rating: e.target.value === 'Watched' ? prev.rating : 0
                      }))}
                      className="mr-3 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{status.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating (only shown if status is "Watched") */}
            {formData.status === 'Watched' && (
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

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Form
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
