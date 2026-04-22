import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import { reviewApi } from '../services/api';
import { Review } from '../types';
import { formatRelativeTime, isUpdated } from '../services/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import Modal from '../components/Modal';
import UpdateReviewModal from '../components/UpdateReviewModal';

type ReviewType = 'site' | 'product';

export default function MyReviews() {
  const [siteReviews, setSiteReviews] = useState<Review[]>([]);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewType>('site');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<{ id: number, type: ReviewType } | null>(null);
  const [editingReview, setEditingReview] = useState<{ review: Review, type: ReviewType } | null>(null);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    setLoading(true);
    try {
      const [siteRes, productRes] = await Promise.all([
        reviewApi.getMyReviews(),
        reviewApi.getMyProductReviews()
      ]);

      if (siteRes.data.success) {
        setSiteReviews(siteRes.data.data);
      }
      if (productRes.data.success) {
        setProductReviews(productRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching my reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number, type: ReviewType) => {
    setReviewToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (review: Review, type: ReviewType) => {
    setEditingReview({ review, type });
    setIsUpdateModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      const res = reviewToDelete.type === 'site' 
        ? await reviewApi.deleteSiteReview(reviewToDelete.id)
        : await reviewApi.deleteProductReview(reviewToDelete.id);
      
      if (res.data.success) {
        fetchMyReviews();
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
      <div className="flex gap-0.5 text-primary">
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

  const reviews = activeTab === 'site' ? siteReviews : productReviews;

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            <header className="mb-16">
              <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">My Reviews</h1>
              <p className="font-body font-light text-lg text-secondary leading-relaxed">Manage your feedback and contributions to the FOXWEAR community.</p>
            </header>

            {loading ? (
              <div className="space-y-24 animate-pulse">
                {[1, 2].map(section => (
                  <section key={section}>
                    <div className="flex items-center gap-6 mb-12">
                      <div className="h-8 w-48 bg-primary/10 rounded-xl"></div>
                      <div className="h-px flex-1 bg-primary/5"></div>
                    </div>
                    <div className="space-y-6">
                      {[1, 2].map(i => (
                        <div key={i} className="h-40 w-full bg-primary/5 rounded-2xl"></div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="space-y-24">
                {/* Site Reviews Section */}
                <section>
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Site Reviews</h2>
                    <div className="h-px flex-1 bg-primary/10"></div>
                  </div>
                  
                  {siteReviews.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-stone-900/50 rounded-2xl border border-dashed border-primary/20">
                      <span className="material-symbols-outlined text-4xl text-primary/20 mb-4">rate_review</span>
                      <p className="font-headline uppercase tracking-widest text-[10px] text-secondary">No site reviews yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {siteReviews.map((review) => (
                        <ReviewCard 
                          key={review.id} 
                          review={review} 
                          type="site" 
                          onDelete={handleDeleteClick} 
                          onEdit={handleEditClick}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {/* Product Reviews Section */}
                <section>
                  <div className="flex items-center gap-6 mb-12">
                    <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Product Reviews</h2>
                    <div className="h-px flex-1 bg-primary/10"></div>
                  </div>
                  
                  {productReviews.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-stone-900/50 rounded-2xl border border-dashed border-primary/20">
                      <span className="material-symbols-outlined text-4xl text-primary/20 mb-4">shopping_bag</span>
                      <p className="font-headline uppercase tracking-widest text-[10px] text-secondary">No product reviews yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {productReviews.map((review) => (
                        <ReviewCard 
                          key={review.id} 
                          review={review} 
                          type="product" 
                          onDelete={handleDeleteClick} 
                          onEdit={handleEditClick}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />

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

      {editingReview && (
        <UpdateReviewModal
          isOpen={isUpdateModalOpen}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setEditingReview(null);
          }}
          onSuccess={fetchMyReviews}
          review={editingReview.review}
          type={editingReview.type}
        />
      )}
    </div>
  );
}

interface ReviewCardProps {
  key?: React.Key;
  review: Review;
  type: ReviewType;
  onDelete: (id: number, type: ReviewType) => void;
  onEdit: (review: Review, type: ReviewType) => void;
}

function ReviewCard({ review, type, onDelete, onEdit }: ReviewCardProps) {
  const renderStars = (rate: number) => {
    return (
      <div className="flex gap-0.5 text-primary">
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-900 p-8 rounded-2xl border border-primary/5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex flex-col md:flex-row gap-8">
        {type === 'product' && review.product && (
          <div className="w-20 h-28 flex-shrink-0 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
            <img 
              src={review.product.colors[0]?.images.find(img => img.main)?.image || review.product.colors[0]?.images[0]?.image} 
              alt={review.product.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              {type === 'product' && review.product && (
                <h3 className="font-headline font-bold text-xs uppercase tracking-tight text-primary mb-2">
                  {review.product.title}
                </h3>
              )}
              {renderStars(review.rate)}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-label text-[9px] tracking-widest text-secondary uppercase">
                {isUpdated(review.createdAt, review.updatedAt) && <span className="text-primary font-bold mr-1">(UPDATED)</span>}
                {formatRelativeTime(review.updatedAt || review.createdAt)}
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onEdit(review, type)}
                  className="text-secondary hover:text-primary transition-colors cursor-pointer"
                  title="Edit Review"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button 
                  onClick={() => onDelete(review.id!, type)}
                  className="text-secondary hover:text-red-500 transition-colors cursor-pointer"
                  title="Delete Review"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          </div>
          <p className="font-body font-light text-primary/80 leading-relaxed italic text-sm">
            "{review.description}"
          </p>
        </div>
      </div>
    </motion.div>
  );
}
