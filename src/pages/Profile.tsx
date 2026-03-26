import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api, { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserProfile, ApiResponse } from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const calendarRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initialUsername, setInitialUsername] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Username Check State
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    gender: 'UNKNOWN',
    profilePicture: ''
  });

  const formatPhoneNumber = (value: string) => {
    if (!value) return '';
    
    // Allow deleting the prefix
    if ("+994 ".startsWith(value)) {
      return value;
    }

    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';

    let finalDigits = digits;
    // If user starts typing something that is not the prefix, prepend it
    if (!digits.startsWith('994')) {
      finalDigits = '994' + digits;
    }
    
    let formatted = '+994';
    const rest = finalDigits.slice(3);
    
    if (rest.length > 0) {
      formatted += ' ' + rest.substring(0, 2);
    }
    if (rest.length > 2) {
      formatted += ' ' + rest.substring(2, 5);
    }
    if (rest.length > 5) {
      formatted += ' ' + rest.substring(5, 7);
    }
    if (rest.length > 7) {
      formatted += ' ' + rest.substring(7, 9);
    }
    
    return formatted;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        if (response.data.success && response.data.data) {
          const profile = response.data.data;
          setInitialUsername(profile.username || '');
          
          let birthDate = profile.birthDate || '';
          // If date is in YYYY-MM-DD format, convert to dd-MM-yyyy
          if (birthDate.includes('-') && birthDate.split('-')[0].length === 4) {
            const [y, m, d] = birthDate.split('-');
            birthDate = `${d}-${m}-${y}`;
            setSelectedDate(new Date(Number(y), Number(m) - 1, Number(d)));
          } else if (birthDate.includes('-')) {
            const [d, m, y] = birthDate.split('-');
            setSelectedDate(new Date(Number(y), Number(m) - 1, Number(d)));
          }

          setFormData({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            username: profile.username || '',
            email: profile.email || '',
            phoneNumber: formatPhoneNumber(profile.phoneNumber || ''),
            birthDate: birthDate,
            gender: profile.gender || 'UNKNOWN',
            profilePicture: profile.profilePicture || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!formData.username || formData.username.length < 3 || formData.username === initialUsername) {
      setUsernameStatus('idle');
      setUsernameMessage(null);
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const response = await userApi.checkUsernameExists(formData.username);
        if (response.data.success) {
          const exists = response.data.data;
          if (exists) {
            setUsernameStatus('taken');
            setUsernameMessage('This username is already taken');
          } else {
            setUsernameStatus('available');
            setUsernameMessage('Username is available');
          }
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameStatus('idle');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.username, initialUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image cannot be larger than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await api.post<ApiResponse<string>>('/api/v1/files/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, profilePicture: response.data.data }));
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error', err);
      setError('An error occurred during upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    
    setFormData(prev => ({ ...prev, birthDate: formattedDate }));
    setShowCalendar(false);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const changeYear = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
  };

  const renderCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isSelected = selectedDate && 
        selectedDate.getDate() === d && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;
      
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] transition-all
            ${isSelected ? 'bg-primary text-white font-bold' : 'hover:bg-primary/10 text-primary'}
            ${isToday && !isSelected ? 'border border-primary text-primary' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    
    return days;
  };

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 100; y--) {
    years.push(y);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userApi.updateProfile(formData);
      if (response.data.success) {
        setSuccess('Profile updated successfully.');
        setInitialUsername(formData.username);
        refreshProfile();
      } else {
        setError(response.data.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'An error occurred while updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f7f6] dark:bg-stone-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className="sticky top-40 space-y-8">
              <h2 className="font-headline font-black uppercase tracking-widest text-xs text-primary mb-12">Account Settings</h2>
              <ul className="space-y-6">
                <li>
                  <Link className="font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary flex items-center gap-3" to="/profile">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Profile Details
                  </Link>
                </li>
                <li>
                  <Link className="font-headline font-light uppercase tracking-[0.2em] text-[10px] text-stone-400 hover:text-primary transition-colors" to="/orders">My Orders</Link>
                </li>
                <li>
                  <Link className="font-headline font-light uppercase tracking-[0.2em] text-[10px] text-stone-400 hover:text-primary transition-colors" to="/reviews">My Reviews</Link>
                </li>
                <li>
                  <Link className="font-headline font-light uppercase tracking-[0.2em] text-[10px] text-stone-400 hover:text-primary transition-colors" to="/messages">My Messages</Link>
                </li>
                <li>
                  <Link className="font-headline font-light uppercase tracking-[0.2em] text-[10px] text-stone-400 hover:text-primary transition-colors" to="/addresses">My Addresses</Link>
                </li>
                <li>
                  <Link className="font-headline font-light uppercase tracking-[0.2em] text-[10px] text-stone-400 hover:text-primary transition-colors" to="/cards">My Cards</Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* Main Profile Section */}
          <section className="lg:col-span-9">
            <div className="max-w-2xl">
              <header className="mb-16">
                <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">Edit Profile</h1>
                <p className="font-body font-light text-lg text-secondary leading-relaxed">Refine your digital presence within the FOXWEAR atelier.</p>
              </header>

              {/* Profile Picture Section */}
              <div className="relative w-40 h-40 mb-16 group">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-full h-full rounded-full overflow-hidden bg-surface-container relative">
                  <img 
                    alt="User Profile" 
                    className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-50' : 'opacity-100'}`} 
                    src={formData.profilePicture || "https://lh3.googleusercontent.com/aida-public/AB6AXuCupq9D1pKma1VfSehv_vtT3IU5fJGjAfaHPwxeSrhd9yLR_PmZrrt-TKAT8c7IaSBmCy5z12QrMRRumv05rwXZV9mJIl_6bITRdKkctC_sRYgVJG4FIHJk5mDIwcQAUbKMm0xk73d7KvGU56IsgXTEcm9zHovo6RXY1vSdP09VuK9owBFEvMPFHpnI9uu_53n3lJgCzdYfD7WYbVp04TLwMPfKkjSfiTa4IyeqRtnZjR7uQZyeqiXZGJ6U1FQS6BCss3Qac7e9YuNL"}
                    referrerPolicy="no-referrer"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-[2px] cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="bg-surface px-4 py-2 text-[10px] font-headline font-bold uppercase tracking-widest text-primary shadow-sm">
                    {uploading ? 'Uploading...' : 'Edit'}
                  </span>
                </button>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">
                  {success}
                </div>
              )}

              {/* Form Fields */}
              <form className="space-y-12" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  {/* First Name */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">First Name</label>
                    <input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                      maxLength={30} 
                      placeholder="First Name" 
                      type="text"
                      required
                    />
                  </div>
                  {/* Last Name */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Last Name</label>
                    <input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                      maxLength={50} 
                      placeholder="Last Name" 
                      type="text"
                      required
                    />
                  </div>
                  {/* Username */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Username</label>
                    <input 
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full bg-transparent border-0 border-b ${
                        usernameStatus === 'taken' ? 'border-red-500' : 
                        usernameStatus === 'available' ? 'border-green-500' : 
                        'border-outline-variant'
                      } focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white`} 
                      maxLength={255} 
                      minLength={3} 
                      placeholder="Username" 
                      type="text"
                      required
                    />
                    {usernameMessage && (
                      <p className={`text-[10px] font-headline font-bold uppercase tracking-widest mt-1 ${
                        usernameStatus === 'taken' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {usernameStatus === 'checking' ? 'Checking...' : usernameMessage}
                      </p>
                    )}
                  </div>
                  {/* Email */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Email Address</label>
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                      placeholder="Email Address" 
                      type="email"
                      required
                    />
                  </div>
                  {/* Phone Number */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Phone Number</label>
                    <input 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                      maxLength={17} 
                      placeholder="+994 12 345 67 89" 
                      type="tel"
                    />
                  </div>
                  {/* Birth Date */}
                  <div className="space-y-2 group relative" ref={calendarRef}>
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Birth Date</label>
                    <div className="relative">
                      <input 
                        name="birthDate"
                        value={formData.birthDate}
                        onClick={() => setShowCalendar(!showCalendar)}
                        readOnly
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white cursor-pointer" 
                        placeholder="DD-MM-YYYY" 
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none text-sm">calendar_today</span>
                    </div>

                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 z-[60] bg-white dark:bg-stone-900 border border-outline-variant shadow-2xl rounded-xl p-4 w-[280px] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <button 
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                          </button>
                          
                          <div className="flex gap-2">
                            <select 
                              value={viewDate.getMonth()} 
                              onChange={(e) => {
                                const newDate = new Date(viewDate);
                                newDate.setMonth(parseInt(e.target.value));
                                setViewDate(newDate);
                              }}
                              className="bg-transparent font-bold text-[10px] uppercase tracking-widest outline-none cursor-pointer text-primary"
                            >
                              {MONTHS.map((m, i) => (
                                <option key={m} value={i} className="bg-white dark:bg-stone-900">{m}</option>
                              ))}
                            </select>
                            <select 
                              value={viewDate.getFullYear()} 
                              onChange={(e) => changeYear(parseInt(e.target.value))}
                              className="bg-transparent font-bold text-[10px] uppercase tracking-widest outline-none cursor-pointer text-primary"
                            >
                              {years.map(y => (
                                <option key={y} value={y} className="bg-white dark:bg-stone-900">{y}</option>
                              ))}
                            </select>
                          </div>

                          <button 
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-[8px] uppercase font-bold text-primary/40 text-center">{d}</div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {renderCalendarDays()}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Gender Selection */}
                  <div className="md:col-span-2 space-y-4 pt-4">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 transition-colors">Gender Identity</label>
                    <div className="flex flex-wrap gap-8">
                      {[
                        { label: 'Male', value: 'MALE' },
                        { label: 'Female', value: 'FEMALE' },
                        { label: 'Preferred Not say', value: 'UNKNOWN' }
                      ].map((g) => (
                        <label key={g.value} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            className="w-4 h-4 text-primary border-outline-variant focus:ring-primary/20 accent-primary cursor-pointer" 
                            name="gender" 
                            type="radio" 
                            value={g.value}
                            checked={formData.gender === g.value}
                            onChange={() => setFormData(prev => ({ ...prev, gender: g.value }))}
                          />
                          <span className="font-headline font-light uppercase tracking-widest text-[10px] text-secondary group-hover:text-primary transition-colors">
                            {g.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-8 pt-12">
                  <button 
                    className="w-full sm:w-auto px-12 py-5 bg-primary text-white font-headline font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 cursor-pointer" 
                    type="submit"
                    disabled={saving || uploading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    className="w-full sm:w-auto px-12 py-5 border border-outline-variant font-headline font-light uppercase tracking-[0.3em] text-[10px] text-primary hover:bg-surface-container transition-colors dark:text-white dark:hover:bg-stone-800 cursor-pointer" 
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
