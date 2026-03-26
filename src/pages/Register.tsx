import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, userApi, API_BASE_URL } from '../services/api';
import { RegisterRequest } from '../types';
import { useTheme } from '../context/ThemeContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Register() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<RegisterRequest>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    gender: 'UNKNOWN',
    password: '',
    confirmPassword: '',
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Username Check State
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
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
  }, [formData.username]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Always keep +994
    if (!value.startsWith('+994')) return '+994 ';
    
    // Get only digits after +994
    const digits = value.slice(4).replace(/\D/g, '');
    
    let formatted = '+994';
    
    if (digits.length === 0) return '+994 ';
    
    if (digits.length > 0) {
      formatted += ' ' + digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += ' ' + digits.substring(2, 5);
    }
    if (digits.length > 5) {
      formatted += ' ' + digits.substring(5, 7);
    }
    if (digits.length > 7) {
      formatted += ' ' + digits.substring(7, 9);
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }
    
    // Days of current month
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
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all
            ${isSelected ? 'bg-primary text-white font-bold' : 'hover:bg-primary/10 text-slate-700 dark:text-slate-300'}
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
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.register(formData);
      if (response.data.success) {
        setIsSuccess(true);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-[#f9f7f2] font-body text-[#49352c] antialiased min-h-screen">
        <header className="fixed top-0 w-full z-50 bg-[#f9f7f2]/80 backdrop-blur-md flex justify-between items-center px-8 md:px-12 py-8">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/icon-black.png" 
              alt="FoxWear Logo" 
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-2xl font-black tracking-tighter text-[#49352c] uppercase">
              FOXWEAR
            </div>
          </div>
          <div></div>
        </header>
        <main className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12">
          <div className="max-w-xl w-full text-center">
            <div className="mb-12 flex justify-center">
              <div className="w-16 h-16 rounded-full border border-[#49352c]/10 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-3xl text-[#49352c]" style={{ fontVariationSettings: "'wght' 200" }}>mail</span>
                <div className="absolute -top-1 -right-1 bg-[#49352c] text-white w-5 h-5 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
              </div>
            </div>
            <h1 className="font-headline font-black text-3xl md:text-5xl tracking-tight-display uppercase text-[#49352c] mb-8 leading-tight">
              Registration<br />Successful
            </h1>
            <p className="font-body font-light text-[#49352c]/70 leading-relaxed text-sm md:text-base mb-12 max-w-sm mx-auto">
              Thank you for joining our signature series. To access your exclusive collections and complete your account setup, please verify your email address via the link we've sent to your inbox.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <button className="bg-[#49352c] text-white font-label text-[11px] tracking-editorial py-4 px-8 uppercase transition-all duration-300 hover:opacity-90 active:scale-[0.98]">
                Check My Inbox
              </button>
              <button 
                onClick={() => navigate('/')}
                className="border border-[#49352c]/20 text-[#49352c] font-label text-[11px] tracking-editorial py-4 px-8 uppercase transition-all duration-300 hover:bg-[#49352c]/5"
              >
                Go to Homepage
              </button>
            </div>
            <div className="mt-16">
              <p className="font-body font-light text-xs text-[#49352c]/40 italic mb-3">Didn't receive the email?</p>
              <a className="group relative inline-block font-label text-[10px] tracking-editorial uppercase text-[#49352c] transition-colors" href="#">
                Resend verification
                <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#49352c]/30 group-hover:bg-[#49352c] transition-colors"></span>
              </a>
            </div>
          </div>
        </main>
        <footer className="fixed bottom-8 w-full flex justify-center pointer-events-none">
          <p className="font-label text-[10px] tracking-[0.4em] uppercase text-[#49352c]/30">FoxWear © 2024 Signature Series</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          {/* Header Navigation */}
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 px-6 lg:px-20 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-3 text-primary">
              <img 
                src={theme === 'light' ? '/src/assets/icon-black.png' : '/src/assets/icon-white.png'} 
                alt="FoxWear Logo" 
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <h2 className="text-xl font-black uppercase tracking-widest">FoxWear</h2>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-medium text-slate-500 hidden md:inline">Already have an account?</span>
              <Link to="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-5 bg-primary text-stone-50 text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 active:scale-95">
                Log In
              </Link>
            </div>
          </header>
          <main className="flex flex-1 justify-center py-12 px-4 md:px-0">
            <div className="layout-content-container flex flex-col max-w-[800px] w-full bg-white dark:bg-background-dark/40 shadow-xl rounded-xl p-8 md:p-12 border border-primary/5">
              {/* Form Title Section */}
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-slate-900 dark:text-slate-100 text-4xl md:text-5xl font-black leading-tight tracking-tight mb-3">Join the FoxWear</h1>
                <p className="text-primary/70 dark:text-slate-400 text-lg font-light max-w-lg">Experience curated luxury. Register now to access our latest collections and private sales.</p>
              </div>
              <form autoComplete="off" onSubmit={handleSubmit} className="flex flex-col gap-8">
                {/* Social Login Section */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center">
                    <button 
                      onClick={() => window.location.href = `${API_BASE_URL}/oauth2/authorization/google`}
                      className="flex items-center justify-center gap-3 h-14 w-full rounded-lg border border-primary/20 bg-white dark:bg-slate-800/50 hover:bg-background-light dark:hover:bg-slate-700 transition-all group cursor-pointer" 
                      type="button"
                    >
                      <svg className="size-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                        <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                      </svg>
                      <span className="text-primary text-sm font-bold uppercase tracking-wider">Continue with Google</span>
                    </button>
                  </div>
                  {/* Separator */}
                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-primary/10"></div>
                    <span className="flex-shrink mx-4 text-primary/30 text-xs font-black tracking-widest uppercase">OR</span>
                    <div className="flex-grow border-t border-primary/10"></div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {/* Row 1: Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">First Name</span>
                    <input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      autoComplete="off"
                      className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 px-4 text-base transition-all outline-none" 
                      maxLength={30} 
                      minLength={3} 
                      placeholder="3-30 characters" 
                      required 
                      type="text"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Last Name</span>
                    <input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      autoComplete="off"
                      className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 px-4 text-base transition-all outline-none" 
                      maxLength={50} 
                      minLength={3} 
                      placeholder="3-50 characters" 
                      required 
                      type="text"
                    />
                  </label>
                </div>
                {/* Row 2: Username & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Username</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">person</span>
                      <input 
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        autoComplete="off"
                        className={`form-input w-full rounded-lg border bg-background-light dark:bg-slate-800/50 h-14 pl-11 pr-12 text-base transition-all outline-none 
                          ${usernameStatus === 'available' ? 'border-green-500 ring-1 ring-green-500/20' : 
                            usernameStatus === 'taken' ? 'border-red-500 ring-1 ring-red-500/20' : 
                            'border-primary/20 focus:border-primary'}`} 
                        maxLength={50} 
                        minLength={3} 
                        placeholder="Your unique handle" 
                        required 
                        type="text"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {usernameStatus === 'checking' && (
                          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                        )}
                        {usernameStatus === 'available' && (
                          <span className="material-symbols-outlined text-green-500 font-bold">check_circle</span>
                        )}
                        {usernameStatus === 'taken' && (
                          <span className="material-symbols-outlined text-red-500 font-bold">cancel</span>
                        )}
                      </div>
                    </div>
                    {usernameMessage && (
                      <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${usernameStatus === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                        {usernameMessage}
                      </span>
                    )}
                  </label>
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Email Address</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">mail</span>
                      <input 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="off"
                        className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 pl-11 pr-4 text-base transition-all outline-none" 
                        placeholder="email@example.com" 
                        required 
                        type="email"
                      />
                    </div>
                  </label>
                </div>
                {/* Row 3: Phone & Birth Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Phone Number</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">call</span>
                      <input 
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        autoComplete="off"
                        className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 pl-11 pr-4 text-base transition-all outline-none" 
                        placeholder="+994 12 345 67 89" 
                        maxLength={17}
                        required 
                        type="tel"
                      />
                    </div>
                    <span className="text-xs text-primary/50 mt-1">Hint: Azerbaijan international format</span>
                  </label>
                  <label className="flex flex-col relative" ref={calendarRef}>
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Birth Date</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">calendar_today</span>
                      <input 
                        name="birthDate"
                        value={formData.birthDate}
                        onClick={() => setShowCalendar(!showCalendar)}
                        readOnly
                        className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 pl-11 pr-4 text-base transition-all outline-none cursor-pointer" 
                        placeholder="Select Date" 
                        required 
                        type="text"
                      />
                    </div>
                    
                    {showCalendar && (
                      <div className="absolute top-full left-0 mt-2 z-[60] bg-white dark:bg-slate-900 border border-primary/10 shadow-2xl rounded-xl p-4 w-[320px] animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <button 
                            type="button"
                            onClick={() => changeMonth(-1)}
                            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined">chevron_left</span>
                          </button>
                          
                          <div className="flex gap-2">
                            <select 
                              value={viewDate.getMonth()} 
                              onChange={(e) => {
                                const newDate = new Date(viewDate);
                                newDate.setMonth(parseInt(e.target.value));
                                setViewDate(newDate);
                              }}
                              className="bg-transparent font-bold text-sm outline-none cursor-pointer"
                            >
                              {MONTHS.map((m, i) => (
                                <option key={m} value={i}>{m}</option>
                              ))}
                            </select>
                            <select 
                              value={viewDate.getFullYear()} 
                              onChange={(e) => changeYear(parseInt(e.target.value))}
                              className="bg-transparent font-bold text-sm outline-none cursor-pointer"
                            >
                              {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>

                          <button 
                            type="button"
                            onClick={() => changeMonth(1)}
                            className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined">chevron_right</span>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-[10px] uppercase font-bold text-primary/40 text-center">{d}</div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {renderCalendarDays()}
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {/* Row 4: Gender Selection */}
                <div className="flex flex-col">
                  <span className="text-primary text-sm font-bold uppercase tracking-wider mb-3">Gender</span>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex-1 min-w-[120px] cursor-pointer group">
                      <input 
                        checked={formData.gender === 'MALE'} 
                        onChange={() => setFormData(prev => ({ ...prev, gender: 'MALE' }))}
                        className="peer hidden" 
                        name="gender" 
                        type="radio" 
                        value="MALE"
                      />
                      <div className="flex items-center justify-center gap-2 h-14 rounded-lg border border-primary/20 bg-background-light peer-checked:bg-primary peer-checked:text-white transition-all group-hover:border-primary/50">
                        <span className="material-symbols-outlined text-xl">male</span>
                        <span className="font-medium">Male</span>
                      </div>
                    </label>
                    <label className="flex-1 min-w-[120px] cursor-pointer group">
                      <input 
                        checked={formData.gender === 'FEMALE'} 
                        onChange={() => setFormData(prev => ({ ...prev, gender: 'FEMALE' }))}
                        className="peer hidden" 
                        name="gender" 
                        type="radio" 
                        value="FEMALE"
                      />
                      <div className="flex items-center justify-center gap-2 h-14 rounded-lg border border-primary/20 bg-background-light peer-checked:bg-primary peer-checked:text-white transition-all group-hover:border-primary/50">
                        <span className="material-symbols-outlined text-xl">female</span>
                        <span className="font-medium">Female</span>
                      </div>
                    </label>
                    <label className="flex-1 min-w-[120px] cursor-pointer group">
                      <input 
                        checked={formData.gender === 'UNKNOWN'} 
                        onChange={() => setFormData(prev => ({ ...prev, gender: 'UNKNOWN' }))}
                        className="peer hidden" 
                        name="gender" 
                        type="radio" 
                        value="UNKNOWN"
                      />
                      <div className="flex items-center justify-center gap-2 h-14 rounded-lg border border-primary/20 bg-background-light peer-checked:bg-primary peer-checked:text-white transition-all group-hover:border-primary/50">
                        <span className="material-symbols-outlined text-xl">person</span>
                        <span className="font-medium">Preferred Not say</span>
                      </div>
                    </label>
                  </div>
                </div>
                {/* Row 5: Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Password</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">lock</span>
                      <input 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 pl-11 pr-4 text-base transition-all outline-none" 
                        placeholder="Enter secure password" 
                        required 
                        type="password"
                      />
                    </div>
                    <p className="text-[10px] text-primary/60 mt-2 uppercase tracking-tight leading-relaxed">Must include 8+ chars, uppercase, lowercase, and a symbol</p>
                  </label>
                  <label className="flex flex-col">
                    <span className="text-primary text-sm font-bold uppercase tracking-wider mb-2">Confirm Password</span>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/40">lock_reset</span>
                      <input 
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        className="form-input w-full rounded-lg border border-primary/20 bg-background-light dark:bg-slate-800/50 h-14 pl-11 pr-4 text-base transition-all outline-none" 
                        placeholder="Repeat password" 
                        required 
                        type="password"
                      />
                    </div>
                  </label>
                </div>
                {/* Terms and Conditions */}
                <div className="flex items-start gap-3 py-2">
                  <input 
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-primary/30 text-primary accent-primary focus:ring-primary cursor-pointer" 
                    id="terms" 
                    type="checkbox"
                  />
                  <label className="text-sm text-slate-500 leading-normal cursor-pointer" htmlFor="terms">
                    I agree to the <a className="text-primary font-bold underline underline-offset-4 hover:opacity-80" href="#">Privacy Policy</a> and <a className="text-primary font-bold underline underline-offset-4 hover:opacity-80" href="#">Terms of Service</a>. FoxWear is committed to protecting your data.
                  </label>
                </div>
                {/* Submit Button */}
                <div className="mt-4">
                  <button 
                    disabled={loading || !termsAccepted || usernameStatus === 'taken' || usernameStatus === 'checking'}
                    className="w-full flex h-16 items-center justify-center rounded-xl bg-primary text-white text-lg font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                    type="submit"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  <p className="text-center text-slate-400 text-xs mt-6 uppercase tracking-widest font-light">Handcrafted Digital Experience • © 2024 FoxWear</p>
                </div>
              </form>
            </div>
          </main>
          {/* Footer Minimal */}
          <footer className="py-10 px-6 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/50 dark:bg-background-dark/20">
            <div className="flex gap-8 text-primary/60 text-xs font-medium uppercase tracking-widest">
              <a className="hover:text-primary transition-colors" href="#">Support</a>
              <a className="hover:text-primary transition-colors" href="#">Store Locator</a>
              <a className="hover:text-primary transition-colors" href="#">Contact</a>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 hover:bg-primary hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">language</span>
              </div>
              <div className="w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center text-primary/60 hover:bg-primary hover:text-white transition-all cursor-pointer">
                <span className="material-symbols-outlined text-sm">share</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
