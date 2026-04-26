import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { orderApi } from '../services/api';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.invalidateSize();
      const timer = setTimeout(() => map.invalidateSize(), 500);
      return () => clearTimeout(timer);
    }
  }, [map]);
  return null;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  addressSnapshot: string;
  latitudeSnapshot: number;
  longitudeSnapshot: number;
  orderNote: string;
  courierId: number | null;
  phoneNumber: string;
  pickedUpAt: string | null;
  preparedAt: string | null;
  createdAt: string;
  itemsCount: number;
}

export default function CourierOrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await orderApi.getCourierOrderDetails(orderId);
      if (response.data.success) {
        setDetails(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load details');
      }
    } catch (err: any) {
      console.error('Error fetching details:', err);
      setError('Order not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [orderId]);

  const handleAssign = async () => {
    if (!orderId) return;
    setAssigning(true);
    setError(null);
    try {
      const response = await orderApi.assignOrder(orderId);
      if (response.data.success) {
        // Success - maybe redirect to active tasks
        alert('Order successfully assigned to you!');
        navigate('/courier/dashboard');
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError('This order was already taken by another courier.');
      } else {
        setError(err.response?.data?.message || 'Assignment failed. Try again.');
      }
    } finally {
      setAssigning(false);
    }
  };

  const openNavigation = () => {
    if (details) {
      const lat = details.latitudeSnapshot ?? (details as any).latitude ?? (details as any).lat;
      const lng = details.longitudeSnapshot ?? (details as any).longitude ?? (details as any).lng;
      
      if (lat != null && lng != null) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-10 space-y-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="size-16 bg-primary/5 rounded-[24px] animate-pulse" />
            <div className="space-y-3">
              <div className="h-3 w-32 bg-primary/5 rounded animate-pulse" />
              <div className="h-12 w-64 bg-primary/5 rounded animate-pulse" />
              <div className="h-3 w-40 bg-primary/5 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-primary/5 rounded-[40px] animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-96 bg-primary/5 rounded-[48px] animate-pulse" />
          <div className="h-96 bg-primary/5 rounded-[48px] animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="h-40 bg-primary/5 rounded-[48px] animate-pulse" />
          <div className="h-40 bg-primary/5 rounded-[32px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-8 py-32 border-2 border-dashed border-primary/5 rounded-[48px]">
        <span className="material-symbols-outlined text-8xl text-red-500/10">error_medley</span>
        <h2 className="text-3xl font-black text-primary uppercase tracking-tighter">{error}</h2>
        <button 
          onClick={() => navigate('/courier/ready-orders')}
          className="px-12 py-5 bg-primary text-white dark:text-stone-900 text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xl shadow-primary/20"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  if (!details) return null;

  return (
    <div className="p-10 space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => navigate(-1)}
            className="size-16 bg-white dark:bg-stone-900 rounded-[24px] border border-primary/5 flex items-center justify-center text-primary shadow-xl hover:bg-primary hover:text-white dark:hover:text-stone-900 transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.3em] rounded-full border border-primary/5">
                Consignment Details
              </span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border ${
                details.status === 'READY_FOR_PICKUP' ? 'bg-amber-500/5 text-amber-600 border-amber-500/10' : 'bg-primary/5 text-primary/40 border-primary/5'
              }`}>
                {details.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-5xl font-black text-primary tracking-tighter uppercase leading-none">{details.orderNumber}</h1>
            <p className="text-[11px] font-black text-primary/30 uppercase tracking-[0.4em] mt-3">Registered {new Date(details.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-red-500/5 border border-red-500/10 text-red-500 rounded-[32px] flex items-center gap-5"
        >
          <span className="material-symbols-outlined font-bold">warning</span>
          <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 space-y-12">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-8 bg-white dark:bg-stone-900 rounded-[40px] border border-primary/5 shadow-sm text-center group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-3">Parcel Size</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary/20 text-lg">inventory_2</span>
                  <p className="text-2xl font-black text-primary">{details.itemsCount} SKUs</p>
                </div>
             </div>
             <div className="p-8 bg-white dark:bg-stone-900 rounded-[40px] border border-primary/5 shadow-sm text-center group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-3">Finance</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary/20 text-lg">credit_card</span>
                  <p className="text-sm font-black text-primary uppercase tracking-widest">{details.paymentStatus}</p>
                </div>
             </div>
             <div className="p-8 bg-white dark:bg-stone-900 rounded-[40px] border border-primary/5 shadow-sm text-center group hover:border-primary/20 transition-colors">
                <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em] mb-3">Settlement</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-primary/20 text-lg">payments</span>
                  <p className="text-sm font-black text-primary uppercase tracking-widest">{details.paymentMethod.replace(/_/g, ' ')}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Map Section */}
             <div className="space-y-6">
              <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-4">
                 <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                 Destination Trajectory
               </h3>
               <div className="h-[360px] w-full rounded-[48px] overflow-hidden border border-primary/5 shadow-2xl relative z-0">
                  {(() => {
                    const lat = details.latitudeSnapshot ?? (details as any).latitude ?? (details as any).lat;
                    const lng = details.longitudeSnapshot ?? (details as any).longitude ?? (details as any).lng;
                    
                    const validLat = lat !== null && lat !== undefined && !isNaN(Number(lat));
                    const validLng = lng !== null && lng !== undefined && !isNaN(Number(lng));

                    if (validLat && validLng) {
                      return (
                        <MapContainer 
                          key={`${lat}-${lng}`}
                          center={[Number(lat), Number(lng)]} 
                          zoom={15} 
                          style={{ height: '360px', width: '100%' }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[Number(lat), Number(lng)]} />
                          <MapResizer />
                        </MapContainer>
                      );
                    }
                    
                    return (
                      <div className="size-full bg-primary/[0.02] flex items-center justify-center text-primary/10 flex-col gap-4">
                         <span className="material-symbols-outlined text-7xl">location_off</span>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em]">Spatial data unavailable</p>
                      </div>
                    );
                  })()}
               </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-6">
               <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-4">
                 <div className="size-2 bg-primary rounded-full"></div>
                 Point of Delivery
               </h3>
               <div className="p-10 bg-white dark:bg-stone-900 rounded-[48px] border border-primary/5 shadow-2xl space-y-8 h-[360px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em]">Drop-off Address</p>
                    <p className="text-2xl font-medium text-primary leading-tight tracking-tight">{details.addressSnapshot}</p>
                  </div>

                  <div className="flex items-center gap-5 py-8 border-y border-primary/5">
                     <div className="size-16 bg-primary rounded-[24px] flex items-center justify-center text-white dark:text-stone-900 shadow-xl shadow-primary/20">
                        <span className="material-symbols-outlined text-2xl">call</span>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.2em] mb-1">Telecommunication</p>
                        <p className="text-2xl font-black text-primary tracking-tighter">{details.phoneNumber}</p>
                     </div>
                  </div>

                  <button 
                    onClick={openNavigation}
                    className="w-full py-6 bg-primary text-white dark:text-stone-950 hover:shadow-2xl hover:shadow-primary/40 transition-all rounded-[24px] flex items-center justify-center gap-4 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">directions</span>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Initialize Route</span>
                  </button>
               </div>
            </div>

            {/* Note and Action */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
              <div className="space-y-6">
                <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-4">
                   <div className="size-2 bg-primary rounded-full"></div>
                   Recipient Protocols
                 </h3>
                 <div className="p-10 bg-amber-500/[0.03] rounded-[48px] border border-amber-500/10 shadow-sm min-h-[160px] flex items-center">
                    <p className="text-lg font-medium text-amber-900/70 dark:text-amber-200/50 leading-relaxed italic">
                      {details.orderNote ? `"${details.orderNote}"` : "The recipient has not provided any specific handling instructions."}
                    </p>
                 </div>
              </div>

               <div className="space-y-6 flex flex-col justify-end">
                  <div className="p-6 bg-primary/[0.02] rounded-[32px] border border-primary/5 flex items-start gap-4 mb-2">
                     <span className="material-symbols-outlined text-primary/20 mt-1">verified_user</span>
                     <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest leading-relaxed">
                       Agreement: By claiming this dispatch, you confirm availability for immediate execution under professional guidelines.
                     </p>
                  </div>
                  <button 
                    onClick={handleAssign}
                    disabled={assigning || !!details.courierId}
                    className="w-full py-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[12px] font-black uppercase tracking-[0.4em] rounded-[32px] hover:scale-[1.03] active:scale-[0.97] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:grayscale cursor-pointer"
                  >
                    {assigning ? "Communicating with server..." : details.courierId ? "Dispatch Claimed" : "Accept Dispatch"}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
