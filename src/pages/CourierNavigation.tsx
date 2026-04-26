import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
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

// Custom icon for courier/live location
const courierIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #49352c; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.2); position: relative;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background-color: white; border-radius: 50%; animate: pulse 2s infinite;"></div>
         </div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const deliveryIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 12px; display: flex; items-center-justify-center; border: 3px solid white; box-shadow: 0 0 15px rgba(0,0,0,0.2);">
          <span class="material-symbols-outlined" style="color: white; font-size: 18px;">location_on</span>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

// Routing Component
function Routing({ waypoints }: { waypoints: L.LatLng[] }) {
  const map = useMap();
  const routingControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    // Remove existing routing control if it exists
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // @ts-ignore
    routingControlRef.current = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      // @ts-ignore
      lineOptions: {
        styles: [{ color: '#49352c', opacity: 0.8, weight: 6 }]
      },
      // @ts-ignore
      createMarker: () => null // We handle markers separately
    }).addTo(map);

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, waypoints]);

  return null;
}

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

export default function CourierNavigation() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courierPos, setCourierPos] = useState<[number, number] | null>(null);

  const fetchDetails = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const response = await orderApi.getCourierOrderDetails(orderId);
      if (response.data.success) {
        setDetails(response.data.data);
      } else {
        setError(response.data.message || 'Failed to load details');
      }
    } catch (err: any) {
      setError('Dispatch context unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCourierPos([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orderId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col overflow-hidden bg-black relative animate-pulse">
        {/* Skeleton Top HUD */}
        <div className="absolute top-0 inset-x-0 z-[1000] p-6 flex justify-between items-start">
           <div className="size-14 bg-primary/20 rounded-2xl" />
           <div className="bg-primary/20 h-24 w-64 rounded-3xl mx-auto" />
        </div>
        
        {/* Skeleton Map Area */}
        <div className="flex-1 bg-stone-900" />
        
        {/* Skeleton Bottom HUD */}
        <div className="absolute bottom-0 inset-x-0 z-[1000] p-8">
           <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-primary/20 rounded-[32px]" />
              ))}
           </div>
        </div>
      </div>
    );
  }

  const destLat = details?.latitudeSnapshot ?? details?.latitude;
  const destLng = details?.longitudeSnapshot ?? details?.longitude;
  const hasDest = destLat != null && destLng != null;

  const waypoints = courierPos && hasDest 
    ? [L.latLng(courierPos[0], courierPos[1]), L.latLng(Number(destLat), Number(destLng))]
    : [];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black relative">
      {/* HUD Header */}
      <div className="absolute top-0 inset-x-0 z-[1000] p-6 pointer-events-none">
        <div className="relative flex items-start justify-center">
           <button 
             onClick={() => navigate(-1)}
             className="absolute left-0 size-14 bg-white/90 backdrop-blur shadow-2xl rounded-2xl flex items-center justify-center text-primary dark:text-stone-950 pointer-events-auto hover:bg-white active:scale-95 transition-all"
           >
             <span className="material-symbols-outlined">arrow_back</span>
           </button>

           <div className="bg-primary/90 backdrop-blur text-white dark:text-stone-950 px-8 py-4 rounded-3xl shadow-2xl border border-white/10 pointer-events-auto max-w-sm text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 dark:opacity-70 mb-1">Active Dispatch</p>
              <h2 className="text-xl font-black tracking-tighter uppercase">{details?.orderNumber}</h2>
              <p className="text-[11px] font-medium opacity-60 dark:opacity-90 truncate mt-2">{details?.addressSnapshot}</p>
           </div>
        </div>
      </div>

      {/* Main Tactical Map */}
      <div className="flex-1 z-0">
        <MapContainer 
          center={courierPos || (hasDest ? [Number(destLat), Number(destLng)] : [0, 0])} 
          zoom={16} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapResizer />
          
          {courierPos && (
             <Marker position={courierPos} icon={courierIcon} />
          )}

          {hasDest && (
             <Marker position={[Number(destLat), Number(destLng)]} icon={deliveryIcon} />
          )}

          {waypoints.length === 2 && (
             <Routing waypoints={waypoints} />
          )}
        </MapContainer>
      </div>

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-0 inset-x-0 z-[1000] p-8 pointer-events-none">
         <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/95 backdrop-blur p-6 rounded-[32px] shadow-2xl border border-primary/5 pointer-events-auto flex items-center gap-4 text-primary dark:text-stone-950">
               <div className="size-12 bg-primary/5 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">near_me</span>
               </div>
               <div>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-widest leading-none mb-1">Status</p>
                  <p className="text-sm font-black uppercase">In Transit</p>
               </div>
            </div>

            <div className="bg-white/95 backdrop-blur p-6 rounded-[32px] shadow-2xl border border-primary/5 pointer-events-auto flex items-center gap-4 text-primary dark:text-stone-950">
               <div className="size-12 bg-primary/5 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">distance</span>
               </div>
               <div>
                  <p className="text-[9px] font-black opacity-30 uppercase tracking-widest leading-none mb-1">Live Telemetry</p>
                  <p className="text-sm font-black uppercase">GPS Active</p>
               </div>
            </div>

            <button 
              onClick={() => {
                if (hasDest) {
                   const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
                   window.open(url, '_blank');
                }
              }}
              className="bg-primary text-white dark:text-stone-950 p-6 rounded-[32px] shadow-2xl pointer-events-auto flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
               <span className="material-symbols-outlined">directions</span>
               <span className="text-[11px] font-black uppercase tracking-[0.3em]">External Nav</span>
            </button>
         </div>
      </div>
    </div>
  );
}
