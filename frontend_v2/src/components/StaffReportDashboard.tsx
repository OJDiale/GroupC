import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogOut, MapPin, Check, RotateCcw, ShieldAlert } from "lucide-react";
import { Map, MapMarker, MarkerContent } from "@/components/ui/map";
import Logo from "@/components/Logo";

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || "https://mapper-backend-brkn.onrender.com",
};

interface HazardOption {
  value: string;
  label: string;
}

interface MyReport {
  id: number;
  // MySQL DECIMAL columns are serialized as strings over JSON, not numbers
  latitude: string;
  longitude: string;
  hazardType: string;
  status: "active" | "resolved";
  createdAt: string;
}

interface StaffReportDashboardProps {
  title: string;
  subtitle: string;
  hazardTypeOptions: HazardOption[];
  accentClass?: string;
}

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export default function StaffReportDashboard({
  title,
  subtitle,
  hazardTypeOptions,
  accentClass = "bg-blue-600 hover:bg-blue-700",
}: StaffReportDashboardProps) {
  const navigate = useNavigate();
  const [pin, setPin] = useState({ lng: 28.1914, lat: -25.7566 });
  const [hazardType, setHazardType] = useState(hazardTypeOptions[0]?.value ?? "other");
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = "") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/hazards/mine`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) setReports(Array.isArray(data) ? data : []);
    } catch {
      // leave existing list on failure
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/hazards`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ latitude: pin.lat, longitude: pin.lng, hazardType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Report submitted and added to the risk database.", "success");
        loadReports();
      } else {
        showToast(data.message || "Failed to submit report.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (report: MyReport) => {
    const nextStatus = report.status === "active" ? "resolved" : "active";
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/hazards/${report.id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Marked ${nextStatus}.`, "success");
        loadReports();
      } else {
        showToast(data.message || "Failed to update status.", "error");
      }
    } catch {
      showToast("Could not connect to server.", "error");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink">
      <header className="sticky top-0 z-10 h-16 px-3 sm:px-6 flex items-center justify-between bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Logo size={24} showWordmark={false} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/hazard-response-report" className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink">
            <ShieldAlert size={16} /> <span className="hidden sm:inline">Response Report</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold">{title}</h1>
          <p className="text-brand-muted text-sm mt-1">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map picker */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted">Drag the pin to the affected location</p>
            <div className="h-80 rounded-2xl overflow-hidden border border-brand-border shadow-sm">
              <Map center={[pin.lng, pin.lat]} zoom={12}>
                <MapMarker
                  draggable
                  longitude={pin.lng}
                  latitude={pin.lat}
                  onDrag={(lngLat) => setPin({ lng: lngLat.lng, lat: lngLat.lat })}
                  onDragEnd={(lngLat) => setPin({ lng: lngLat.lng, lat: lngLat.lat })}
                >
                  <MarkerContent>
                    <div className="relative">
                      <div className="absolute inset-0 -m-4 rounded-full bg-red-500/20 animate-ping" />
                      <div className="relative z-10 bg-red-600 p-2 rounded-lg shadow-lg border border-red-400">
                        <MapPin size={16} className="text-white" />
                      </div>
                    </div>
                  </MarkerContent>
                </MapMarker>
              </Map>
            </div>
            <p className="text-xs text-brand-muted">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</p>

            <div className="flex flex-wrap gap-2">
              {hazardTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setHazardType(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors ${
                    hazardType === opt.value
                      ? "bg-brand-ink text-white border-brand-ink"
                      : "bg-white text-brand-muted border-brand-border hover:border-brand-ink"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={submitReport}
              disabled={submitting}
              className={`w-full h-11 rounded-xl text-white font-bold text-sm transition-colors ${accentClass} disabled:opacity-50`}
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </div>

          {/* My reports */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted mb-3">My Reports</p>
            <div className="border border-brand-border rounded-2xl overflow-hidden">
              {loadingReports ? (
                <p className="p-6 text-sm text-brand-muted">Loading…</p>
              ) : reports.length === 0 ? (
                <p className="p-6 text-sm text-brand-muted">No reports filed yet.</p>
              ) : (
                <ul className="divide-y divide-brand-border max-h-[26rem] overflow-y-auto">
                  {reports.map((r) => (
                    <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-sm capitalize">{r.hazardType.replace(/_/g, " ")}</p>
                        <p className="text-xs text-brand-muted">
                          {/* MySQL DECIMAL columns come back as strings over JSON, not numbers */}
                          {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)} · {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            r.status === "active" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {r.status}
                        </span>
                        <button
                          onClick={() => toggleStatus(r)}
                          title={r.status === "active" ? "Mark resolved" : "Reopen"}
                          className="p-2 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-bg"
                        >
                          {r.status === "active" ? <Check size={16} /> : <RotateCcw size={16} />}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-[999] ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
