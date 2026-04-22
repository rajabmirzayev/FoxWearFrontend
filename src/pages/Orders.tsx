import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { Order, OrderAdminPage, OrderAdminFilter } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';

const orderStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  PREPARING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  RETURNED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const paymentStatusStyles: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500',
  PAID: 'bg-emerald-500/10 text-emerald-500',
  FAILED: 'bg-red-500/10 text-red-500',
  REFUNDED: 'bg-gray-500/10 text-gray-500',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<OrderAdminPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<{
    orderStatuses: string[];
    paymentStatuses: string[];
    paymentMethods: string[];
  }>({
    orderStatuses: [],
    paymentStatuses: [],
    paymentMethods: [],
  });
  
  const [filters, setFilters] = useState<OrderAdminFilter>({
    page: 0,
    size: 10,
    sortBy: 'updatedAt',
    direction: 'DESC',
    orderStatuses: [],
    paymentStatuses: [],
    paymentMethods: [],
    searchKeyword: '',
  });

  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    orderId: number | null;
    oldStatus: string;
    newStatus: string;
  }>({
    isOpen: false,
    orderId: null,
    oldStatus: '',
    newStatus: '',
  });

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchOrders = async () => {
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

      const response = await orderApi.getAllAdmin(cleanFilters);
      if (response.data.success) {
        setOrders(response.data.data.content);
        setPageInfo(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch orders');
      }
    } catch (err: any) {
      console.error('Error fetching orders', err);
      setError(err.response?.data?.message || 'An error occurred while fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const [statusRes, paymentRes, methodRes] = await Promise.all([
          orderApi.getOrderStatuses(),
          orderApi.getPaymentStatuses(),
          orderApi.getPaymentMethods(),
        ]);

        setFilterOptions({
          orderStatuses: statusRes.data.success ? statusRes.data.data : [],
          paymentStatuses: paymentRes.data.success ? paymentRes.data.data : [],
          paymentMethods: methodRes.data.success ? methodRes.data.data : [],
        });
      } catch (err) {
        console.error('Error fetching filter options', err);
      } finally {
        setLoadingFilters(false);
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, searchKeyword: searchTerm, page: 0 }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'searchKeyword') {
      setSearchTerm(value);
      return;
    }

    let filterValue: any = value;
    if (name === 'orderStatuses' || name === 'paymentStatuses' || name === 'paymentMethods') {
      filterValue = value === '' ? [] : [value];
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

  const handleStatusChange = (orderId: number, oldStatus: string, newStatus: string) => {
    setStatusUpdateModal({
      isOpen: true,
      orderId,
      oldStatus,
      newStatus,
    });
  };

  const confirmStatusUpdate = async () => {
    const { orderId, newStatus } = statusUpdateModal;
    if (!orderId) return;

    try {
      const response = await orderApi.updateStatus(orderId, newStatus);
      if (response.data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        setError(response.data.message || 'Failed to update order status');
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'An error occurred while updating order status.');
    } finally {
      setStatusUpdateModal(prev => ({ ...prev, isOpen: false, orderId: null }));
    }
  };

  const handleOpenDetails = async (orderId: number) => {
    try {
      setIsDetailsModalOpen(true);
      setLoadingDetails(true);
      setSelectedOrderDetails(null);
      
      const response = await orderApi.getAdminById(orderId);
      if (response.data.success) {
        setSelectedOrderDetails(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch order details');
        setIsDetailsModalOpen(false);
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
      setIsDetailsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="p-8 space-y-8 custom-scrollbar overflow-y-auto h-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Orders Management</h2>
          <p className="text-primary/60 mt-1">Monitor and manage customer transactions.</p>
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
                placeholder="Search by order number, tracking number, name or slug..." 
                type="text"
              />
            </div>
          </div>
          
          {loadingFilters ? (
            <>
              <div className="w-40 h-[46px] bg-background-soft animate-pulse rounded-lg border border-border-subtle"></div>
              <div className="w-40 h-[46px] bg-background-soft animate-pulse rounded-lg border border-border-subtle"></div>
              <div className="w-40 h-[46px] bg-background-soft animate-pulse rounded-lg border border-border-subtle"></div>
            </>
          ) : (
            <>
              <select 
                name="orderStatuses"
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
              >
                <option value="">Order Status: All</option>
                {filterOptions.orderStatuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'PREPARING' ? 'Processing' : status.replace(/_/g, ' ').charAt(0) + status.replace(/_/g, ' ').toLowerCase().slice(1)}
                  </option>
                ))}
              </select>

              <select 
                name="paymentStatuses"
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
              >
                <option value="">Payment Status: All</option>
                {filterOptions.paymentStatuses.map(status => (
                  <option key={status} value={status}>{status.replace(/_/g, ' ').charAt(0) + status.replace(/_/g, ' ').toLowerCase().slice(1)}</option>
                ))}
              </select>

              <select 
                name="paymentMethods"
                onChange={handleFilterChange}
                className="px-4 py-3 rounded-lg border border-border-subtle bg-background-soft text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-[size:1.5em_1.5em] bg-no-repeat text-primary"
              >
                <option value="">Payment Method: All</option>
                {filterOptions.paymentMethods.map(method => (
                  <option key={method} value={method}>{method.replace(/_/g, ' ').charAt(0) + method.replace(/_/g, ' ').toLowerCase().slice(1)}</option>
                ))}
              </select>
            </>
          )}
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
              <option value="createdAt">Sort by: Order Date</option>
              <option value="totalDiscountPrice">Sort by: Total Price</option>
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

      {/* Orders Table */}
      <div className="bg-background-light border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-background-soft border-b border-border-subtle sticky top-0 z-10">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Order Info</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">User ID</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Total Price</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Payment</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-primary uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-8 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-primary/10 rounded"></div>
                        <div className="h-3 w-24 bg-primary/5 rounded"></div>
                      </div>
                    </td>
                    <td className="px-8 py-4"><div className="h-4 w-12 bg-primary/5 rounded"></div></td>
                    <td className="px-8 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-20 bg-primary/10 rounded"></div>
                        <div className="h-3 w-16 bg-primary/5 rounded"></div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-16 bg-primary/10 rounded-full"></div>
                        <div className="h-3 w-20 bg-primary/5 rounded"></div>
                      </div>
                    </td>
                    <td className="px-8 py-4"><div className="h-6 w-24 bg-primary/10 rounded-full"></div></td>
                    <td className="px-8 py-4 text-right"><div className="ml-auto size-8 bg-primary/5 rounded-lg"></div></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-primary/40">
                    <div className="flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl p-6 bg-primary/5 rounded-full mb-2">shopping_bag</span>
                      <p className="text-xs font-bold uppercase tracking-widest">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-background-soft transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{order.orderNumber}</span>
                        <span className="text-[10px] text-primary/40 uppercase tracking-widest font-black flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">call</span>
                          {order.phoneNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-primary/60">#{order.userId}</td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">₼ {order.totalDiscountPrice.toFixed(2)}</span>
                        {order.shippingFee > 0 && (
                          <span className="text-[10px] text-primary/40 uppercase tracking-widest">+ ₼ {order.shippingFee.toFixed(2)} Ship</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${paymentStatusStyles[order.paymentStatus] || 'bg-primary/10 text-primary'}`}>
                          {order.paymentStatus}
                        </span>
                        <span className="text-[10px] text-primary/40 uppercase tracking-widest font-black">{order.paymentMethod.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, order.status, e.target.value)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border focus:outline-none cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20stroke%3D%22%2364748b%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[size:1.2em_1.2em] bg-no-repeat ${orderStatusStyles[order.status] || 'bg-primary/10 text-primary border-primary/20'}`}
                      >
                        {filterOptions.orderStatuses.map(status => (
                          <option key={status} value={status} className="bg-white dark:bg-stone-900 text-primary font-bold">
                            {status === 'PREPARING' ? 'PROCESSING' : status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenDetails(order.id)}
                          className="size-9 flex items-center justify-center hover:bg-primary/10 rounded-lg text-primary transition-colors cursor-pointer" 
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-xl p-2">visibility</span>
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
            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">
              Showing {orders.length} of {pageInfo.totalElements} Orders
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(filters.page! - 1)}
                disabled={pageInfo.first}
                className="rounded-lg border border-primary/10 hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center p-2 cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex gap-1">
                {[...Array(pageInfo.totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`w-9 h-9 rounded-lg font-bold text-xs transition-all cursor-pointer ${filters.page === i ? 'bg-primary text-white dark:text-stone-900' : 'hover:bg-primary/5 text-primary'}`}
                  >
                    {i + 1}
                  </button>
                )).slice(Math.max(0, (filters.page || 0) - 2), Math.min(pageInfo.totalPages, (filters.page || 0) + 3))}
              </div>

              <button 
                onClick={() => handlePageChange(filters.page! + 1)}
                disabled={pageInfo.last}
                className="rounded-lg border border-primary/10 hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center p-2 cursor-pointer"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={statusUpdateModal.isOpen}
        onClose={() => setStatusUpdateModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmStatusUpdate}
        title="Update Order Status"
        message={`Are you sure you want to change the status of this order from ${statusUpdateModal.oldStatus === 'PREPARING' ? 'PROCESSING' : statusUpdateModal.oldStatus} to ${statusUpdateModal.newStatus === 'PREPARING' ? 'PROCESSING' : statusUpdateModal.newStatus}?`}
        confirmLabel="Update Status"
        cancelLabel="Cancel"
        type="warning"
      />

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-background-light dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-primary/10 flex justify-between items-center bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-primary rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">receipt_long</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary tracking-tight uppercase">Order Details</h3>
                    {selectedOrderDetails && (
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">{selectedOrderDetails.orderNumber}</p>
                        <span className="size-1 bg-primary/20 rounded-full"></span>
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
                          {new Date(selectedOrderDetails.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="size-10 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all cursor-pointer group"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {loadingDetails ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="h-4 w-32 bg-primary/10 rounded"></div>
                        <div className="h-24 w-full bg-primary/5 rounded-2xl"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-32 bg-primary/10 rounded"></div>
                        <div className="h-24 w-full bg-primary/5 rounded-2xl"></div>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4">
                      <div className="h-4 w-48 bg-primary/10 rounded"></div>
                      <div className="h-64 w-full bg-primary/5 rounded-2xl"></div>
                    </div>
                  </div>
                ) : selectedOrderDetails ? (
                  <div className="space-y-10">
                    {/* Status Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.2em] mb-1">Status</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${orderStatusStyles[selectedOrderDetails.status]}`}>
                          {selectedOrderDetails.status === 'PREPARING' ? 'PROCESSING' : selectedOrderDetails.status}
                        </span>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-border-subtle">
                        <p className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.2em] mb-1">Payment</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${paymentStatusStyles[selectedOrderDetails.paymentStatus]}`}>
                          {selectedOrderDetails.paymentStatus}
                        </span>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-border-subtle">
                        <p className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.2em] mb-1">Method</p>
                        <p className="text-[11px] font-black text-primary uppercase tracking-widest">{selectedOrderDetails.paymentMethod.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="p-4 bg-primary/5 rounded-2xl border border-border-subtle">
                        <p className="text-[9px] font-bold text-primary/40 uppercase tracking-[0.2em] mb-1">Total</p>
                        <p className="text-sm font-black text-primary tracking-tight">₼{selectedOrderDetails.totalDiscountPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* Shipping Info */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">local_shipping</span>
                          Shipping Info
                        </h4>
                        <div className="space-y-4 text-sm">
                          <div className="p-5 bg-background-soft rounded-2xl border border-border-subtle hover:border-primary/20 transition-all">
                            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">Delivery Address</p>
                            <p className="text-primary font-medium leading-relaxed">{selectedOrderDetails.addressSnapshot}</p>
                            <p className="mt-3 pt-3 border-t border-primary/5 text-[10px] font-bold text-primary/50 uppercase tracking-widest flex items-center gap-2">
                              <span className="material-symbols-outlined text-xs">call</span>
                              {selectedOrderDetails.phoneNumber}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Tracking #</p>
                              <p className="text-[11px] font-black text-primary uppercase">{selectedOrderDetails.trackingNumber || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Est. Delivery</p>
                              <p className="text-[11px] font-black text-primary uppercase">
                                {selectedOrderDetails.estimatedDeliveryDate ? new Date(selectedOrderDetails.estimatedDeliveryDate).toLocaleDateString() : 'TBD'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline / Additional Notes */}
                      <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">event_note</span>
                          Order Timeline
                        </h4>
                        <div className="space-y-4">
                          <div className="p-5 border-l-2 border-primary/10 space-y-4">
                            <div className="relative pl-4">
                              <div className="absolute left-[-1.1rem] top-1 size-2 bg-primary rounded-full"></div>
                              <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Order Placed</p>
                              <p className="text-[10px] font-bold text-primary">{new Date(selectedOrderDetails.createdAt).toLocaleString()}</p>
                            </div>
                            {selectedOrderDetails.preparedAt && (
                              <div className="relative pl-4">
                                <div className="absolute left-[-1.1rem] top-1 size-2 bg-blue-500 rounded-full"></div>
                                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Prepared At</p>
                                <p className="text-[10px] font-bold text-primary">{new Date(selectedOrderDetails.preparedAt).toLocaleString()}</p>
                              </div>
                            )}
                            {selectedOrderDetails.pickedUpAt && (
                              <div className="relative pl-4">
                                <div className="absolute left-[-1.1rem] top-1 size-2 bg-indigo-500 rounded-full"></div>
                                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Picked Up</p>
                                <p className="text-[10px] font-bold text-primary">{new Date(selectedOrderDetails.pickedUpAt).toLocaleString()}</p>
                              </div>
                            )}
                            {selectedOrderDetails.deliveredAt && (
                              <div className="relative pl-4">
                                <div className="absolute left-[-1.1rem] top-1 size-2 bg-emerald-500 rounded-full"></div>
                                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Delivered</p>
                                <p className="text-[10px] font-bold text-primary">{new Date(selectedOrderDetails.deliveredAt).toLocaleString()}</p>
                              </div>
                            )}
                            {!selectedOrderDetails.preparedAt && !selectedOrderDetails.pickedUpAt && !selectedOrderDetails.deliveredAt && (
                              <p className="text-[10px] text-primary/40 uppercase tracking-widest italic font-medium">No timeline updates yet</p>
                            )}
                          </div>

                          {selectedOrderDetails.orderNote && (
                            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">notes</span> Order Note
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium italic">{selectedOrderDetails.orderNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">inventory_2</span>
                        Ordered Items ({selectedOrderDetails.items.length})
                      </h4>
                      <div className="bg-background-soft border border-border-subtle rounded-2xl overflow-hidden divide-y divide-primary/5">
                        {selectedOrderDetails.items.map((item: any) => (
                          <Link 
                            key={item.id} 
                            to={`/product/${item.slug}`} 
                            target="_blank"
                            className="p-4 flex items-center gap-4 hover:bg-primary/5 transition-colors group cursor-pointer decoration-none"
                          >
                            <div className="size-16 rounded-xl overflow-hidden shrink-0 border border-border-subtle group-hover:border-primary/20 transition-all">
                              <img 
                                src={item.imageUrl} 
                                alt={item.productName} 
                                className="size-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h5 className="text-[11px] font-black text-primary uppercase tracking-widest truncate group-hover:text-primary-light">{item.productName}</h5>
                                <p className="text-[11px] font-black text-primary shrink-0 ml-4">₼{item.subTotal.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">
                                  {item.colorName} / {item.sizeValue}
                                </p>
                                <span className="size-1 bg-primary/20 rounded-full"></span>
                                <p className="text-[10px] text-primary/40 uppercase tracking-widest font-bold">
                                  Qty: <span className="text-primary">{item.quantity}</span>
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <span className="material-symbols-outlined text-4xl text-primary/20">error</span>
                    <p className="text-sm font-bold text-primary/60 uppercase tracking-widest">Details could not be loaded</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-background-soft border-t border-primary/10 flex justify-end gap-3">
                <button 
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-8 py-3 bg-primary text-white dark:text-background-dark text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
