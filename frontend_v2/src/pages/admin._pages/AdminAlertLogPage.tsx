import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION CONSTANTS (Assuming CONFIG object format) ---
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000' // Replace with your actual base URL or environment variable
};

const API = `${CONFIG.API_BASE_URL}/api/alert-logs`;
const ANALYSE_API = `${CONFIG.API_BASE_URL}/api/analyse/shorten`;

// --- TYPES & INTERFACES ---
interface User {
  user_id: number;
  username: string;
}

interface Incident {
  accident_id: number;
  address_name?: string;
  location_id?: string | number;
  description?: string;
}

interface AlertLog {
  alert_id: number;
  user_id: number;
  accident_id: number;
  message: string;
  timestamp: string;
  is_read: boolean;
}

interface UserMap {
  [key: number]: string;
}

interface AccidentMap {
  [key: number]: {
    address_name: string;
    description: string;
  };
}

export default function AlertLogs() {
  // --- STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertLog[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertLog[]>([]);

  // Maps for quick lookups
  const [userMap, setUserMap] = useState<UserMap>({});
  const [accidentMap, setAccidentMap] = useState<AccidentMap>({});

  // Form states
  const [formUserId, setFormUserId] = useState('');
  const [formAccidentId, setFormAccidentId] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterReadStatus, setFilterReadStatus] = useState<'' | 'read' | 'unread'>('');

  // AI cache tracking to match original Map() functionality across filtering re-renders
  const aiCache = useRef<Map<number, string>>(new Map());
  const [aiSummaries, setAiSummaries] = useState<{ [key: number]: string }>({});

  // Toast notification state
  const [toast, setToast] = useState<{ msg: string; show: boolean; type: string }>({
    msg: '',
    show: false,
    type: '',
  });

  // --- INITIALIZATION & FETCHES ---
  useEffect(() => {
    async function loadDropdownsAndAlerts() {
      try {
        const [usersRes, accidentsRes] = await Promise.all([
          fetch(`${CONFIG.API_BASE_URL}/api/users`),
          fetch(`${CONFIG.API_BASE_URL}/api/incidents`),
        ]);
        
        const usersData = await usersRes.json();
        const accidentsData = await accidentsRes.json();

        const uMap: UserMap = {};
        if (usersData.success) {
          setUsers(usersData.users);
          usersData.users.forEach((u: User) => {
            uMap[u.user_id] = u.username;
          });
          setUserMap(uMap);
        }

        const aMap: AccidentMap = {};
        if (accidentsData.success) {
          setIncidents(accidentsData.incidents);
          accidentsData.incidents.forEach((a: Incident) => {
            aMap[a.accident_id] = {
              address_name: a.address_name || '',
              description: a.description || '',
            };
          });
          setAccidentMap(aMap);
        }

        // Fetch alerts only after local map frames are structurally ready
        await loadAlerts();
      } catch (e) {
        alert('Failed to load initial metadata.');
      }
    }

    loadDropdownsAndAlerts();
  }, []);

  // --- FILTER & SEARCH APPLICATION ---
  useEffect(() => {
    const filtered = allAlerts.filter((a) => {
      if (searchQuery && !a.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterDateFrom && new Date(a.timestamp) < new Date(filterDateFrom)) return false;
      if (filterDateTo && new Date(a.timestamp) > new Date(filterDateTo)) return false;
      if (filterReadStatus) {
        const readLabel = a.is_read ? 'read' : 'unread';
        if (filterReadStatus !== readLabel) return false;
      }
      return true;
    });
    setFilteredAlerts(filtered);
  }, [allAlerts, searchQuery, filterDateFrom, filterDateTo, filterReadStatus]);

  // --- ACTIONS ---
  const showToast = (msg: string, type = '') => {
    setToast({ msg, show: true, type });
    setTimeout(() => setToast({ msg: '', show: false, type: '' }), 2500);
  };

  const loadAlerts = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.success) {
        setAllAlerts(data.alerts);
      } else {
        alert('Failed to load alerts: ' + data.error);
      }
    } catch (e) {
      alert('Could not connect to server.');
    }
  };

  const addAlert = async () => {
    if (!formUserId || !formAccidentId || !formMessage.trim()) {
      alert('Please fill all fields.');
      return;
    }

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: parseInt(formUserId),
          accident_id: parseInt(formAccidentId),
          message: formMessage.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormUserId('');
        setFormAccidentId('');
        setFormMessage('');
        showToast('Alert added!', 'success');
        loadAlerts();
      } else {
        alert('Failed to add alert: ' + data.error);
      }
    } catch (e) {
      alert('Insert failed.');
    }
  };

  const deleteAlert = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete alert ${id}?`)) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Alert ${id} deleted.`);
        loadAlerts();
      } else {
        alert('Failed to delete alert: ' + data.error);
      }
    } catch (e) {
      alert('Delete failed.');
    }
  };

  const analyseRow = async (accidentId: number, location: string, description: string) => {
    // Return early if this item is currently running or completed
    if (aiCache.current.has(accidentId) || aiSummaries[accidentId]) return;

    // Mark as summarizing
    setAiSummaries((prev) => ({ ...prev, [accidentId]: 'AI is summarising description...' }));

    try {
      const res = await fetch(ANALYSE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, description }),
      });
      const data = await res.json();
      const finalDesc = data.short_description || description || 'N/A';
      
      aiCache.current.set(accidentId, finalDesc);
      setAiSummaries((prev) => ({ ...prev, [accidentId]: finalDesc }));
    } catch (e) {
      const fallback = description || 'N/A';
      aiCache.current.set(accidentId, fallback);
      setAiSummaries((prev) => ({ ...prev, [accidentId]: fallback }));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterReadStatus('');
  };

  // --- STYLES OBJECT ---
  const styles: { [key: string]: React.CSSProperties } = {
    bodyLayout: { backgroundColor: '#1a1a1a', minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontComposite: 'initial' },
    bg: { position: 'fixed', inset: 0, backgroundImage: "url('background-image.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.52) saturate(0.8)', zIndex: 0 },
    container: { position: 'relative', zIndex: 1, padding: '36px 48px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: "'Roboto', sans-serif" },
    h1: { fontFamily: "'Oswald', sans-serif", fontSize: '2.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' },
    h2: { fontFamily: "'Oswald', sans-serif", fontSize: '1.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' },
    backLink: { color: '#f0c040', fontSize: '0.85rem', textDecoration: 'none', letterSpacing: '1px', fontWeight: 500, display: 'inline-block', marginBottom: '28px', transition: 'color .2s' },
    hr: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.15)', margin: '28px 0' },
    inputBase: { padding: '9px 12px', background: 'rgba(255,255,255,0.92)', border: 'none', fontFamily: "'Roboto', sans-serif", fontSize: '0.88rem', color: '#333', outline: 'none' },
    addForm: { background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', padding: '22px 24px', marginBottom: '28px', maxWidth: '520px' },
    formRow: { marginBottom: '14px' },
    fieldLabel: { fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem', letterSpacing: '1px', color: '#f0c040', textTransform: 'uppercase', display: 'block', marginBottom: '5px' },
    toolbar: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' },
    filterPanel: { background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.18)', padding: '18px 22px', marginBottom: '16px', width: 'fit-content' },
    filterSectionTitle: { fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem', letterSpacing: '1.5px', color: '#f0c040', textTransform: 'uppercase', display: 'block', marginBottom: '8px' },
    filterBlock: { marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.35)' },
    th: { fontFamily: "'Oswald', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 13px', textAlign: 'left', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.55)' },
    td: { padding: '10px 13px', color: '#fff', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.12)', verticalAlign: 'middle' },
    noData: { textAlign: 'center', color: rgba(255,255,255,0.5), fontStyle: 'italic', fontSize: '0.88rem' },
    badge: { display: 'inline-block', padding: '3px 10px', fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase' },
    btn: { display: 'inline-block', padding: '8px 18px', border: 'none', fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', margin: '2px 2px 2px 0' }
  };

  function rgba(r: number, g: number, b: number, a: number) {
    return `rgba(${r},${g},${b},${a})`;
  }

  return (
    <div style={styles.bodyLayout}>
      <div style={styles.bg}></div>
      <div style={styles.container}>
        <h1 style={styles.h1}>Alert Logs</h1>
        <a style={styles.backLink} href="/admin">← Go Back to Home</a>

        {/* ADD ALERT FORM */}
        <h2 style={styles.h2}>Add Alert</h2>
        <div style={styles.addForm}>
          <div style={styles.formRow}>
            <span style={styles.fieldLabel}>User</span>
            <select
              style={{ ...styles.inputBase, width: '100%', cursor: 'pointer', minWidth: '200px' }}
              value={formUserId}
              onChange={(e) => setFormUserId(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div style={styles.formRow}>
            <span style={styles.fieldLabel}>Incident</span>
            <select
              style={{ ...styles.inputBase, width: '100%', cursor: 'pointer', minWidth: '200px' }}
              value={formAccidentId}
              onChange={(e) => setFormAccidentId(e.target.value)}
            >
              <option value="">Select Incident</option>
              {incidents.map((a) => (
                <option key={a.accident_id} value={a.accident_id}>
                  {`Incident ${a.accident_id} - ${a.address_name || a.location_id}`}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.formRow}>
            <span style={styles.fieldLabel}>Message</span>
            <textarea
              style={{ ...styles.inputBase, resize: 'vertical', width: '100%', maxWidth: '460px' }}
              placeholder="Alert message"
              rows={3}
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
            />
          </div>
          <button
            style={{ ...styles.btn, backgroundColor: '#b8860b', color: '#fff' }}
            onClick={addAlert}
          >
            Add Alert
          </button>
        </div>

        <hr style={styles.hr} />

        {/* ALERT LIST TOOLBAR */}
        <h2 style={styles.h2}>Alert List</h2>
        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="Search by message"
            style={{ ...styles.inputBase, minWidth: '260px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            style={{ ...styles.btn, backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
            onClick={() => setShowFilterMenu(!showFilterMenu)}
          >
            ⚙ Filter
          </button>
        </div>

        {/* FILTER PANEL */}
        {showFilterMenu && (
          <div style={styles.filterPanel}>
            <div style={styles.filterBlock}>
              <span style={styles.filterSectionTitle}>Date Range</span>
              From:{' '}
              <input
                type="date"
                style={{ ...styles.inputBase, marginRight: '8px' }}
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
              To:{' '}
              <input
                type="date"
                style={styles.inputBase}
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            <div style={styles.filterBlock}>
              <span style={styles.filterSectionTitle}>Read Status</span>
              <label style={{ color: 'rgba(255,255,255,0.85)', marginRight: '16px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="status"
                  value="read"
                  style={{ accentColor: '#cc2222', marginRight: '4px', cursor: 'pointer' }}
                  checked={filterReadStatus === 'read'}
                  onChange={() => setFilterReadStatus('read')}
                />{' '}
                Read
              </label>
              <label style={{ color: 'rgba(255,255,255,0.85)', marginRight: '16px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="status"
                  value="unread"
                  style={{ accentColor: '#cc2222', marginRight: '4px', cursor: 'pointer' }}
                  checked={filterReadStatus === 'unread'}
                  onChange={() => setFilterReadStatus('unread')}
                />{' '}
                Unread
              </label>
            </div>
            <button
              style={{ ...styles.btn, backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ALERTS DATA TABLE */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>User ID</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Accident ID</th>
              <th style={styles.th}>Accident Description</th>
              <th style={styles.th}>Message</th>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Read</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...styles.td, ...styles.noData }}>
                  No alerts found.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((a, index) => {
                const accident = accidentMap[a.accident_id];
                let displayDescription = 'N/A';

                if (aiCache.current.has(a.accident_id)) {
                  displayDescription = aiCache.current.get(a.accident_id) || 'N/A';
                } else if (accident) {
                  displayDescription = aiSummaries[a.accident_id] || 'AI is summarising description...';
                  // Fire the asynchronous call securely outside the render sync lifecycle loops
                  analyseRow(a.accident_id, accident.address_name, accident.description);
                }

                // Row zebra striping calculations matching CSS
                const rowBackground = index % 2 === 1 ? 'rgba(255,255,255,0.05)' : 'transparent';

                return (
                  <tr 
                    key={a.alert_id} 
                    style={{ backgroundColor: rowBackground }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.09)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = rowBackground)}
                  >
                    <td style={styles.td}>{a.alert_id}</td>
                    <td style={styles.td}>{a.user_id}</td>
                    <td style={styles.td}>{userMap[a.user_id] || 'Unknown'}</td>
                    <td style={styles.td}>{a.accident_id}</td>
                    <td style={styles.td}>{displayDescription}</td>
                    <td style={styles.td}>{a.message}</td>
                    <td style={styles.td}>
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          ...(a.is_read
                            ? { backgroundColor: 'rgba(26,122,58,0.4)', color: '#6fd46f', border: '1px solid #1a7a3a' }
                            : { backgroundColor: 'rgba(204,34,34,0.25)', color: '#ff8888', border: '1px solid #cc2222' }),
                        }}
                      >
                        {a.is_read ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{ ...styles.btn, backgroundColor: '#cc2222', color: '#fff' }}
                        onClick={() => deleteAlert(a.alert_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* TOAST PANEL */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          color: '#fff',
          padding: '11px 20px',
          fontFamily: "'Oswald', sans-serif",
          fontSize: '0.88rem',
          letterSpacing: '1px',
          zIndex: 999,
          pointerEvents: 'none',
          transition: 'all .3s',
          opacity: toast.show ? 1 : 0,
          transform: toast.show ? 'translateY(0)' : 'translateY(8px)',
          backgroundColor: toast.type === 'success' ? '#1a7a3a' : '#cc2222',
        }}
      >
        {toast.msg}
      </div>
    </div>
  );
}