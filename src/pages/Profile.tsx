import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import api, { userApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserProfile, ApiResponse } from '../types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Profile() {
  const { userProfile, refreshProfile } = useAuth();
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
    profilePicture: '',
    role: ''
  });

  const [verificationStatus, setVerificationStatus] = useState({
    emailVerified: true,
    phoneNumberVerified: true
  });

  // Verification State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

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
            profilePicture: profile.profilePicture || '',
            role: profile.role || ''
          });

          setVerificationStatus({
            emailVerified: profile.emailVerified ?? true,
            phoneNumberVerified: profile.phoneNumberVerified ?? true
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

  const handleVerifyEmail = async () => {
    setVerifying(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await authApi.verifyEmail();
      if (response.data.success) {
        setSuccess('Verification email has been sent. Please check your inbox.');
        setShowVerifyModal(false);
      } else {
        setError(response.data.message || 'Failed to send verification email.');
      }
    } catch (err: any) {
      console.error('Error sending verification email:', err);
      setError(err.response?.data?.message || 'An error occurred while sending verification email.');
    } finally {
      setVerifying(false);
    }
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
      <div className="bg-[#f7f7f6] dark:bg-stone-950 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <AccountSidebar />
            <section className="lg:col-span-9 animate-pulse">
              <div className="max-w-2xl">
                <div className="mb-16 space-y-4">
                  <div className="h-12 w-64 bg-primary/10 rounded-xl"></div>
                  <div className="h-4 w-96 bg-primary/5 rounded"></div>
                </div>
                <div className="size-40 rounded-full bg-primary/5 mb-16"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-20 bg-primary/5 rounded"></div>
                        <div className="h-10 w-full bg-primary/5 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
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
          <AccountSidebar />

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
                <div className="w-full h-full rounded-full overflow-hidden bg-primary/5 relative flex items-center justify-center">
                  {formData.profilePicture ? (
                    <img 
                      alt="User Profile" 
                      className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-50' : 'opacity-100'}`} 
                      src={formData.profilePicture}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-headline font-black text-5xl uppercase tracking-tighter select-none">
                      {formData.firstName?.charAt(0) || formData.username?.charAt(0) || '?'}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background-light/40 backdrop-blur-[1px]">
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
                  <span className="bg-surface px-4 py-2 text-[10px] font-headline font-bold uppercase tracking-widest text-primary dark:text-stone-950 shadow-sm rounded-lg">
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
                    <div className="flex items-center justify-between">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Email Address</label>
                      {!verificationStatus.emailVerified && (
                        <button 
                          type="button" 
                          className="text-[9px] font-headline font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                          onClick={() => setShowVerifyModal(true)}
                        >
                          <span className="material-symbols-outlined text-[12px]">verified_user</span>
                          Verify
                        </button>
                      )}
                    </div>
                    <input 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white ${!verificationStatus.emailVerified ? 'text-red-500 dark:text-red-400' : ''}`} 
                      placeholder="Email Address" 
                      type="email"
                      required
                    />
                  </div>
                  {/* Role */}
                  <div className="space-y-2 group">
                    <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 transition-colors">Account Role</label>
                    <div className="w-full border-0 border-b border-outline-variant px-0 py-3 font-body font-bold text-lg text-primary dark:text-white flex items-center gap-2 select-none">
                       <span className="material-symbols-outlined text-lg text-primary/40">verified</span>
                       <span className="tracking-tighter">{formData.role}</span>
                    </div>
                  </div>
                  {/* Phone Number */}
                  <div className="space-y-2 group">
                    <div className="flex items-center justify-between">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Phone Number</label>
                      {!verificationStatus.phoneNumberVerified && formData.phoneNumber && (
                        <button 
                          type="button" 
                          className="text-[9px] font-headline font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                          onClick={() => setShowPhoneVerifyModal(true)}
                        >
                          <span className="material-symbols-outlined text-[12px]">verified_user</span>
                          Verify
                        </button>
                      )}
                    </div>
                    <input 
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white ${!verificationStatus.phoneNumberVerified && formData.phoneNumber ? 'text-red-500 dark:text-red-400' : ''}`} 
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
                    className="w-full sm:w-auto px-12 py-5 bg-primary text-white dark:text-stone-950 font-headline font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 cursor-pointer rounded-lg" 
                    type="submit"
                    disabled={saving || uploading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    className="w-full sm:w-auto px-12 py-5 border border-outline-variant font-headline font-light uppercase tracking-[0.3em] text-[10px] text-primary hover:bg-surface-container transition-colors dark:text-white dark:hover:bg-stone-800 cursor-pointer rounded-lg" 
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

      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm" onClick={() => !verifying && setShowVerifyModal(false)}></div>
          <div className="relative bg-white dark:bg-stone-900 w-full max-w-md p-10 shadow-2xl animate-in fade-in zoom-in duration-300 rounded-2xl border border-outline-variant">
            <h3 className="font-headline font-black text-2xl uppercase tracking-tighter text-primary mb-4">Verify Email</h3>
            <p className="font-body font-light text-secondary leading-relaxed mb-8">
              We will send a verification link to <span className="font-bold text-primary">{formData.email}</span>. Are you ready to proceed?
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleVerifyEmail}
                disabled={verifying}
                className="flex-1 px-8 py-4 bg-primary text-white dark:text-stone-950 font-headline font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/90 transition-all disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {verifying ? 'Sending...' : 'Yes, Send Link'}
              </button>
              <button
                onClick={() => setShowVerifyModal(false)}
                disabled={verifying}
                className="flex-1 px-8 py-4 border border-outline-variant font-headline font-light uppercase tracking-[0.2em] text-[10px] text-primary hover:bg-surface-container transition-all dark:text-white dark:hover:bg-stone-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
