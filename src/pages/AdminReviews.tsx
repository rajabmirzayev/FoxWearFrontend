import React, { useState, useEffect } from 'react';
import { reviewApi } from '../services/api';
import { Review, ReviewPage } from '../types';
import { formatRelativeTime } from '../services/dateUtils';
import Modal from '../components/Modal';

export default function AdminReviews() {
  const [reviewsPage, setReviewsPage] = useState<ReviewPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewApi.getSiteReviews({ page: currentPage, size: 10 });
      if (res.data.success) {
        setReviewsPage(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setReviewToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (reviewToDelete === null) return;
    try {
      const res = await reviewApi.deleteSiteReview(reviewToDelete);
      if (res.data.success) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setIsDeleteModalOpen(false);
      setReviewToDelete(null);
    }
  };

  const renderStars = (rate: number) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`material-symbols-outlined text-sm ${star <= rate ? 'icon-fill' : ''}`}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  const filteredReviews = reviewsPage?.content.filter(review => 
    review.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.user?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-8 custom-scrollbar overflow-y-auto h-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight uppercase">Review Management</h2>
          <p className="text-primary/60 mt-1">Monitor and moderate customer feedback across the platform.</p>
        </div>
        <div className="bg-background-light p-4 rounded-xl border border-border-subtle shadow-sm flex items-center gap-4">
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Average Rating</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-primary">4.8</span>
              <div className="flex text-amber-400">
                <span className="material-symbols-outlined text-sm icon-fill">star</span>
                <span className="material-symbols-outlined text-sm icon-fill">star</span>
                <span className="material-symbols-outlined text-sm icon-fill">star</span>
                <span className="material-symbols-outlined text-sm icon-fill">star</span>
                <span className="material-symbols-outlined text-sm icon-fill">star_half</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-background-light border border-border-subtle rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">search</span>
          <input 
            type="text"
            placeholder="Search reviews by content or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-subtle bg-background-soft focus:outline-none focus:border-primary text-sm transition-all text-primary"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-background-light border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background-soft border-b border-border-subtle">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Rating</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Review Content</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-primary/40">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl">rate_review</span>
                      <p className="font-medium">No reviews found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-background-soft transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {review.user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">
                            {review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous'}
                          </span>
                          <span className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">
                            {review.user?.email || 'No email'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      {renderStars(review.rate)}
                    </td>
                    <td className="px-8 py-4">
                      <p className="text-sm text-primary/80 line-clamp-2 max-w-md italic">
                        "{review.description}"
                      </p>
                    </td>
                    <td className="px-8 py-4 text-sm text-primary/60">
                      {formatRelativeTime(review.createdAt || '')}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${review.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {review.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteClick(review.id!)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors cursor-pointer" 
                          title="Delete Review"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reviewsPage && reviewsPage.totalPages > 1 && (
          <div className="px-8 py-4 bg-background-soft border-t border-border-subtle flex items-center justify-between">
            <p className="text-xs text-primary/40 font-bold uppercase tracking-widest">
              Showing {reviewsPage.number * reviewsPage.size + 1} to {Math.min((reviewsPage.number + 1) * reviewsPage.size, reviewsPage.totalElements)} of {reviewsPage.totalElements} reviews
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="p-2 border border-border-subtle rounded-lg hover:bg-background-light disabled:opacity-30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(reviewsPage.totalPages - 1, prev + 1))}
                disabled={currentPage === reviewsPage.totalPages - 1}
                className="p-2 border border-border-subtle rounded-lg hover:bg-background-light disabled:opacity-30 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
