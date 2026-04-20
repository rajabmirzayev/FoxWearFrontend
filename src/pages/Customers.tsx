import React, { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import { User, UserAdminPage, UserAdminFilter } from '../types';
import Modal from '../components/Modal';

export default function Customers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<UserAdminPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [roleUpdateModal, setRoleUpdateModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    oldRole: string;
    newRole: string;
  }>({
    isOpen: false,
    userId: null,
    oldRole: '',
    newRole: '',
  });
  const [filterOptions, setFilterOptions] = useState<{
    genders: string[];
    roles: string[];
    statuses: string[];
  }>({
    genders: [],
    roles: [],
    statuses: [],
  });

  const [filters, setFilters] = useState<UserAdminFilter>({
    page: 0,
    size: 10,
    sortBy: 'updatedAt',
    direction: 'DESC',
    genders: [],
    roles: [],
    statuses: [],
    searchKeyword: '',
    isEmailVerified: undefined,
    isPhoneNumberVerified: undefined,
    twoFactorEnabled: undefined,
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanFilters: any = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length > 0) cleanFilters[key] = value;
        } else if (value !== undefined && value !== null && value !== '') {
          cleanFilters[key] = value;
        }
      });

      const response = await userApi.getAllAdmin(cleanFilters);
      if (response.data.success) {
        setUsers(response.data.data.content);
        setPageInfo(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch customers');
      }
    } catch (err: any) {
      console.error('Error fetching customers', err);
      setError(err.response?.data?.message || 'An error occurred while fetching customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchKeyword: searchTerm, page: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [gendersRes, rolesRes, statusesRes] = await Promise.all([
          userApi.getUserGenders(),
          userApi.getUserRoles(),
          userApi.getUserStatuses(),
        ]);

        setFilterOptions({
          genders: gendersRes.data.success ? gendersRes.data.data : [],
          roles: rolesRes.data.success ? rolesRes.data.data : [],
          statuses: statusesRes.data.success ? statusesRes.data.data : [],
        });
      } catch (err) {
        console.error('Error fetching filter options', err);
      }
    };
    fetchOptions();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'searchKeyword') {
      setSearchTerm(value);
      return;
    }

    let filterValue: any = value;
    
    if (name === 'genders' || name === 'roles' || name === 'statuses') {
      filterValue = value === '' ? [] : [value];
    } else if (name === 'isEmailVerified' || name === 'isPhoneNumberVerified' || name === 'twoFactorEnabled') {
      filterValue = value === '' ? undefined : value === 'true';
    }

    setFilters(prev => ({
      ...prev,
      [name]: filterValue,
      page: 0
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleUpdateRole = async (userId: number, oldRole: string, newRole: string) => {
    if (oldRole === newRole) return;
    setRoleUpdateModal({
      isOpen: true,
      userId,
      oldRole,
      newRole,
    });
  };

  const confirmRoleUpdate = async () => {
    const { userId, newRole } = roleUpdateModal;
    if (!userId) return;
    
    try {
      const response = await userApi.updateRoleAdmin(userId, newRole);
      if (response.data.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        setError(response.data.message || 'Failed to update role');
      }
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.response?.data?.message || 'An error occurred while updating role.');
    } finally {
      setRoleUpdateModal(prev => ({ ...prev, isOpen: false, userId: null }));
    }
  };

  const handleOpenDetails = async (user: User) => {
    try {
      // Step 1: Open modal and start loading state
      setIsDetailsModalOpen(true);
      setLoadingDetails(true);
      setSelectedUser(null); // Clear previous user to ensure we only show the API result

      // Step 2: Fetch full details from the admin API immediately
      const response = await userApi.getUserAdminById(user.id);
      
      if (response.data.success && response.data.data) {
        // Step 3: Populate with the response data
        setSelectedUser(response.data.data);
      } else {
        // Fallback to minimal data if API fails but returns success:false
        setSelectedUser(user);
        setError(response.data.message || 'Could not fetch full details');
      }
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || 'Connection error while fetching user details.');
      // Show whatever we have from the list as a fallback
      setSelectedUser(user);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    // Clearing data after animation
    setTimeout(() => {
      setSelectedUser(null);
    }, 400);
  };

  return (
    <div className="p-8 space-y-8 custom-scrollbar overflow-y-auto h-full">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Customer Management</h2>
          <p className="text-primary/60 mt-1">Monitor and manage user accounts and permissions</p>
        </div>
      </div>

      {/* Filters System */}
      <div className="bg-background-light border border-border-subtle rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search Bar */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">search</span>
              <input 
                name="searchKeyword"
                value={searchTerm}
                onChange={handleFilterChange}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-subtle bg-background-soft focus:outline-none focus:border-primary text-sm transition-all placeholder:text-primary/40 text-primary" 
                placeholder="Search by name, email, phone or username..." 
                type="text"
              />
            </div>
          </div>
          
          <select 
            name="genders"
            onChange={handleFilterChange}
            className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
          >
            <option value="">Gender: All</option>
            {filterOptions.genders.map(gender => (
              <option key={gender} value={gender}>{gender.charAt(0) + gender.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <select 
            name="roles"
            onChange={handleFilterChange}
            className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
          >
            <option value="">Role: All</option>
            {filterOptions.roles.map(role => (
              <option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <select 
            name="statuses"
            onChange={handleFilterChange}
            className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
          >
            <option value="">Status: All</option>
            {filterOptions.statuses.map(status => (
              <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <select 
            name="isEmailVerified"
            onChange={handleFilterChange}
            className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
          >
            <option value="">Email Verified: All</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-border-subtle gap-4">
          <div className="flex items-center gap-4">
            <select 
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="bg-transparent text-sm font-medium text-primary border-none focus:outline-none cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0_center] bg-[size:1.2em_1.2em] bg-no-repeat"
            >
              <option value="updatedAt">Sort by: Last Updated</option>
              <option value="createdAt">Sort by: Registration Date</option>
              <option value="firstName">Sort by: First Name</option>
              <option value="lastName">Sort by: Last Name</option>
              <option value="username">Sort by: Username</option>
              <option value="birthDate">Sort by: Birth Date</option>
            </select>
            <button 
              onClick={() => setFilters(prev => ({ ...prev, direction: prev.direction === 'ASC' ? 'DESC' : 'ASC', page: 0 }))}
              className="p-1 hover:bg-primary/5 rounded text-primary/60 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">
                {filters.direction === 'ASC' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-primary/60">
            <span className="flex items-center gap-2">
              Show:
              <select 
                name="size"
                value={filters.size}
                onChange={handleFilterChange}
                className="bg-transparent border-none p-0 text-primary font-bold focus:outline-none cursor-pointer appearance-none pr-4 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0_center] bg-[size:1em_1em] bg-no-repeat"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-background-light border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background-soft border-b border-border-subtle sticky top-0 z-10">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">User</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Contact Info</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Role</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/10"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-primary/10 rounded"></div>
                          <div className="h-3 w-20 bg-primary/5 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-primary/5 rounded"></div>
                        <div className="h-3 w-28 bg-primary/5 rounded"></div>
                      </div>
                    </td>
                    <td className="px-8 py-4"><div className="h-6 w-16 bg-primary/5 rounded-full"></div></td>
                    <td className="px-8 py-4"><div className="h-6 w-16 bg-primary/5 rounded-full"></div></td>
                    <td className="px-8 py-4 text-right"><div className="ml-auto size-8 bg-primary/5 rounded"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-primary/40">
                    <span className="material-symbols-outlined text-4xl p-6 bg-primary/5 rounded-full mb-4 inline-block">person_off</span>
                    <p className="text-xs font-bold uppercase tracking-widest">No customers found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-background-soft transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full overflow-hidden bg-primary/10 border border-primary/5">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                              {user.firstName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">{user.firstName} {user.lastName}</span>
                          <span className="text-[10px] text-primary/40 uppercase tracking-widest font-black">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-primary/80">
                          <span className={`material-symbols-outlined text-base ${(user.isEmailVerified || user.emailVerified) ? 'text-emerald-500' : 'text-primary/20'}`}>mail</span>
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-primary/80">
                          <span className={`material-symbols-outlined text-base ${(user.isPhoneNumberVerified || user.phoneNumberVerified) ? 'text-emerald-500' : 'text-primary/20'}`}>call</span>
                          {user.phoneNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        user.status === 'BANNED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        'bg-primary/10 text-primary/40 border-primary/20'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <select 
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, user.role, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-4 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0_center] bg-[size:1em_1em] bg-no-repeat ${user.role === 'ADMIN' ? 'text-primary' : 'text-primary/40'}`}
                      >
                        {filterOptions.roles.length > 0 ? (
                          filterOptions.roles.map(role => (
                            <option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</option>
                          ))
                        ) : (
                          <option value={user.role}>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</option>
                        )}
                      </select>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(user);
                          }}
                          className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors cursor-pointer relative z-20 flex items-center justify-center group/btn"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-xl group-hover/btn:scale-110 transition-transform">visibility</span>
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
        {pageInfo && (
          <div className="p-6 border-t border-border-subtle flex items-center justify-between">
            <p className="text-xs font-bold text-primary/40 uppercase tracking-widest">
              Showing {users.length} of {pageInfo.totalElements} Users
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(filters.page! - 1)}
                disabled={pageInfo.first}
                className="rounded-lg border border-primary/10 hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center p-0"
              >
                <span className="material-symbols-outlined p-2">chevron_left</span>
              </button>
              
              <div className="flex gap-1">
                {[...Array(pageInfo.totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${filters.page === i ? 'bg-primary text-white' : 'hover:bg-primary/5 text-primary'}`}
                  >
                    {i + 1}
                  </button>
                )).slice(Math.max(0, (filters.page || 0) - 2), Math.min(pageInfo.totalPages, (filters.page || 0) + 3))}
              </div>

              <button 
                onClick={() => handlePageChange(filters.page! + 1)}
                disabled={pageInfo.last}
                className="rounded-lg border border-primary/10 hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center p-0"
              >
                <span className="material-symbols-outlined p-2">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        onConfirm={handleCloseDetails}
        title="User Details"
        confirmLabel="Close"
        cancelLabel=""
        type="info"
      >
        {loadingDetails ? (
          <div className="space-y-6 py-4 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="size-20 rounded-full bg-primary/10"></div>
              <div className="space-y-3">
                <div className="h-7 w-48 bg-primary/10 rounded-lg"></div>
                <div className="h-3 w-24 bg-primary/5 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-primary/5 rounded-full"></div>
                  <div className="h-5 w-12 bg-primary/5 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-3 w-32 bg-primary/10 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-3 w-24 bg-primary/5 rounded"></div>
                      <div className="size-5 bg-primary/5 rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 w-24 bg-primary/10 rounded mb-4"></div>
                <div className="space-y-3">
                  <div>
                    <div className="h-2 w-12 bg-primary/5 rounded mb-2"></div>
                    <div className="h-4 w-20 bg-primary/5 rounded"></div>
                  </div>
                  <div>
                    <div className="h-2 w-16 bg-primary/5 rounded mb-2"></div>
                    <div className="h-4 w-28 bg-primary/5 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedUser ? (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-6">
              <div className="size-20 rounded-full overflow-hidden bg-primary/10 border border-primary/5">
                {selectedUser.profilePicture ? (
                  <img src={selectedUser.profilePicture} alt={selectedUser.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-3xl font-black">
                    {selectedUser.firstName?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-black text-primary">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <p className="text-primary/40 text-xs font-bold uppercase tracking-widest">@{selectedUser.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    selectedUser.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {selectedUser.status}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">{selectedUser.role}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 border-b border-primary/5 pb-2">Account Verification</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary/60">Email Verified</span>
                    <span className={`material-symbols-outlined text-lg ${(selectedUser.isEmailVerified || selectedUser.emailVerified) ? 'text-emerald-500' : 'text-red-500'}`}>
                      {(selectedUser.isEmailVerified || selectedUser.emailVerified) ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary/60">Phone Verified</span>
                    <span className={`material-symbols-outlined text-lg ${(selectedUser.isPhoneNumberVerified || selectedUser.phoneNumberVerified) ? 'text-emerald-500' : 'text-red-500'}`}>
                      {(selectedUser.isPhoneNumberVerified || selectedUser.phoneNumberVerified) ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary/60">2FA Enabled</span>
                    <span className={`material-symbols-outlined text-lg ${selectedUser.twoFactorEnabled ? 'text-emerald-500' : 'text-primary/20'}`}>
                      {selectedUser.twoFactorEnabled ? 'verified_user' : 'security'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 border-b border-primary/5 pb-2">General Info</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] text-primary/40 uppercase">Gender</p>
                    <p className="text-sm font-bold text-primary capitalize">{selectedUser.gender?.toLowerCase() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-primary/40 uppercase">Birth Date</p>
                    <p className="text-sm font-bold text-primary">{selectedUser.birthDate || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-primary/40">
            <span className="material-symbols-outlined text-4xl block mb-2">person_off</span>
            User data unavailable
          </div>
        )}
      </Modal>

      {/* Role Update Confirmation Modal */}
      <Modal
        isOpen={roleUpdateModal.isOpen}
        onClose={() => setRoleUpdateModal(prev => ({ ...prev, isOpen: false, userId: null }))}
        onConfirm={confirmRoleUpdate}
        title="Confirm Role Change"
        message={`Are you sure you want to change the user's role from ${roleUpdateModal.oldRole} to ${roleUpdateModal.newRole}?`}
        confirmLabel="Confirm Change"
        cancelLabel="Discard"
        type="warning"
      />
    </div>
  );
}
