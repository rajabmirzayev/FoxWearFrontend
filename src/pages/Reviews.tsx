import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { reviewApi, userApi } from '../services/api';
import { Review, ReviewPage, User } from '../types';
import { formatRelativeTime, isUpdated } from '../services/dateUtils';
import AddReviewModal from '../components/AddReviewModal';
import UpdateReviewModal from '../components/UpdateReviewModal';
import Modal from '../components/Modal';
import storage from '../services/storage';

export default function Reviews() {
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [allReviewsPage, setAllReviewsPage] = useState<ReviewPage | null>(null);
  const [averageRate, setAverageRate] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = storage.getItem('accessToken');
    setIsLoggedIn(!!token);
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = storage.getItem('accessToken');
      
      // Fetch average rate
      try {
        const avgRes = await reviewApi.getAverageRate();
        if (avgRes.data.success) {
          setAverageRate(avgRes.data.data ?? 0);
        }
      } catch (err) {
        console.error('Error fetching average rate:', err);
      }

      if (token) {
        try {
          const profileRes = await userApi.getProfile();
          if (profileRes.data.success) {
            setCurrentUser(profileRes.data.data);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }

        const myRes = await reviewApi.getMyReviews();
        console.log('My Reviews Response:', myRes.data);
        if (myRes.data.success) {
          setMyReviews(Array.isArray(myRes.data.data) ? myRes.data.data : []);
        }
      }

      const allRes = await reviewApi.getSiteReviews({ page: currentPage, size: 6 });
      if (allRes.data.success) {
        // Fetch user details for each review if not present
        const reviewsWithUsers = await Promise.all(
          allRes.data.data.content.map(async (review) => {
            if (!review.user && review.userId) {
              try {
                const userRes = await userApi.getUserById(review.userId);
                if (userRes.data.success) {
                  return { ...review, user: userRes.data.data };
                }
              } catch (err: any) {
                // Only log if it's not a 404 (user not found)
                if (err.response?.status !== 404) {
                  console.error('Error fetching user for review:', err);
                }
              }
            }
            return review;
          })
        );
        setAllReviewsPage({ ...allRes.data.data, content: reviewsWithUsers });
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
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setIsUpdateModalOpen(false);
  };

  const renderStars = (rate: number, className = "icon-fill text-sm") => {
    return (
      <div className="flex gap-1 text-primary">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`material-symbols-outlined ${star <= rate ? className : 'text-sm'}`}
          >
            {star <= rate ? 'star' : 'star'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-background-light text-primary font-body selection:bg-primary/10 min-h-screen transition-colors duration-300">
      <Header />
      
      <main className="pt-32 pb-24 px-8 max-w-screen-xl mx-auto">
        {/* Header Section */}
        <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary/40">Testimonials</span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-primary leading-none">Customer Reviews</h1>
          </div>
          <div className="flex flex-col items-start md:items-end space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex text-primary">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFull = star <= Math.floor(averageRate);
                  const isHalf = !isFull && star <= Math.ceil(averageRate) && averageRate % 1 !== 0;
                  return (
                    <span 
                      key={star} 
                      className={`material-symbols-outlined ${isFull || isHalf ? 'icon-fill' : ''}`}
                    >
                      {isFull ? 'star' : isHalf ? 'star_half' : 'star'}
                    </span>
                  );
                })}
              </div>
              <span className="font-headline font-bold text-xl">
                {averageRate > 0 ? averageRate.toFixed(1) : '0.0'} / 5
              </span>
            </div>
            <p className="font-label text-[10px] tracking-widest uppercase text-primary/60">
              Based on {allReviewsPage?.totalElements.toLocaleString() || '0'} verified reviews
            </p>
          </div>
        </section>

        {/* CTA Action Bar */}
        <div className="mb-16 flex justify-end">
          <button 
            onClick={() => {
              isLoggedIn ? setIsAddModalOpen(true) : navigate('/login');
            }}
            className="bg-primary text-background-light px-8 py-4 flex items-center gap-3 hover:bg-primary/90 transition-all duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-label text-[10px] tracking-[0.2em] font-bold uppercase">Add New Review</span>
          </button>
        </div>

        {/* My Reviews Section (Logged In User) */}
        {isLoggedIn && myReviews.length > 0 && (
          <section className="mb-32">
            <div className="flex items-center gap-6 mb-12">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Your Contribution</h2>
              <div className="h-px flex-1 bg-primary/10"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myReviews.map((review, index) => (
                <div key={review.id || `my-review-${index}`} className="bg-background-soft p-10 flex flex-col justify-between transition-colors hover:bg-background-light border border-primary/5 duration-300">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      {renderStars(review.rate)}
                      <span className="font-label text-[9px] tracking-widest text-primary/60 uppercase">
                        {isUpdated(review.createdAt, review.updatedAt) && <span className="text-primary font-bold mr-1">(UPDATED)</span>}
                        {formatRelativeTime(review.updatedAt || review.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-4 uppercase">
                      {review.rate === 5 ? 'Exceptional Craftsmanship' : review.rate >= 4 ? 'Great Quality' : 'My Feedback'}
                    </h3>
                    <p className="font-body font-light text-primary/70 leading-relaxed mb-8">
                      {review.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10">
                        <img 
                          className="w-full h-full object-cover" 
                          src={currentUser?.profilePicture || `https://ui-avatars.com/api/?name=${currentUser?.firstName || 'User'}&background=random`} 
                          alt="User"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="font-label text-[10px] tracking-widest uppercase font-bold">
                        {currentUser ? `${currentUser.firstName} ${currentUser.lastName?.charAt(0)}.` : 'You'}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleDeleteClick(review.id!)}
                        className="text-primary/60 hover:text-error transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Reviews Grid */}
        <section>
          <div className="flex items-center gap-6 mb-12">
            <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Community Feedback</h2>
            <div className="h-px flex-1 bg-primary/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-primary/10">
            {allReviewsPage?.content.map((review, index) => (
              <div key={review.id || index} className="bg-background-light p-10 flex flex-col">
                <div className="flex gap-1 text-primary mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`material-symbols-outlined text-sm ${star <= review.rate ? 'icon-fill' : ''}`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="font-body font-light text-primary leading-relaxed mb-10 flex-grow italic">
                  "{review.description}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-background-soft flex items-center justify-center">
                    {review.user?.profilePicture ? (
                      <img 
                        className="w-full h-full object-cover" 
                        src={review.user.profilePicture} 
                        alt={review.user.firstName || 'User'}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-headline font-black text-xs uppercase tracking-tighter select-none">
                        {review.user?.firstName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block font-label text-[10px] tracking-widest uppercase font-bold">
                      {review.user ? `${review.user.firstName} ${review.user.lastName?.charAt(0)}.` : 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="block font-label text-[9px] tracking-widest text-primary/60 uppercase">Verified Buyer</span>
                      <span className="text-[8px] text-primary/20">•</span>
                      <span className="block font-label text-[8px] tracking-widest text-primary/40 uppercase">
                        {isUpdated(review.createdAt, review.updatedAt) && <span className="text-primary/60 font-bold mr-1">(UPDATED)</span>}
                        {formatRelativeTime(review.updatedAt || review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {allReviewsPage && allReviewsPage.totalPages > 1 && (
            <div className="mt-20 flex flex-col items-center gap-6">
              <p className="text-sm text-primary/50 font-label uppercase tracking-widest">
                Showing {allReviewsPage.content.length} of {allReviewsPage.totalElements} reviews
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={allReviewsPage.first}
                  className="w-10 h-10 flex items-center justify-center border border-primary/10 hover:border-primary transition-colors text-primary/40 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {Array.from({ length: allReviewsPage.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-10 h-10 flex items-center justify-center border transition-colors font-headline font-bold cursor-pointer ${
                      currentPage === i
                        ? 'bg-primary text-background-light border-primary'
                        : 'border-primary/10 hover:border-primary text-primary/60'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(allReviewsPage.totalPages - 1, prev + 1))}
                  disabled={allReviewsPage.last}
                  className="w-10 h-10 flex items-center justify-center border border-primary/10 hover:border-primary transition-colors text-primary/40 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
      
      <AddReviewModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose} 
        onSuccess={fetchData}
      />

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
