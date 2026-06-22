import React, { useState, useEffect, useMemo } from 'react';

// 1. Interfaces & Types
interface LocationArea {
  location_id: number | string;
  latitude: number | string;
  longitude: number | string;
  address_name: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | '';
}

// Fallback configuration mimicry. Replace with process.env.REACT_APP_API_BASE_URL if needed.
const API_BASE_URL = (window as any).CONFIG?.API_BASE_URL || 'http://localhost:5000';
const API = `${API_BASE_URL}/api/areas`;

const LocationsPage: React.FC = () => {
  // 2. States
  const [allLocations, setAllLocations] = useState<LocationArea[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: '' });

  // 3. Helper: Toast Triggers
  const triggerToast = (message: string, type: 'success' | 'error' | '' = '') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
  };

  // 4. API Actions: Load Areas
  const loadAreas = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) {
        setAllLocations(data.areas || []);
      } else {
        alert('Failed to load areas: ' + data.error);
      }
    } catch (e) {
      alert('Could not connect to server.');
    }
  };

  // 5. API Actions: Delete Area
  const deleteLocation = async (id: number | string) => {
    if (!window.confirm(`Are you sure you want to delete location ${id}?`)) return;
    
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadAreas();
        triggerToast(`Location ${id} deleted.`);
      } else {
        alert('Failed to delete location: ' + data.error);
      }
    } catch (e) {
      alert('Delete failed.');
    }
  };

  // Run load operation on mounting sequence
  useEffect(() => {
    loadAreas();
  }, []);

  // 6. Inline Filtering computation 
  const filteredLocations = useMemo(() => {
    return allLocations.filter((loc) =>
      loc.address_name && loc.address_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allLocations, searchQuery]);

  return (
    <div className="relative min-h-screen font-sans bg-[#1a1a1a] overflow-x-hidden">
      {/* Background Layer with opacity / mix effects */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center brightness-[0.52] saturate-[0.8]"
        style={{ backgroundImage: `url('background-image.jpeg')` }}
      />

      {/* Primary Visual Container */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-12 py-9 max-md:px-6">
        <header>
          <h1 className="font-['Oswald'] text-[2.8rem] font-bold text-white uppercase tracking-[2px] mb-1 leading-tight">
            Locations
          </h1>
          <a 
            href="/admin" 
            className="inline-block text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline mb-7 transition-colors duration-200 hover:text-white"
          >
            &larr; Go Back to Home
          </a>
        </header>

        <main>
          <h2 className="font-['Oswald'] text-[1.35rem] font-semibold text-white uppercase tracking-[1px] mb-3">
            Saved Locations
          </h2>

          {/* Filtering Group */}
          <div className="flex gap-2.5 items-center mb-3.5">
            <input
              type="text"
              placeholder="Search by address name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-[280px] p-[9px_12px] bg-white/92 border-none font-sans text-[0.88rem] text-[#333] placeholder-[#888] outline-none max-xs:min-w-full"
            />
          </div>

          {/* Interactive Core Table Grid */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse bg-black/35">
              <thead>
                <tr className="bg-black/50">
                  <th className="font-['Oswald'] text-[0.9rem] font-semibold text-white uppercase tracking-[1px] p-[11px_13px] text-left border border-white/15">ID</th>
                  <th className="font-['Oswald'] text-[0.9rem] font-semibold text-white uppercase tracking-[1px] p-[11px_13px] text-left border border-white/15">Latitude</th>
                  <th className="font-['Oswald'] text-[0.9rem] font-semibold text-white uppercase tracking-[1px] p-[11px_13px] text-left border border-white/15">Longitude</th>
                  <th className="font-['Oswald'] text-[0.9rem] font-semibold text-white uppercase tracking-[1px] p-[11px_13px] text-left border border-white/15">Address Name</th>
                  <th className="font-['Oswald'] text-[0.9rem] font-semibold text-white uppercase tracking-[1px] p-[11px_13px] text-left border border-white/15">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-[10px_13px] text-center text-white/55 italic text-[0.88rem] border border-white/12">
                      No locations found.
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((loc) => (
                    <tr 
                      key={loc.location_id} 
                      className="even:bg-white/5 hover:bg-white/9 transition-colors duration-150"
                    >
                      <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{loc.location_id}</td>
                      <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{loc.latitude}</td>
                      <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{loc.longitude}</td>
                      <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">{loc.address_name}</td>
                      <td className="p-[10px_13px] text-white text-[0.86rem] border border-white/12 align-middle">
                        <button
                          onClick={() => deleteLocation(loc.location_id)}
                          className="inline-block p-[7px_14px] border-none font-['Oswald'] text-[0.78rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 m-[2px_2px_2px_0] bg-[#cc2222] text-white hover:bg-[#ee3333]"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Global Toast Alerts */}
      <div
        className={`fixed bottom-6 right-6 p-[11px_20px] font-['Oswald'] text-[0.88rem] tracking-[1px] text-white z-[999] pointer-events-none transition-all duration-300 ${
          toast.type === 'success' ? 'bg-[#1a7a3a]' : 'bg-[#cc2222]'
        } ${
          toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        {toast.message}
      </div>
    </div>
  );
};

export default LocationsPage;