import { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  showTitle: string;
}

export default function RatingModal({ isOpen, onClose, onSubmit, showTitle }: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating);
      setSelectedRating(0);
      setHoveredRating(0);
    }
  };

  const handleClose = () => {
    setSelectedRating(0);
    setHoveredRating(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Rate "{showTitle}"
        </h3>
        
        <p className="text-gray-600 mb-6">
          How would you rate this show you just finished watching?
        </p>

        {/* Star Rating */}
        <div className="flex items-center justify-center space-x-1 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-3xl transition-colors focus:outline-none"
            >
              <span
                className={`${
                  star <= (hoveredRating || selectedRating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Rating Text */}
        <div className="text-center mb-6">
          {selectedRating > 0 && (
            <p className="text-sm text-gray-600">
              {selectedRating} star{selectedRating !== 1 ? 's' : ''} - {
                selectedRating === 1 ? 'Poor' :
                selectedRating === 2 ? 'Fair' :
                selectedRating === 3 ? 'Good' :
                selectedRating === 4 ? 'Very Good' :
                'Excellent'
              }
            </p>
          )}
          {selectedRating === 0 && (
            <p className="text-sm text-gray-500">Click a star to rate</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedRating === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );
}
