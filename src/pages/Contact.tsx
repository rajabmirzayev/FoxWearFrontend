import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { Instagram, Music2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { contactApi } from '../services/api';

export default function Contact() {
  const { userProfile, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: 'Order Inquiry',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        email: userProfile.email
      }));
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setStatus({ type: 'error', message: 'Please log in to send a message.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await contactApi.sendMessage({
        userId: userProfile!.id,
        ...formData
      });

      if (response.data.success) {
        setStatus({ type: 'success', message: 'Your message has been sent successfully. We will get back to you soon.' });
        setFormData(prev => ({ ...prev, message: '' }));
      } else {
        setStatus({ type: 'error', message: response.data.message || 'Failed to send message.' });
      }
    } catch (error) {
      console.error('Contact error:', error);
      setStatus({ type: 'error', message: 'An error occurred while sending your message. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-primary transition-colors duration-300 min-h-screen flex flex-col pt-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 flex-grow">
        {/* Hero Section */}
        <div className="mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-light tracking-tight mb-6"
          >
            Let's Connect.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-primary/70 max-w-2xl leading-relaxed"
          >
            Whether you have a question about our collections, need styling advice, or simply want to share your experience, our concierge team is here to assist you with the same care we put into our garments.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          {/* Contact Form Section */}
          <section className="space-y-12">
            <div className="bg-white dark:bg-background-soft p-8 md:p-12 rounded-xl shadow-sm border border-primary/5">
              <form className="space-y-8" onSubmit={handleSubmit}>
                {status.type && (
                  <div className={`p-4 rounded-lg text-sm font-medium ${
                    status.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30' 
                      : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30'
                  }`}>
                    {status.message}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold text-primary/60">Full Name</label>
                    <input 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary outline-none py-3 transition-colors text-primary placeholder:text-primary/30" 
                      placeholder="John Doe" 
                      type="text"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-semibold text-primary/60">Email Address</label>
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary outline-none py-3 transition-colors text-primary placeholder:text-primary/30" 
                      placeholder="john@example.com" 
                      type="email"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 relative">
                  <label className="text-xs uppercase tracking-widest font-semibold text-primary/60">Subject</label>
                  <div className="relative">
                    <select 
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary outline-none py-3 transition-colors text-primary cursor-pointer appearance-none"
                    >
                      <option className="bg-white dark:bg-background-soft" value="Order Inquiry">Order Inquiry</option>
                      <option className="bg-white dark:bg-background-soft" value="Product Feedback">Product Feedback</option>
                      <option className="bg-white dark:bg-background-soft" value="Wholesale Opportunities">Wholesale Opportunities</option>
                      <option className="bg-white dark:bg-background-soft" value="Other">Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">expand_more</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-semibold text-primary/60">Message</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-transparent border-0 border-b border-primary/20 focus:ring-0 focus:border-primary outline-none py-3 transition-colors text-primary placeholder:text-primary/30 resize-none" 
                    placeholder="How can we help you?" 
                    rows={4}
                    required
                  ></textarea>
                </div>
                <button 
                  className={`w-full bg-primary text-background-light py-5 px-10 rounded-lg transition-all font-medium uppercase tracking-widest text-sm flex items-center justify-center gap-2 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`} 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                  <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'arrow_forward'}</span>
                </button>
              </form>
            </div>
            
            {/* Social Links */}
            <div className="pt-8 border-t border-primary/10">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold mb-6 text-primary/50">Follow Our Journey</h3>
              <div className="flex gap-6">
                <a className="flex items-center gap-2 text-primary hover:opacity-60 transition-colors" href="https://www.instagram.com/foxwear.az/" target="_blank" rel="noopener noreferrer">
                  <Instagram size={20} />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
                <a className="flex items-center gap-2 text-primary hover:opacity-60 transition-colors" href="https://www.tiktok.com/@foxwear.az" target="_blank" rel="noopener noreferrer">
                  <Music2 size={20} />
                  <span className="text-sm font-medium">TikTok</span>
                </a>
              </div>
            </div>
          </section>

          {/* Store Information & Map Section */}
          <aside className="space-y-16">
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                </div>
                <h4 className="font-bold uppercase tracking-widest text-sm text-primary">Flagship Store</h4>
                <address className="not-italic text-primary/70 leading-relaxed text-sm">
                  74 Minimalist Way, Suite 100<br/>
                  Design District, CA 90210<br/>
                  United States
                </address>
              </div>
              <div className="space-y-4">
                <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                </div>
                <h4 className="font-bold uppercase tracking-widest text-sm text-primary">Opening Hours</h4>
                <ul className="text-primary/70 text-sm space-y-1">
                  <li>Mon — Fri: 10:00 — 19:00</li>
                  <li>Saturday: 11:00 — 18:00</li>
                  <li>Sunday: 12:00 — 17:00</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">call</span>
                </div>
                <h4 className="font-bold uppercase tracking-widest text-sm text-primary">Contact Details</h4>
                <p className="text-primary/70 text-sm">
                  T: +1 (555) 234-5678<br/>
                  E: concierge@foxwear.com
                </p>
              </div>
              <div className="space-y-4">
                <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">language</span>
                </div>
                <h4 className="font-bold uppercase tracking-widest text-sm text-primary">Press & Wholesale</h4>
                <p className="text-primary/70 text-sm">
                  E: press@foxwear.com<br/>
                  E: sales@foxwear.com
                </p>
              </div>
            </div>

            {/* Integrated Map */}
            <div className="relative w-full aspect-square md:aspect-video rounded-xl overflow-hidden shadow-lg group">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d795.7891317220459!2d49.83314212512764!3d40.37760115581297!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1str!2saz!4v1776402220726!5m2!1str!2saz" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-700"
              ></iframe>
              <div className="absolute bottom-6 left-6 bg-white dark:bg-background-dark p-4 rounded shadow-xl z-20 flex items-center gap-3">
                <div className="size-3 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">FoxWear Flagship</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
