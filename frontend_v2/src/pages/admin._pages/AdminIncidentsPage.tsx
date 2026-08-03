import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from "@/lib/apiConfig";

// --- TypeScript Interfaces & Config Mock ---
interface Incident {
  accident_id: number;
  address_name?: string;
  description: string;
  severity: number;
  date_reported: string;
  status: 'active' | 'resolved';
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AICacheItem {
  short_location: string;
  short_description: string;
}

// Assuming CONFIG comes from an external config or environment variables
const CONFIG = {
  API_BASE_URL,
};

const API = `${CONFIG.API_BASE_URL}/api/incidents`;
const ANALYSE_API = `${CONFIG.API_BASE_URL}/api/analyse/shorten`;

export default function IncidentArchive() {
  // --- State Variables ---
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  
  // Form State
  const [locInput, setLocInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<{ name: string; lat: string; lng: string } | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<number>(5);
  const [dateReported, setDateReported] = useState('');
  const [status, setStatus] = useState<'active' | 'resolved' | ''>('');

  // Filters & Toolbar State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  // UI Panels / Feedback
  const [openUpdatePanels, setOpenUpdatePanels] = useState<Record<number, boolean>>({});
  const [updateFormState, setUpdateFormState] = useState<Record<number, { severity: number; status: 'active' | 'resolved' }>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  // --- Refs ---
  const aiCache = useRef<Map<number, AICacheItem>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // Persistent tracking map so we don't refetch rows already in mid-flight
  const analysisInFlight = useRef<Set<number>>(new Set());

  // --- Toast Trigger ---
  const showToast = (msg: string, type = '') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // --- Fetch API Handlers ---
  const loadIncidents = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) {
        setAllIncidents(data.incidents);
        // Pre-populate update tracking states
        const initialUpdates: typeof updateFormState = {};
        data.incidents.forEach((inc: Incident) => {
          initialUpdates[inc.accident_id] = { severity: inc.severity, status: inc.status };
        });
        setUpdateFormState(initialUpdates);
      } else {
        alert('Failed to load incidents: ' + data.error);
      }
    } catch (e) {
      alert('Could not connect to server.');
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  // --- Location Autocomplete Async Action ---
  const handleLocationInput = (val: string) => {
    setLocInput(val);
    setSelectedLoc(null); // invalidate previous setup if they keep typing

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/incidents/location-search?q=${encodeURIComponent(val.trim())}`);
        const results = await res.json();
        setSuggestions(results);
      } catch (e) {
        setSuggestions([]);
      }
    }, 400);
  };

  // --- Form Insertion Action ---
  const addIncident = async () => {
    if (!selectedLoc) { alert('Please select a location from the suggestions.'); return; }
    if (!description.trim()) { alert('Please enter a description.'); return; }
    if (!status) { alert('Please select a status.'); return; }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_name: selectedLoc.name,
          latitude: parseFloat(selectedLoc.lat),
          longitude: parseFloat(selectedLoc.lng),
          description,
          severity,
          date_reported: dateReported,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        setLocInput('');
        setSelectedLoc(null);
        setDescription('');
        setSeverity(5);
        setDateReported('');
        setStatus('');
        showToast('Incident added!', 'success');
        loadIncidents();
      } else {
        alert('Failed to add incident: ' + data.error);
      }
    } catch (e) {
      alert('Insert failed.');
    }
  };

  // --- Inline AI Row Processing ---
  const [, forceUpdate] = useState({}); // Simple re-render trigger when map updates asynchronous data
  const analyseRow = useCallback(async (id: number, location: string, desc: string) => {
    if (analysisInFlight.current.has(id)) return;
    analysisInFlight.current.add(id);

    try {
      const res = await fetch(ANALYSE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, description: desc })
      });
      const data = await res.json();
      if (data.short_location && data.short_description) {
        aiCache.current.set(id, {
          short_location: data.short_location,
          short_description: data.short_description
        });
      } else {
        aiCache.current.set(id, { short_location: location, short_description: desc });
      }
    } catch (e) {
      aiCache.current.set(id, { short_location: location, short_description: desc });
    } finally {
      analysisInFlight.current.delete(id);
      forceUpdate({}); // Safely trigger re-render to display asynchronous cells
    }
  }, []);

  // --- Inline Row Modifiers ---
  const toggleUpdatePanel = (id: number) => {
    setOpenUpdatePanels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateChange = (id: number, key: 'severity' | 'status', value: any) => {
    setUpdateFormState(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  };

  const saveUpdate = async (id: number) => {
    const updatedFields = updateFormState[id];
    if (!updatedFields?.status) { alert('Please select a status.'); return; }

    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: parseFloat(updatedFields.severity.toString()),
          status: updatedFields.status
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Incident updated!', 'success');
        loadIncidents();
        toggleUpdatePanel(id);
      } else {
        alert('Failed to update: ' + data.error);
      }
    } catch (e) {
      alert('Update failed.');
    }
  };

  const deleteIncident = async (id: number) => {
    if (!confirm(`Delete incident ${id}?`)) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        aiCache.current.delete(id);
        showToast('Incident deleted.');
        loadIncidents();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Delete failed.');
    }
  };

  // --- Filter Business Logic Rule Engine ---
  useEffect(() => {
    const filtered = allIncidents.filter(inc => {
      if (searchQuery && !inc.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterDateFrom && new Date(inc.date_reported) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(inc.date_reported) > new Date(filterDateTo)) return false;

      if (severityFilters.length > 0) {
        const s = parseFloat(inc.severity.toString());
        const label = s <= 3 ? 'low' : s <= 7 ? 'medium' : 'high';
        if (!severityFilters.includes(label)) return false;
      }

      if (statusFilters.length > 0 && !statusFilters.includes(inc.status)) return false;
      return true;
    });

    setFilteredIncidents(filtered);
  }, [allIncidents, searchQuery, filterDateFrom, filterDateTo, severityFilters, statusFilters]);

  const clearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setSeverityFilters([]);
    setStatusFilters([]);
    setSearchQuery('');
  };

  const handleCheckboxFilter = (array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    if (array.includes(value)) {
      setArray(array.filter(item => item !== value));
    } else {
      setArray([...array, value]);
    }
  };

  const getSeverityLabel = (score: number) => {
    if (score <= 3) return 'Low';
    if (score <= 7) return 'Medium';
    return 'High';
  };

  return (
    <div className="relative min-h-screen bg-[#1a1a1a] font-['Roboto',sans-serif] text-white overflow-x-hidden">
      {/* Background Layer mimicking CSS */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center" 
        style={{ 
          backgroundImage: `url('background-image.jpeg')`,
          filter: 'brightness(0.52) saturate(0.8)'
        }} 
      />

      <div className="relative z-10 p-9 max-w-[1200px] mx-auto">
        <h1 className="font-['Oswald',sans-serif] text-[2.8rem] font-bold uppercase tracking-[2px] mb-1">
          Incident Archive
        </h1>
        <a href="/admin" className="inline-block mb-7 text-[#f0c040] text-[0.85rem] font-medium tracking-[1px] no-underline transition-colors duration-200 hover:text-white">
          <ArrowLeft className="inline-block w-4 h-4 mr-1 alignment-baseline" /> Go Back to Home
        </a>

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          Add Incident
        </h2>

        {/* Input Add Form */}
        <div className="bg-black/40 border border-white/10 p-[22px_24px] mb-7 max-w-[520px]">
          <div className="relative mb-3.5">
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1px] mb-1">Location</span>
            <input 
              type="text" 
              placeholder="Search location..." 
              value={locInput}
              onChange={(e) => handleLocationInput(e.target.value)}
              autoComplete="off" 
              className="w-full p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 z-50 m-0 p-0 max-h-[200px] overflow-y-auto bg-white border border-gray-300 list-none">
                {suggestions.map((s, idx) => (
                  <li 
                    key={idx} 
                    onClick={() => {
                      setLocInput(s.display_name);
                      setSelectedLoc({ name: s.display_name, lat: s.lat, lng: s.lon });
                      setSuggestions([]);
                    }}
                    className="p-[8px_12px] text-[#333] text-[0.85rem] cursor-pointer hover:bg-[#f0c040]"
                  >
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mb-3.5">
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1px] mb-1">Description</span>
            <textarea 
              rows={3} 
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
            />
          </div>

          <div className="mb-3.5">
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1px] mb-1">
              Severity: <span className="text-white">{severity}</span>
            </span>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.1" 
              value={severity} 
              onChange={(e) => setSeverity(parseFloat(e.target.value))}
              className="w-full accent-[#b8860b]"
            />
          </div>

          <div className="mb-3.5">
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1px] mb-1">Date Reported</span>
            <input 
              type="date" 
              value={dateReported}
              onChange={(e) => setDateReported(e.target.value)}
              className="w-full p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
            />
          </div>

          <div className="mb-3.5 flex items-center gap-4">
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1px]">Status</span>
            <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1.5">
              <input type="radio" name="ins_status" value="active" checked={status === 'active'} onChange={() => setStatus('active')} /> Active
            </label>
            <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1.5">
              <input type="radio" name="ins_status" value="resolved" checked={status === 'resolved'} onChange={() => setStatus('resolved')} /> Resolved
            </label>
          </div>

          <button onClick={addIncident} className="inline-block p-[8px_18px] border-none font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-[#b8860b] text-white hover:bg-[#d4a017]">
            Add Incident
          </button>
        </div>

        <hr className="border-none border-t border-white/15 my-7" />

        <h2 className="font-['Oswald',sans-serif] text-[1.35rem] font-semibold uppercase tracking-[1px] mb-3.5">
          Incident List
        </h2>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <input 
            type="text" 
            placeholder="Search by description" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[260px] p-[9px_12px] bg-white/90 border-none font-['Roboto'] text-[0.88rem] text-[#333] outline-none"
          />
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className="inline-flex items-center gap-1 p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-colors duration-200 bg-white/18 text-white hover:bg-white/28"
          >
            <Settings className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        {/* Filters Panel Dropdown */}
        {isFilterOpen && (
          <div className="bg-black/60 border border-white/18 p-[18px_22px] mb-4 w-fit max-w-full">
            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">Date Range</span>
            <div className="text-white text-[0.85rem] flex flex-wrap gap-2 items-center">
              From: <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="p-[4px_8px] text-[#333] bg-white/90" />
              To: <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="p-[4px_8px] text-[#333] bg-white/90" />
            </div>

            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">Severity Level</span>
            <div className="flex flex-wrap gap-4">
              <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1">
                <input type="checkbox" value="low" checked={severityFilters.includes('low')} onChange={() => handleCheckboxFilter(severityFilters, setSeverityFilters, 'low')} /> Low (0–3)
              </label>
              <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1">
                <input type="checkbox" value="medium" checked={severityFilters.includes('medium')} onChange={() => handleCheckboxFilter(severityFilters, setSeverityFilters, 'medium')} /> Medium (3.1–7)
              </label>
              <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1">
                <input type="checkbox" value="high" checked={severityFilters.includes('high')} onChange={() => handleCheckboxFilter(severityFilters, setSeverityFilters, 'high')} /> High (7.1–10)
              </label>
            </div>

            <span className="block font-['Oswald',sans-serif] text-[0.8rem] text-[#f0c040] uppercase tracking-[1.5px] mt-3 mb-2">Status</span>
            <div className="flex gap-4">
              <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1">
                <input type="checkbox" value="active" checked={statusFilters.includes('active')} onChange={() => handleCheckboxFilter(statusFilters, setStatusFilters, 'active')} /> Active
              </label>
              <label className="text-white text-[0.88rem] cursor-pointer flex items-center gap-1">
                <input type="checkbox" value="resolved" checked={statusFilters.includes('resolved')} onChange={() => handleCheckboxFilter(statusFilters, setStatusFilters, 'resolved')} /> Resolved
              </label>
            </div>

            <div className="mt-[15px]">
              <button onClick={clearFilters} className="inline-block p-[8px_18px] border border-white/25 font-['Oswald',sans-serif] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer bg-white/18 text-white hover:bg-white/28">
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Data Incident Table Grid */}
        <table className="w-full border-collapse bg-black/35 mt-2.5 text-left">
          <thead>
            <tr className="bg-black/55 text-white font-['Oswald',sans-serif] text-[0.88rem] font-semibold uppercase tracking-[1px]">
              <th className="p-[11px_13px] border border-white/15">ID</th>
              <th className="p-[11px_13px] border border-white/15">Location</th>
              <th className="p-[11px_13px] border border-white/15">Description</th>
              <th className="p-[11px_13px] border border-white/15">Severity</th>
              <th className="p-[11px_13px] border border-white/15">Date Reported</th>
              <th className="p-[11px_13px] border border-white/15">Status</th>
              <th className="p-[11px_13px] border border-white/15">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-white/50 italic p-4">
                  No incidents found.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => {
                // Read from useRef cache array system layout values
                const hasCached = aiCache.current.has(inc.accident_id);
                const cachedData = aiCache.current.get(inc.accident_id);

                let displayLoc = 'Analyzing...';
                let displayDesc = 'Analyzing...';

                if (hasCached && cachedData) {
                  displayLoc = cachedData.short_location;
                  displayDesc = cachedData.short_description;
                } else {
                  // Fire-and-forget logic trigger safely on structural generation inside state arrays
                  analyseRow(inc.accident_id, inc.address_name || '', inc.description);
                }

                return (
                  <React.Fragment key={inc.accident_id}>
                    <tr className="border-b border-white/12 hover:bg-white/9 transition-colors odd:bg-transparent even:bg-white/5 text-[0.85rem] vertical-middle">
                      <td className="p-2.5 border border-white/12">{inc.accident_id}</td>
                      <td className="p-2.5 border border-white/12">{displayLoc}</td>
                      <td className="p-2.5 border border-white/12">{displayDesc}</td>
                      <td className="p-2.5 border border-white/12">
                        {parseFloat(inc.severity.toString()).toFixed(1)} ({getSeverityLabel(inc.severity)})
                      </td>
                      <td className="p-2.5 border border-white/12">
                        {inc.date_reported ? new Date(inc.date_reported).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-2.5 border border-white/12">{inc.status}</td>
                      <td className="p-2.5 border border-white/12 min-w-[190px]">
                        <button onClick={() => toggleUpdatePanel(inc.accident_id)} className="inline-flex items-center gap-1 p-[6px_12px] bg-[#b8860b] text-white text-[0.75rem] uppercase tracking-wider font-semibold mr-1 hover:bg-[#d4a017]">
                          <Edit2 className="w-3 h-3" /> Update
                        </button>
                        <button onClick={() => deleteIncident(inc.accident_id)} className="inline-flex items-center gap-1 p-[6px_12px] bg-[#cc2222] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#ee3333]">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Editing Panel Module Row */}
                    {openUpdatePanels[inc.accident_id] && (
                      <tr className="bg-white/5">
                        <td colSpan={7} className="p-3 border border-white/12">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-white flex items-center gap-2">
                              Severity:
                              <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="0.1" 
                                value={updateFormState[inc.accident_id]?.severity ?? inc.severity} 
                                onChange={(e) => handleUpdateChange(inc.accident_id, 'severity', parseFloat(e.target.value))}
                                className="accent-[#b8860b]"
                              />
                              <span>{parseFloat((updateFormState[inc.accident_id]?.severity ?? inc.severity).toString()).toFixed(1)}</span>
                            </span>
                            <label className="text-white cursor-pointer flex items-center gap-1">
                              <input 
                                type="radio" 
                                name={`upd-stat-${inc.accident_id}`} 
                                value="active" 
                                checked={updateFormState[inc.accident_id]?.status === 'active'}
                                onChange={() => handleUpdateChange(inc.accident_id, 'status', 'active')}
                              /> Active
                            </label>
                            <label className="text-white cursor-pointer flex items-center gap-1">
                              <input 
                                type="radio" 
                                name={`upd-stat-${inc.accident_id}`} 
                                value="resolved" 
                                checked={updateFormState[inc.accident_id]?.status === 'resolved'}
                                onChange={() => handleUpdateChange(inc.accident_id, 'status', 'resolved')}
                              /> Resolved
                            </label>
                            <button onClick={() => saveUpdate(inc.accident_id)} className="p-[6px_14px] bg-[#b8860b] text-white text-[0.75rem] uppercase tracking-wider font-semibold hover:bg-[#d4a017]">
                              Save Changes
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating System Notification Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 text-white p-[11px_20px] font-['Oswald'] text-[0.88rem] tracking-[1px] z-[999] transition-all duration-300 ${
          toast.type === 'success' ? 'bg-[#1a7a3a]' : 'bg-[#cc2222]'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}