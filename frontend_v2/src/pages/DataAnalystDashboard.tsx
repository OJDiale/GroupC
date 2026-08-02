import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { LogOut, ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { Map, MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import Logo from "@/components/Logo";

const CONFIG = {
  API_BASE_URL: (window as unknown as { CONFIG?: { API_BASE_URL?: string } }).CONFIG?.API_BASE_URL || "https://mapper-backend-brkn.onrender.com",
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
  const navigate = useNavigate();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/api/reports/hotspots`, { headers: getAuthHeaders() });
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

  useEffect(() => { load(); }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const center: [number, number] = hotspots.length
    ? [hotspots[0].lng, hotspots[0].lat]
    : [28.1914, -25.7566];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-ink">
      <header className="sticky top-0 z-10 h-16 px-6 flex items-center justify-between bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="text-brand-muted hover:text-brand-ink" title="Back to site">
            <ArrowLeft size={18} />
          </button>
          <Logo size={26} />
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-brand-ink">
          <LogOut size={16} /> Log out
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
              <TrendingUp className="text-brand-blue" /> Hotspot Report
            </h1>
            <p className="text-brand-muted text-sm mt-1">
              Areas with repeated hazard reports, clustered geographically to highlight the most dangerous zones.
            </p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-ink text-white text-sm font-semibold hover:bg-brand-blue-dark"
          >
            <RefreshCw size={14} /> Regenerate
          </button>
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
    </div>
  );
}
