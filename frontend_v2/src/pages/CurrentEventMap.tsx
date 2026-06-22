import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { TriangleAlert, Radio, Loader2, Navigation, ShieldCheck, MapPin, Clock } from "lucide-react";
import { MapMarker, MarkerContent, MarkerPopup } from "@/components/ui/map";
import { fetchAndResolveHazardReports,  type UIHazardReport } from "@/lib/utils";

// --- TYPES ---
type DraggableMarker = { lat: number; lng: number };
type PlaceInformation = { city: string; street: string };

// --- REUSABLE BEACON VISUAL ---
const BeaconVisual = ({ severity }: { severity: string }) => (
  <div className="relative flex items-center justify-center cursor-pointer group">
    <div className={`relative z-20 size-4 rounded-full border-2 border-white shadow-xl transition-transform group-hover:scale-125 ${severity === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'}`} />
    <div className={`absolute z-10 size-8 rounded-full animate-ping ${severity === 'CRITICAL' ? 'bg-red-600/40' : 'bg-orange-500/40'}`} />
  </div>
);

// --- COMPONENT: STATIC HAZARD BEACON ---
function HazardBeacon({ report }: { report: UIHazardReport}) {
  
  const [loading, setLoading] = useState(false);

 

  return (
    <MapMarker longitude={report.lng} latitude={report.lat}>
      <MarkerContent >
        <BeaconVisual severity={report.severity} />
      </MarkerContent>
      <MarkerPopup>
        <div className="w-64 p-1 space-y-3">
          {/* Dynamic Severity Header Banner */}
          <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-white ${report.severity === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-600'}`}>
            <div className="flex items-center gap-1.5">
              <TriangleAlert size={14} />
              <span className="text-[10px] font-black uppercase tracking-wider">{report.severity} Alert</span>
            </div>
            <span className="text-[9px] font-mono opacity-70">{report.id}</span>
          </div>

          {/* Telemetry Point Information */}
          <div className="space-y-2.5">
            <div>
              <h3 className="text-base font-black text-neutral-950 capitalize tracking-tight">
                {report.type ? report.type.replace('_', ' ') : 'Incident Reported'}
              </h3>
              
              {loading ? (
                <div className="flex items-center gap-1.5 mt-2 text-neutral-500">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs italic">Fetching localized details...</span>
                </div>
              ) : (
                <div className="mt-2 space-y-1.5 text-xs text-neutral-800">
                  {report.info.street || report.info.city ? (
                    <>
                      <div className="flex items-start gap-1.5">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-red-600" />
                        <span className="font-bold text-neutral-900">
                          {report.info.street || "Live User Report Location"}
                        </span>
                      </div>
                      
                      <div className="pl-5 text-[11px] text-neutral-600 font-bold">
                        <span>{report.info.city || "Gauteng Region"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-neutral-500 italic text-[11px]">
                      <MapPin size={13} className="shrink-0" />
                      <span>Click marker to load full address details</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verification status and Author Identity Handle */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-[9px] uppercase font-bold tracking-tight">
              <div className="flex items-center gap-1 text-emerald-700 max-w-[50%] truncate" title={`Reported by ${report.userName}`}>
                <ShieldCheck size={12} className="shrink-0" />
                <span className="truncate">@{report.userName || "System"}</span>
              </div>
              
              <div className="text-neutral-500 flex items-center gap-1 font-bold">
                <Clock size={10} />
                <span>{report.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </MarkerPopup>
    </MapMarker>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function GlobalThreatMonitor() {
  const apiKey = "5e7b1eab70f24694a61d4362ce38f88e";
  const [reports, setReports] = useState<UIHazardReport[]>([]);
  const { draggableMarker }: { draggableMarker: DraggableMarker } = useOutletContext();
  const [pinnedInfo, setPinnedInfo] = useState<PlaceInformation>({ city: "", street: "" });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sync state data layers directly from the relational database infrastructure
  useEffect(() => {
    async function getData() {
      try {
        const data = await fetchAndResolveHazardReports(setReports)
      } catch (err) {
        console.error("Could not complete threat matrix telemetric synchronization:", err);
      }
    }
    getData();
  
  }, [reports.length]);

  // Compute physical street descriptors for the user's selector pin placement
  useEffect(() => {
    if (!draggableMarker?.lat || !draggableMarker?.lng) return;
    setIsGeocoding(true);
    fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${draggableMarker.lat}&lon=${draggableMarker.lng}&format=json&apiKey=${apiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results?.[0]) {
          setPinnedInfo({
            city: data.results[0].city || data.results[0].county || "Analyzing...",
            street: data.results[0].street || data.results[0].name || "Mapping location...",
          });
        }
      })
      .catch(err => console.error("Live selector spatial evaluation dropped:", err))
      .finally(() => setIsGeocoding(false));
  }, [draggableMarker]);

  return (
    <>
      {/* Dynamic database reports */}
      {reports.map((report) => (
        <HazardBeacon key={report.id} report={report} />
      ))}

      {/* Interactive Active Target selector overlay tracking state */}
      {draggableMarker && (
        <MapMarker longitude={draggableMarker.lng} latitude={draggableMarker.lat}>
          <MarkerContent>
            <BeaconVisual severity="CRITICAL" />
          </MarkerContent>
          
          <MarkerPopup className="p-0 m-0 border-none shadow-none">
            <div className="w-72 overflow-hidden rounded-2xl border-2 border-blue-500/50 bg-slate-950 shadow-[0_0_25px_rgba(59,130,246,0.3)] backdrop-blur-xl">
              <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Radio size={16} className="animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Live Selector</span>
                </div>
                <Navigation size={14} className="text-white/80" />
              </div>

              <div className="p-4">
                {isGeocoding ? (
                  <div className="flex flex-col items-center py-4 space-y-3">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <p className="text-xs text-blue-300 font-medium animate-pulse">SYNCHRONIZING COORDINATES</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Current Sector</p>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {pinnedInfo.street}
                      </h3>
                      <p className="text-sm text-slate-400">{pinnedInfo.city}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-[8px] text-slate-500 uppercase">Latitude</p>
                        <p className="text-[10px] font-mono text-blue-300">{draggableMarker.lat.toFixed(5)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 text-center">
                        <p className="text-[8px] text-slate-500 uppercase">Longitude</p>
                        <p className="text-[10px] font-mono text-blue-300">{draggableMarker.lng.toFixed(5)}</p>
                      </div>
                    </div>
                    
                    <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Navigation size={12} />
                      Set as Target
                    </button>
                  </div>
                )}
              </div>
            </div>
          </MarkerPopup>
        </MapMarker>
      )}
    </>
  );
}
