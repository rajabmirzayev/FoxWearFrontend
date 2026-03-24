import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { reviewApi } from '../services/api';

interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddReviewModal({ isOpen, onClose, onSuccess }: AddReviewModalProps) {
  const [rate, setRate] = useState(0);
  const [hoverRate, setHoverRate] = useState(0);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const displayRate = hoverRate || rate;

  const handleSubmit = async () => {
    if (rate === 0) {
      setError('Please select a rating');
      return;
    }
    if (!description.trim()) {
      setError('Please write a review');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await reviewApi.createSiteReview({
        rate,
        description,
        isActive: true
      });

      if (response.data.success) {
        onSuccess();
        onClose();
        // Reset form
        setRate(0);
        setHoverRate(0);
        setDescription('');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[520px] bg-background-light rounded-xl shadow-2xl p-8 overflow-hidden transition-colors duration-300"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-primary/40 hover:text-primary transition-colors cursor-pointer z-10"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            <div className="flex flex-col items-center text-center gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-primary text-3xl font-bold leading-tight font-display tracking-tight">
                  Share Your Experience
                </h3>
              </div>

              {/* Rating Selection */}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRate(star)}
                      onMouseLeave={() => setHoverRate(0)}
                      onClick={() => setRate(star)}
                      className="text-primary hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span 
                        className={`material-symbols-outlined text-4xl transition-all ${
                          star <= displayRate ? 'icon-fill' : 'text-primary/20'
                        }`}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary/40">
                  {displayRate > 0 ? `Rating: ${displayRate}/5` : 'Select Rating'}
                </span>
              </div>

              {/* Review Textarea */}
              <div className="w-full">
                <label className="sr-only" htmlFor="review-text">Review Content</label>
                <textarea
                  id="review-text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[160px] p-5 rounded-lg border border-primary/10 bg-background-soft focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-primary placeholder:text-primary/30 transition-all resize-none font-display"
                  placeholder="Write your review here..."
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-background-light font-bold py-4 px-6 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="size-5 border-2 border-background-light/30 border-t-background-light rounded-full animate-spin"></div>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
                <button 
                  onClick={onClose}
                  className="text-primary/50 hover:text-primary text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
