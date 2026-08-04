import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogOut, RefreshCw, TrendingUp, Sparkles, ArrowUpDown, ClipboardList, ShieldAlert } from "lucide-react";
import { Map, MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import Logo from "@/components/Logo";
import ReportExportButtons from "@/components/ReportExportButtons";
import { usePageTitle } from "@/lib/usePageTitle";
import { API_BASE_URL } from "@/lib/apiConfig";

const CONFIG = {
  API_BASE_URL,
};

interface Hotspot {
  lat: number;
  lng: number;
  count: number;
  hazardTypes: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const riskColor: Record<Hotspot["riskLevel"], string> = {
  HIGH: "#dc2626",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
};

export default function DataAnalystDashboard() {
  usePageTitle("Hotspot Report");
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [minCount, setMinCount] = useState(0);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [sortBy, setSortBy] = useState<"count" | "lat" | "lng">("count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [confirmLogout, setConfirmLogout] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (minCount > 0) params.set("minCount", String(minCount));
    if (includeResolved) params.set("includeResolved", "true");
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    return params.toString();
  }, [minCount, includeResolved, sortBy, sortDir]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/reports/hotspots?${queryString}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.success) {
        setHotspots(data.hotspots);
        setGeneratedAt(data.generatedAt);
      } else {
        setError(data.message || "Failed to generate hotspot report.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [queryString]);

  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  // This dashboard must only be left via the logout button — mirrors the
  // admin portal's guard (AdminSidebarLayout). Pressing the browser Back
  // button re-pushes the current URL (canceling the navigation) and offers
  // to log out instead of silently trapping the user.
  useEffect(() => {
    const pushGuard = () => window.history.pushState(null, "", window.location.href);
    pushGuard();
    const onPopState = () => {
      pushGuard();
      setConfirmLogout(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Typing a new URL into the address bar is a full page navigation that JS
  // can't intercept or replace with a custom prompt — beforeunload is the
  // only hook browsers allow, and it can only trigger their own generic
  // "Leave site?" confirmation.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const center: [number, number] = hotspots.length
    ? [hotspots[0].lng, hotspots[0].lat]
    : [28.1914, -25.7566];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink">
      <header className="sticky top-0 z-10 h-16 px-3 sm:px-6 flex items-center justify-between bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Logo size={24} showWordmark={false} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/trip-report" className="hidden md:flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink">
            <ClipboardList size={16} /> <span className="hidden lg:inline">Trip Report</span>
          </Link>
          <Link to="/ai-candidates" className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink">
            <Sparkles size={16} /> <span className="hidden sm:inline">Live Risk Intelligence</span>
          </Link>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink">
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <TrendingUp className="text-brand-blue shrink-0" /> Hotspot Report
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              Areas with repeated hazard reports, clustered geographically to highlight the most dangerous zones.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ReportExportButtons basePath={`/api/reports/hotspots?${queryString}`} filename="hotspot_report" />
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
            >
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        </div>

        <div className="flex items-end gap-3 flex-wrap bg-white border border-brand-border rounded-2xl p-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Min. Count</label>
            <input
              type="number"
              min={0}
              value={minCount}
              onChange={(e) => setMinCount(Math.max(0, Number(e.target.value)))}
              className="border border-brand-border rounded-lg px-3 py-1.5 text-sm w-24"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-brand-muted mb-1">Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "count" | "lat" | "lng")} className="border border-brand-border rounded-lg px-3 py-1.5 text-sm">
              <option value="count">Count</option>
              <option value="lat">Latitude</option>
              <option value="lng">Longitude</option>
            </select>
          </div>
          <button
            onClick={toggleSortDir}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-sm font-semibold hover:border-brand-blue/40"
            title="Toggle sort direction"
          >
            <ArrowUpDown size={14} /> {sortDir === "asc" ? "Ascending" : "Descending"}
          </button>
          <label className="flex items-center gap-2 text-sm font-semibold text-brand-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              className="size-4 accent-brand-blue"
            />
            Include resolved
          </label>
          <Link
            to="/hazard-response-report"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border text-sm font-semibold hover:border-brand-blue/40 ml-auto"
          >
            <ShieldAlert size={14} /> Hazard Response Report
          </Link>
        </div>

        {generatedAt && <p className="text-xs text-brand-muted">Generated {new Date(generatedAt).toLocaleString()}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 rounded-2xl overflow-hidden border border-brand-border shadow-sm">
            <Map center={center} zoom={9}>
              {hotspots.map((h, i) => (
                <MapMarker key={i} longitude={h.lng} latitude={h.lat}>
                  <MarkerContent>
                    <div
                      className="rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold"
                      style={{
                        backgroundColor: riskColor[h.riskLevel],
                        width: 18 + Math.min(h.count, 10) * 3,
                        height: 18 + Math.min(h.count, 10) * 3,
                      }}
                    >
                      {h.count}
                    </div>
                  </MarkerContent>
                  <MarkerPopup className="text-xs">
                    <p className="font-bold capitalize">{h.riskLevel.toLowerCase()} risk</p>
                    <p>{h.count} report(s)</p>
                    <p className="text-brand-muted">{h.hazardTypes.join(", ")}</p>
                  </MarkerPopup>
                </MapMarker>
              ))}
            </Map>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand-muted mb-3">Ranked Hotspots</p>
            <div className="border border-brand-border rounded-2xl overflow-hidden">
              {loading ? (
                <p className="p-6 text-sm text-brand-muted">Generating…</p>
              ) : hotspots.length === 0 ? (
                <p className="p-6 text-sm text-brand-muted">No hazard clusters yet — needs more reports in the same area.</p>
              ) : (
                <ul className="divide-y divide-brand-border max-h-[22rem] overflow-y-auto">
                  {hotspots.map((h, i) => (
                    <li key={i} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{h.lat.toFixed(3)}, {h.lng.toFixed(3)}</p>
                        <p className="text-xs text-brand-muted capitalize">{h.hazardTypes.join(", ").replace(/_/g, " ")}</p>
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-1 rounded-full text-white shrink-0"
                        style={{ backgroundColor: riskColor[h.riskLevel] }}
                      >
                        {h.riskLevel} · {h.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {confirmLogout && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-brand-ink">Log out?</h3>
            <p className="text-sm text-brand-muted mt-2">
              You can't go back to the site from this dashboard. Would you like to log out instead?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="px-4 py-2 rounded-lg border border-brand-border text-sm font-semibold text-brand-muted hover:text-brand-ink"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-[#171e5b] text-white text-sm font-semibold hover:opacity-90"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
