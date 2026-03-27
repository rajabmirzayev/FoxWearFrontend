import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSidebar';
import Modal from '../components/Modal';
import { addressApi } from '../services/api';
import { Address, AddressRequest } from '../types';

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

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Handle initial render and visibility changes
  useEffect(() => {
    if (map) {
      // Immediate call
      map.invalidateSize();
      
      // Delayed calls to handle layout shifts/animations
      const timers = [100, 500, 1000].map(delay => 
        setTimeout(() => map.invalidateSize(), delay)
      );

      return () => timers.forEach(clearTimeout);
    }
  }, [map]);

  useEffect(() => {
    if (position && map) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);

  useEffect(() => {
    if (!map) return;
    
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
      resizeObserver.disconnect();
    };
  }, [map]);

  return position ? <Marker position={position} /> : null;
}

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [currentAddress, setCurrentAddress] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<AddressRequest>({
    title: '',
    city: '',
    region: '',
    street: '',
    block: '',
    floor: '',
    doorNumber: '',
    doorCode: '',
    fullAddressText: '',
    latitude: 40.4093, // Default to Baku
    longitude: 49.8671,
    isDefault: false
  });

  const [mapPosition, setMapPosition] = useState<[number, number]>([40.4093, 49.8671]);

  const [mapReady, setMapReady] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (view !== 'list') {
      const timer = setTimeout(() => setMapReady(true), 300);
      return () => {
        clearTimeout(timer);
        setMapReady(false);
      };
    }
  }, [view]);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await addressApi.getAll();
      if (response.data.success) {
        setAddresses(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      setError('Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      title: '',
      city: '',
      region: '',
      street: '',
      block: '',
      floor: '',
      doorNumber: '',
      doorCode: '',
      fullAddressText: '',
      latitude: 40.4093,
      longitude: 49.8671,
      isDefault: false
    });
    setMapPosition([40.4093, 49.8671]);
    setView('add');
    setError(null);
    setSuccess(null);
  };

  const handleEditClick = async (address: Address) => {
    setLoading(true);
    try {
      const response = await addressApi.getById(address.id);
      if (response.data.success) {
        const addr = response.data.data;
        setCurrentAddress(addr);
        setFormData({
          title: addr.title,
          city: addr.city,
          region: addr.region,
          street: addr.street,
          block: addr.block,
          floor: addr.floor,
          doorNumber: addr.doorNumber,
          doorCode: addr.doorCode,
          fullAddressText: addr.fullAddressText,
          latitude: addr.latitude,
          longitude: addr.longitude,
          isDefault: addr.isDefault
        });
        setMapPosition([addr.latitude, addr.longitude]);
        setView('edit');
        setError(null);
        setSuccess(null);
      }
    } catch (err) {
      console.error('Error fetching address details:', err);
      setError('Failed to load address details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setAddressToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      const response = await addressApi.delete(addressToDelete);
      if (response.data.success) {
        setSuccess('Address deleted successfully.');
        fetchAddresses();
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address.');
    } finally {
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError(null);
    setSuccess(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapPosition([latitude, longitude]);
        setLocating(false);
        setSuccess('Current location detected.');
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
      },
      (err) => {
        console.error('Geolocation error:', err);
        let msg = 'Failed to retrieve your location.';
        if (err.code === 1) {
          msg = 'Location access denied. Please ensure you have allowed location access in your browser settings and refresh the page.';
        } else if (err.code === 2) {
          msg = 'Location information is unavailable.';
        } else if (err.code === 3) {
          msg = 'Location request timed out.';
        }
        setError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearchAddress = async (queryOverride?: string) => {
    const query = queryOverride !== undefined ? queryOverride : searchQuery;
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Don't show error for background search unless it's a major failure
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearchAddress();
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: any) => {
    const { lat, lon, display_name } = result;
    const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
    setMapPosition(newPos);
    setFormData(prev => ({
      ...prev,
      fullAddressText: display_name,
      latitude: newPos[0],
      longitude: newPos[1]
    }));
    setSearchResults([]);
    setSearchQuery(display_name);
    setSuccess('Location updated from search result.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const dataToSubmit = {
      ...formData,
      latitude: mapPosition[0],
      longitude: mapPosition[1]
    };

    try {
      let response;
      if (view === 'add') {
        response = await addressApi.create(dataToSubmit);
      } else {
        response = await addressApi.update(currentAddress!.id, dataToSubmit);
      }

      if (response.data.success) {
        setSuccess(`Address ${view === 'add' ? 'added' : 'updated'} successfully.`);
        setView('list');
        fetchAddresses();
      }
    } catch (err: any) {
      console.error('Error saving address:', err);
      setError(err.response?.data?.message || 'An error occurred while saving the address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#f7f7f6] dark:bg-stone-950 text-on-background selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <AccountSidebar />

          <section className="lg:col-span-9">
            {view === 'list' ? (
              <div className="max-w-4xl">
                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div>
                    <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">My Addresses</h1>
                    <p className="font-body font-light text-lg text-secondary leading-relaxed text-stone-400">Manage your delivery locations for a seamless FOXWEAR experience.</p>
                  </div>
                  <button 
                    onClick={handleAddClick}
                    className="px-8 py-4 bg-primary text-white dark:text-stone-950 font-headline font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary/90 transition-all rounded-lg cursor-pointer"
                  >
                    Add New Address
                  </button>
                </header>

                {error && <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}
                {success && <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm">{success}</div>}

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.length === 0 ? (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                        <p className="font-body font-light text-stone-400">No addresses found. Add your first delivery location.</p>
                      </div>
                    ) : (
                      addresses.map((address) => (
                        <div key={address.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl relative group hover:border-primary transition-all">
                          {address.isDefault && (
                            <span className="absolute top-8 right-8 bg-primary/10 text-primary text-[8px] font-headline font-black uppercase tracking-widest px-2 py-1 rounded">Default</span>
                          )}
                          <h3 className="font-headline font-black text-xl uppercase tracking-tight text-primary mb-2">{address.title}</h3>
                          <p className="font-body font-light text-sm text-stone-500 mb-6 leading-relaxed">
                            {address.fullAddressText}<br />
                            {address.city}, {address.region}
                          </p>
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={() => handleEditClick(address)}
                              className="text-[10px] font-headline font-bold uppercase tracking-widest text-primary hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(address.id)}
                              className="text-[10px] font-headline font-bold uppercase tracking-widest text-red-500 hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-2xl">
                <header className="mb-16">
                  <h1 className="font-headline font-black text-5xl md:text-6xl uppercase tracking-tighter text-primary mb-4">
                    {view === 'add' ? 'Add Address' : 'Edit Address'}
                  </h1>
                  <p className="font-body font-light text-lg text-secondary leading-relaxed text-stone-400">
                    {view === 'add' ? 'Define a new delivery destination.' : 'Refine your existing delivery details.'}
                  </p>
                </header>

                {error && <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>}

                <form className="space-y-12" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-2 group md:col-span-2">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Address Title (e.g. Home, Work)</label>
                      <input 
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Address Title" 
                        type="text"
                        required
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">City</label>
                      <input 
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="City" 
                        type="text"
                        required
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Region</label>
                      <input 
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Region" 
                        type="text"
                        required
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Street</label>
                      <input 
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Street" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Block</label>
                      <input 
                        name="block"
                        value={formData.block}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Block" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Floor</label>
                      <input 
                        name="floor"
                        value={formData.floor}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Floor" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Door Number</label>
                      <input 
                        name="doorNumber"
                        value={formData.doorNumber}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Door Number" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-2 group">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Door Code</label>
                      <input 
                        name="doorCode"
                        value={formData.doorCode}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white" 
                        placeholder="Door Code" 
                        type="text"
                      />
                    </div>
                    <div className="space-y-2 group md:col-span-2">
                      <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 group-focus-within:text-primary transition-colors">Full Address Text</label>
                      <textarea 
                        name="fullAddressText"
                        value={formData.fullAddressText}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary focus:outline-none px-0 py-3 font-body font-light text-lg transition-all dark:text-white resize-none" 
                        placeholder="Enter full address details..." 
                        rows={3}
                        required
                      />
                    </div>

                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block font-headline font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60">Select Location on Map</label>
                          <button
                            type="button"
                            onClick={handleSetCurrentLocation}
                            disabled={locating}
                            className="flex items-center gap-2 text-[10px] font-headline font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity disabled:opacity-50 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">my_location</span>
                            {locating ? 'Locating...' : 'Set Current Location'}
                          </button>
                        </div>

                        {/* Search Address Field */}
                        <div className="flex flex-col gap-2 relative" ref={searchContainerRef}>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for an address or place..."
                                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg px-4 py-2 text-sm font-body font-light focus:ring-1 focus:ring-primary focus:outline-none dark:text-white"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                              />
                              {searching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary"></div>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSearchAddress()}
                              disabled={searching}
                              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-primary font-headline font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Search
                            </button>
                          </div>

                          {/* Search Results Dropdown */}
                          {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-[2000] mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                              {searchResults.map((result, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSelectSearchResult(result)}
                                  className="w-full text-left px-4 py-3 text-xs font-body font-light border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors dark:text-stone-300"
                                >
                                  {result.display_name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 relative">
                        {mapReady && (
                          <MapContainer 
                            key={`${view}-${currentAddress?.id || 'new'}`}
                            center={mapPosition} 
                            zoom={13} 
                            scrollWheelZoom={false} 
                            style={{ height: '300px', width: '100%' }}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                          </MapContainer>
                        )}
                      </div>
                      <p className="text-[9px] font-headline font-light uppercase tracking-widest text-stone-400">Click on the map to set the exact delivery coordinates.</p>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-3">
                      <input 
                        id="isDefault"
                        name="isDefault"
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-primary border-stone-300 rounded focus:ring-primary accent-primary cursor-pointer"
                      />
                      <label htmlFor="isDefault" className="font-headline font-bold uppercase tracking-widest text-[10px] text-primary cursor-pointer">Set as default address</label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-8 pt-12">
                    <button 
                      className="w-full sm:w-auto px-12 py-5 bg-primary text-white dark:text-stone-950 font-headline font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 cursor-pointer rounded-lg" 
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : (view === 'add' ? 'Add Address' : 'Update Address')}
                    </button>
                    <button 
                      className="w-full sm:w-auto px-12 py-5 border border-outline-variant font-headline font-light uppercase tracking-[0.3em] text-[10px] text-primary hover:bg-surface-container transition-colors dark:text-white dark:hover:bg-stone-800 cursor-pointer rounded-lg" 
                      type="button"
                      onClick={() => setView('list')}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
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
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
}
