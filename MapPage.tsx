import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useSearchParams } from "react-router";
import {
  Mountain, Map as MapIcon,
  History, Radio,
  Navigation2,
  AlertTriangle,
  TriangleAlert,
  Sparkles,
  BrainCircuit,
  LocateFixed,
  MapPin,
  Check,
  X as XIcon
} from "lucide-react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, type MapRef } from "@/components/ui/map";
import type { LngLatLike } from "maplibre-gl";
import DialogDemo from "../components/Popup";
import { Button } from "@/components/ui/button";
import spaceImage from "../assets/space_image.jpg"
import { type RouteData } from "../lib/types"
import {
  fetchRoutes,
  doesRouteInterceptAvoidZone,
  fetchSafeRoadRoute,
  type GeoCoordinate,
  submitHazardReport,
  fetchAndResolveHazardReports,
  logUserDestination,
  endUserTrip,
  geocodeReverse,
  geocodeAutocomplete,
  // ── SafeMaster rerouting ──────────────────────────────────────────────────
  generateSafeRoute,
  type SafeRouteResult,
  type HazardPoint,
} from "../lib/utils"
import Layer from "@/components/AvoidPlaceLayer";
import { toast } from "react-hot-toast";
import { SubscriptionDrawer } from "@/components/SubscriptionDrawer";
import Logo from "@/components/Logo";
import NotificationCenter from "@/components/NotificationCenter";
import { usePageTitle } from "@/lib/usePageTitle";

type Role = "ADMIN" | "PREMIUM" | "USER"

export default function MapPage(): React.JSX.Element {
  usePageTitle("Map");
  const styles = {
    default: undefined,
    openstreetmap: "https://tiles.openfreemap.org/styles/bright",
    openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
  };

  type StyleKey = keyof typeof styles;
  const [coords, setCoords] = useState<LngLatLike | undefined>([28.1914, -25.7566]);
  const [locationSearched, setLocationSearched] = useState({ name: "", lon: 0, lat: 0 });
  const [dataSuggested, setDataSuggested] = useState([]);
  const [style, setStyle] = useState<StyleKey>("openstreetmap");
  const mapRef = useRef<MapRef>(null);

  // Tracks whether we've already flown in to the user's first GPS fix, so
  // we only auto-zoom once on page load rather than every position update.
  const hasCenteredOnUser = useRef(false);

  // ── Edge-scroll while dragging a marker ─────────────────────────────────
  // When a dragged marker (report pin or destination pin) nears the edge of
  // the visible map, keep panning the map underneath it — opening up new
  // territory on that side — so the user doesn't have to drop, manually
  // pan, and pick the drag back up again.
  const edgeScrollRafRef = useRef<number | null>(null);

  /** Cancel any running edge-scroll loop. */
  function stopEdgeScroll() {
    if (edgeScrollRafRef.current !== null) {
      cancelAnimationFrame(edgeScrollRafRef.current);
      edgeScrollRafRef.current = null;
    }
  }

  /**
   * Called continuously while a marker is being dragged.
   * If the pointer is within EDGE_ZONE px of any side of the map canvas,
   * the map pans toward that side at a speed proportional to proximity.
   */
  function handleMarkerDragEdgeScroll(lngLat: { lng: number; lat: number }) {
    const map = mapRef.current;
    if (!map) return;

    const canvas = map.getCanvas();
    const rect = canvas.getBoundingClientRect();

    // Convert the marker's current geo-position to screen pixels
    const point = map.project([lngLat.lng, lngLat.lat]);
    const px = point.x;
    const py = point.y;

    const EDGE_ZONE = 80;   // px from edge that triggers scrolling
    const MAX_SPEED = 12;   // max px per frame the map pans

    function speedFor(dist: number): number {
      // Linear ramp: full speed at edge, zero at EDGE_ZONE
      return Math.round(MAX_SPEED * (1 - dist / EDGE_ZONE));
    }

    let dx = 0;
    let dy = 0;

    if (px < EDGE_ZONE)                    dx = -speedFor(px);
    else if (px > rect.width - EDGE_ZONE)  dx =  speedFor(rect.width - px);
    if (py < EDGE_ZONE)                    dy = -speedFor(py);
    else if (py > rect.height - EDGE_ZONE) dy =  speedFor(rect.height - py);

    stopEdgeScroll();

    if (dx === 0 && dy === 0) return; // not near any edge

    function scroll() {
      map!.panBy([dx, dy], { duration: 0, animate: false });
      edgeScrollRafRef.current = requestAnimationFrame(scroll);
    }
    edgeScrollRafRef.current = requestAnimationFrame(scroll);
  }

  useEffect(() => {
    return () => stopEdgeScroll(); // clean up if component unmounts mid-drag
  }, []);

  const is3D = style === "openstreetmap3d";
  const selectedStyle = styles[style];
  const [report, setReport] = useState<boolean>(false)
  const [draggableMarker, setDraggableMarker] = useState({
    lng: (coords[0] as number),
    lat: (coords[1] as number),
  });

  // ── Pick destination by dragging a pin on the map ──────────────────────────
  const [pickingDestination, setPickingDestination] = useState<boolean>(false)
  const [destinationPin, setDestinationPin] = useState({
    lng: (coords[0] as number),
    lat: (coords[1] as number),
  });
  const [destinationPinAddress, setDestinationPinAddress] = useState<string>("")
  const [resolvingPinAddress, setResolvingPinAddress] = useState<boolean>(false)

  // ── End Trip (trip lifecycle) ──────────────────────────────────────────────
  const [activeTripId, setActiveTripId] = useState<number | null>(null)
  const [endingTrip, setEndingTrip] = useState<boolean>(false)

  useEffect(() => {
    if (!coords) return;
    setDraggableMarker({
      lng: coords[0] as number,
      lat: coords[1] as number,
    });
  }, [coords]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams()
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [disPlacesToAvoid, setDisPlacesToAvoid] = useState<boolean>(false)

  const [avoidanceGeoJSON, setAvoidanceGeoJSON] = useState({
    type: "FeatureCollection",
    features: []
  });

  const distinationLon = searchParams.get("lon") && Number(searchParams.get("lon"))
  const distinationLat = searchParams.get("lat") && Number(searchParams.get("lat"))
  const [isCalculating, setIsCalculating] = useState(false);
  const [data, setData] = useState<Array<GeoCoordinate>>([])
  const [placesToAvoid, setPlacesToAvoid] = useState<[number, number][]>([])
  const [openSubscripDraw, setOpenSubscripDraw] = useState<boolean>(false)
  const [userRole, setUserRole] = useState<Role>("USER");
  const [hazardType, setHazardType] = useState<string>("accident");
  const isEmpty: boolean = searchParams.get("lon") === null && searchParams.get("lat") === null

  // ── SafeMaster rerouting state ─────────────────────────────────────────────
  const [safeRouteResult, setSafeRouteResult] = useState<SafeRouteResult | null>(null);
  const [selectedAltIndex, setSelectedAltIndex] = useState<number | null>(null);
  // Alert sensitivity: minimum riskScore before a route-check toast fires.
  // 0 = always notify (matches the original always-on behavior); higher
  // values quiet down notifications from the background re-route poller
  // so a driver on a route with only minor, low-scoring hazards nearby
  // isn't interrupted every 90s.
  const [alertThreshold, setAlertThreshold] = useState(0);

  // 2. LOGIC: Handle Geolocation (Run once on mount)
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next: LngLatLike = [pos.coords.longitude, pos.coords.latitude];
        setCoords(next);

        // On the very first GPS fix, fly the map in to the user's location
        // instead of leaving it at the initial globe-view zoom.
        if (!hasCenteredOnUser.current) {
          hasCenteredOnUser.current = true;
          mapRef.current?.flyTo({
            center: next,
            zoom: 14,
            duration: 1500,
          });
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // runCheck — full SafeMaster-style route check + rerouting
  // ─────────────────────────────────────────────────────────────────────────
  async function runCheck() {
    if (!coords || !distinationLat || !distinationLon) {
      console.warn("Missing coordinates for routing");
      return;
    }

    setIsCalculating(true);
    setIsLoading(true);
    setSafeRouteResult(null);
    setSelectedAltIndex(null);

    // 1. Fetch standard OSRM routes (for the Outlet / MapCurrent display)
    await fetchRoutes(coords as [number, number], distinationLat, distinationLon, setRoutes, setIsLoading);

    // 2. Fetch hazard reports from backend
    const uHazardReports = await fetchAndResolveHazardReports();
    const hazards: HazardPoint[] = uHazardReports.map((r) => ({
      lat: r.lat,
      lon: r.lng,
      severity: r.severity === "CRITICAL" ? 9 : r.severity === "HIGH" ? 6 : 3,
    }));

    // Also add the draggable marker position as a hazard point if reporting
    const accidentCoords: [number, number][] = uHazardReports.map((r) => [r.lng, r.lat]);
    setPlacesToAvoid([...accidentCoords, [draggableMarker.lng, draggableMarker.lat]]);

    // 3. Run SafeMaster-style route generation with risk scoring + detours
    const startCoord: GeoCoordinate = [coords[0] as number, coords[1] as number];
    const endCoord: GeoCoordinate = [distinationLon as number, distinationLat as number];

    let result: SafeRouteResult | null = null;
    try {
      result = await generateSafeRoute(startCoord, endCoord, hazards);
      setSafeRouteResult(result);
    } catch (err) {
      console.error("generateSafeRoute failed:", err);
    }

    // 4. Build avoidance features for the Layer overlay
    const newFeatures: any[] = [];
    accidentCoords.forEach((point, index) => {
      if (
        doesRouteInterceptAvoidZone(routes[0]?.coordinates, point as [number, number]) ||
        doesRouteInterceptAvoidZone(routes[1]?.coordinates, point as [number, number])
      ) {
        newFeatures.push({
          type: "Feature",
          properties: {
            name: "High Accident Zone",
          },
          geometry: {
            type: "Point",
            coordinates: point,
          },
        });
      }
    });

    setAvoidanceGeoJSON({ type: "FeatureCollection", features: newFeatures });
    setDisPlacesToAvoid(newFeatures.length > 0);

    // 5. Toast notification — SafeMaster style with risk level, suppressed
    // below the driver's chosen alert-sensitivity threshold.
    if (result && result.riskScore >= alertThreshold) {
      const riskColor =
        result.riskLevel === "SAFE"
          ? "text-green-400"
          : result.riskLevel === "WARNING"
          ? "text-yellow-400"
          : "text-red-400";

      if (result.riskLevel === "SAFE" && result.incidentsOnRoute === 0) {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-xs w-full bg-slate-900/95 border border-blue-500/40 shadow-xl 
                rounded-lg pointer-events-auto flex backdrop-blur-md overflow-hidden group`}
            >
              <div className="w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <div className="flex-1 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-blue-500/20 flex items-center justify-center border border-blue-400/20">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-blue-400 uppercase tracking-tighter">
                      AI Scan Complete
                    </p>
                    <p className="text-xs text-slate-200 font-medium truncate">
                      Route is clear. Proceed safely.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 border-l border-slate-800 text-[10px] font-bold uppercase 
                           text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                Hide
              </button>
            </div>
          ),
          { duration: 3000, position: "top-center" }
        );
      } else {
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? "animate-enter" : "animate-leave"
              } max-w-xs w-full bg-slate-900/95 border border-blue-500/40 shadow-xl 
                rounded-lg pointer-events-auto flex backdrop-blur-md overflow-hidden group`}
            >
              <div className="w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <div className="flex-1 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-md bg-blue-500/20 flex items-center justify-center border border-blue-400/20">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-blue-400 uppercase tracking-tighter">
                      AI Scan Complete
                    </p>
                    <p className={`text-xs font-medium truncate ${riskColor}`}>
                      {result.riskLevel} · {result.incidentsOnRoute} hazard(s) on route.
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {result.explanation}
                    </p>
                    {result.alternatives.length > 0 && (
                      <p className="text-[10px] text-blue-300 mt-0.5">
                        {result.alternatives.length} safer alternative(s) available.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  getData();
                  toast.dismiss(t.id);
                }}
                className="px-3 border-l border-slate-800 text-[10px] font-bold uppercase 
                           text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                Safe Path
              </button>
            </div>
          ),
          { duration: 60000, position: "top-center" }
        );
      }
    }

    setIsLoading(false);
    setIsCalculating(false);
  }

  async function getData() {
    const data = await fetchSafeRoadRoute(
      [coords[0] as number || 0, coords[1] as number || 0],
      [distinationLon as number, distinationLat as number],
      placesToAvoid
    )
    setData(data)
  }

  function subscribe() {
    runCheck()
  }

  // ── Background re-route poller (Phase 6 proposal gap) ───────────────────
  // While a trip is active, periodically re-run the exact same SafeMaster
  // check the "AI SAFE PATH" button triggers — same runCheck(), same toast
  // prompt UI, no new scoring logic (parallel-port rule: nothing to mirror
  // here since the scoring itself is untouched). Catches hazards reported
  // by other users after the driver already started their trip. A ref
  // holds the latest runCheck closure so the interval always sees current
  // coords/destination without needing to be torn down and rebuilt on
  // every geolocation update.
  const runCheckRef = useRef(runCheck);
  runCheckRef.current = runCheck;

  useEffect(() => {
    if (!activeTripId) return;
    const REROUTE_POLL_MS = 90000;
    const interval = setInterval(() => {
      runCheckRef.current();
    }, REROUTE_POLL_MS);
    return () => clearInterval(interval);
  }, [activeTripId]);

  // 3. LOGIC: Handle Search API (Debounced)
  useEffect(() => {
    if (!locationSearched.name || locationSearched.lat !== 0) {
      if (!locationSearched.name) setDataSuggested([]);
      return;
    }

    const timer = setTimeout(() => {
      geocodeAutocomplete(locationSearched.name)
        .then(features => setDataSuggested(features))
        .catch(err => console.error("Search error:", err));
    }, 800);

    return () => clearTimeout(timer);
  }, [locationSearched.name]);

  // 4. LOGIC: Fly to searched location
  useEffect(() => {
    if (locationSearched.lat !== 0 && locationSearched.lon !== 0) {
      mapRef.current?.flyTo({
        center: [locationSearched.lon, locationSearched.lat],
        zoom: 14,
        duration: 2000
      });
    }
  }, [locationSearched.lat, locationSearched.lon]);

  const handleFlyTo = (coords: [number, number]) => {
    mapRef.current?.flyTo({ center: [coords[0], coords[1]], zoom: 12 });
  };

  // ── Pick destination by dragging a pin on the map ──────────────────────────
  function startPickingDestination() {
    if (pickingDestination) {
      setPickingDestination(false);
      return;
    }
    setReport(false);
    const startLng = coords[0] as number;
    const startLat = coords[1] as number;
    setDestinationPin({ lng: startLng, lat: startLat });
    setDestinationPinAddress("");
    setPickingDestination(true);
    handleFlyTo([startLng, startLat]);
    resolvePinAddress(startLng, startLat);
  }

  async function resolvePinAddress(lng: number, lat: number) {
    setResolvingPinAddress(true);
    try {
      const point = await geocodeReverse(lat, lng);
      const formatted = point?.formatted;
      setDestinationPinAddress(formatted || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch (err) {
      console.error("Failed to resolve dropped pin address:", err);
      setDestinationPinAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setResolvingPinAddress(false);
    }
  }

  async function confirmDestinationPin() {
    const name = destinationPinAddress || `${destinationPin.lat.toFixed(5)}, ${destinationPin.lng.toFixed(5)}`;
    setLocationSearched({ name, lon: destinationPin.lng, lat: destinationPin.lat });
    setSearchParams({ name, lon: String(destinationPin.lng), lat: String(destinationPin.lat) });
    setPickingDestination(false);

    // Log the trip the same way a search-picked destination is logged.
    try {
      const stPoint = await geocodeReverse(coords[1] as number, coords[0] as number);
      const sl = stPoint?.formatted;
      const logResult = await logUserDestination({ startLocation: sl, endLocation: name }, localStorage.getItem("token") || "");
      if (logResult.logId) setActiveTripId(logResult.logId);
    } catch (err) {
      console.error("Failed to log dropped-pin destination:", err);
    }
  }

  async function endTrip() {
    if (!activeTripId) return;
    setEndingTrip(true);
    try {
      const result = await endUserTrip(activeTripId, localStorage.getItem("token") || "");
      if (result.success) {
        toast.success("Trip ended. Glad you made it safely.");
        setActiveTripId(null);
        setSafeRouteResult(null);
        setSelectedAltIndex(null);
        setRoutes([]);
        setSearchParams({});
        setLocationSearched({ name: "", lon: 0, lat: 0 });
      } else {
        toast.error(result.message || "Failed to end trip.");
      }
    } finally {
      setEndingTrip(false);
    }
  }

  return (
    <main className="relative h-screen w-full overflow-hidden font-sans antialiased text-slate-100">
  
      <header className="absolute top-3 left-3 right-3 sm:top-6 sm:left-6 sm:right-6 z-[1000] flex items-start gap-2 pointer-events-none flex-wrap">
        <Link
          to="/"
          title="Back to Mapper home"
          className="flex items-center justify-center size-10 sm:size-11 shrink-0 rounded-2xl bg-slate-900/90 backdrop-blur-2xl shadow-2xl border border-blue-500/30 pointer-events-auto text-slate-300 hover:text-blue-300 transition-colors"
        >
          <Logo size={20} showWordmark={false} ringClassName="text-slate-300" />
        </Link>

        <div className="flex items-center justify-center size-10 sm:size-11 shrink-0 rounded-2xl bg-slate-900/90 backdrop-blur-2xl shadow-2xl border border-blue-500/30 pointer-events-auto">
          <NotificationCenter dark />
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-slate-900/90 backdrop-blur-2xl p-1.5 rounded-2xl shadow-2xl border border-blue-500/30 pointer-events-auto max-w-full">

          <div className="flex items-center bg-blue-950/40 rounded-xl px-2 border border-white/10 mr-1">
            <DialogDemo
              locationSearched={locationSearched}
              setLocationSearched={setLocationSearched}
              locationsSuggests={dataSuggested?.map((data, i) => (
                <div
                  key={i}
                  className="p-3 flex items-center gap-2 hover:bg-blue-900/40 cursor-pointer transition-colors border-b border-slate-800 last:border-0"
                  onClick={async () => {
                    const destinationName = data?.properties?.formatted;
                    setLocationSearched({
                      name: destinationName,
                      lon: data?.geometry?.coordinates[0],
                      lat: data?.geometry?.coordinates[1]
                    })
                    const stPoint = await geocodeReverse(coords[1] as number, coords[0] as number)
                    const sl = stPoint?.formatted
                    const logResult = await logUserDestination({ startLocation: sl, endLocation: destinationName }, localStorage.getItem("token") || "")
                    if (logResult.logId) setActiveTripId(logResult.logId)
                  }}
                >
                  <Navigation2 size={14} className="text-blue-400 rotate-45" />
                  <span className="text-xs text-slate-300">{data?.properties?.formatted}</span>
                </div>
              ))}
            />
          </div>

          <button
            onClick={startPickingDestination}
            title="Drop a pin to choose a destination"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-10 sm:h-11 rounded-xl mr-1 border text-[10px] font-bold uppercase tracking-wide transition-all
              ${pickingDestination
                ? "bg-blue-600 border-blue-400 text-white"
                : "bg-blue-950/40 border-white/10 text-blue-300 hover:bg-blue-900/40"}`}
          >
            <MapPin size={16} /> <span className="hidden lg:inline">Drop Pin</span>
          </button>

          <div
            className="hidden xl:flex items-center gap-2 px-3 h-10 sm:h-11 rounded-xl mr-1 border border-white/10 bg-blue-950/40"
            title="Minimum risk score before a route-check alert is shown"
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-300 whitespace-nowrap">
              Alert Sensitivity
            </span>
            <input
              type="range"
              min={0}
              max={70}
              step={5}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-20 accent-blue-500"
              aria-label="Alert sensitivity threshold"
            />
            <span className="text-[10px] font-mono text-slate-400 w-6">{alertThreshold}</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavLink to="/map" end title="Current route" className={({ isActive }) => `flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-300'}`}>
              <MapIcon size={16} /> <span className="hidden lg:inline">Route</span>
            </NavLink>
            <NavLink to="historical_events" title="Past hazard reports" className={({ isActive }) => `flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-300'}`}>
              <History size={16} /> <span className="hidden lg:inline">History</span>
            </NavLink>
            <NavLink to="current_events" title="Live hazard reports" className={({ isActive }) => `flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-300'}`}>
              <Radio size={16} /> <span className="hidden lg:inline">Live</span>
            </NavLink>
            <button
              onClick={() => handleFlyTo(coords as [number, number])}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-blue-300 hover:bg-blue-600/20 active:scale-90"
              title="Center on my location"
            >
              <LocateFixed size={16} /> <span className="hidden lg:inline">Me</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── SafeMaster: Route Risk Panel ─────────────────────────────────────── */}
      {safeRouteResult && (
        <div className="absolute top-20 left-3 right-3 sm:top-24 sm:left-6 sm:right-auto z-[999] sm:w-72 sm:max-w-xs bg-slate-900/95 border border-blue-500/30 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden">
          {/* Risk level header */}
          <div
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2
              ${safeRouteResult.riskLevel === "SAFE"
                ? "bg-green-600/20 text-green-400"
                : safeRouteResult.riskLevel === "WARNING"
                ? "bg-yellow-600/20 text-yellow-400"
                : "bg-red-600/20 text-red-400"}`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
            {safeRouteResult.riskLevel} · Score {safeRouteResult.riskScore.toFixed(0)}/100
          </div>

          {/* Best route */}
          <div
            className={`px-4 py-2.5 border-b border-slate-800 cursor-pointer transition-colors
              ${selectedAltIndex === null ? "bg-blue-600/10" : "hover:bg-slate-800/40"}`}
            onClick={() => setSelectedAltIndex(null)}
          >
            <p className="text-[11px] font-bold text-blue-300 truncate">
              {safeRouteResult.best.label}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
              {safeRouteResult.best.explanation}
            </p>
            {safeRouteResult.best.distanceM && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                {(safeRouteResult.best.distanceM / 1000).toFixed(1)} km
                {safeRouteResult.best.durationS
                  ? ` · ~${Math.round(safeRouteResult.best.durationS / 60)} min`
                  : ""}
              </p>
            )}
          </div>

          {/* Alternatives */}
          {safeRouteResult.alternatives.length > 0 && (
            <div className="px-4 pt-2 pb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
                Alternatives
              </p>
              <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1">
                {safeRouteResult.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors border
                      ${selectedAltIndex === i
                        ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                        : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:bg-slate-800"}`}
                    onClick={() => setSelectedAltIndex(i)}
                  >
                    <p className="text-[10px] font-bold truncate">{alt.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      {alt.incidentsOnRoute === 0 ? "✓ Clear" : `${alt.incidentsOnRoute} hazard(s)`}
                      {alt.distanceM ? ` · ${(alt.distanceM / 1000).toFixed(1)} km` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { setSafeRouteResult(null); setSelectedAltIndex(null); }}
            className="w-full py-2 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <section 
        style={{ 
          backgroundImage: `url(${spaceImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        }}
        className="absolute inset-0 z-0"
      >
        <Map
          projection={{ type: "globe" }}
          ref={mapRef}
          center={coords}
          zoom={3}
          styles={selectedStyle ? { light: selectedStyle, dark: selectedStyle } : undefined}
        >
          {disPlacesToAvoid && <Layer geojsonData={avoidanceGeoJSON} />} 

          {report && (
            <MapMarker
              draggable
              longitude={draggableMarker.lng}
              latitude={draggableMarker.lat}
              onDrag={(lngLat) => {
                setDraggableMarker({ lng: lngLat.lng, lat: lngLat.lat });
                handleMarkerDragEdgeScroll(lngLat);
              }}
              onDragEnd={(lngLat) => {
                stopEdgeScroll();
                setDraggableMarker({ lng: lngLat.lng, lat: lngLat.lat });
              }}
            >
              <MarkerContent>
                <div className="relative group cursor-crosshair">
                  <div className="absolute inset-0 -m-6 rounded-full bg-red-500/10 border border-red-500/20 animate-ping" />
                  <div className="relative z-10 bg-red-600 p-2.5 rounded-xl shadow-lg border border-red-400">
                    <TriangleAlert size={18} className="text-white" />
                  </div>
                </div>
              </MarkerContent>
              <MarkerPopup className="p-0 min-w-[200px]">
                <div className="flex flex-col gap-2.5 p-1">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-red-500">
                      Signal Location
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Select hazard type:</p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "pothole", label: "Pothole" },
                      { id: "construction", label: "Construction" },
                      { id: "road_block", label: "Roadblock" },
                      { id: "march", label: "March" },
                      { id: "accident", label: "Accident" },
                      { id: "other", label: "Other" },
                    ].map((hazard) => (
                      <label
                        key={hazard.id}
                        className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight text-center cursor-pointer border transition-all select-none
                          ${hazardType === hazard.id 
                            ? "bg-red-600/20 border-red-500 text-red-400" 
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800"}`}
                      >
                        <input
                          type="radio"
                          name="popup_hazard_type"
                          value={hazard.id}
                          checked={hazardType === hazard.id}
                          onChange={(e) => setHazardType(e.target.value)}
                          className="sr-only"
                        />
                        {hazard.label}
                      </label>
                    ))}
                  </div>

                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 h-8 rounded-lg text-[10px] font-bold border-none text-white mt-0.5"
                    onClick={async () => {
                      try {
                        await submitHazardReport({
                          latitude: draggableMarker.lat,
                          longitude: draggableMarker.lng,
                          hazardType: hazardType
                        });
                        toast.success("Hazard parameter pinned directly to ecosystem logs.");
                        setReport(false);
                      } catch (err) {
                        toast.error("Telemetry report pipeline dropped.");
                      }
                    }}
                  >
                    Confirm Report
                  </Button>
                </div>
              </MarkerPopup>
            </MapMarker>
          )}

          {pickingDestination && (
            <MapMarker
              draggable
              longitude={destinationPin.lng}
              latitude={destinationPin.lat}
              onDragStart={() => setDestinationPinAddress("")}
              onDrag={(lngLat) => {
                setDestinationPin({ lng: lngLat.lng, lat: lngLat.lat });
                handleMarkerDragEdgeScroll(lngLat);
              }}
              onDragEnd={(lngLat) => {
                stopEdgeScroll();
                setDestinationPin({ lng: lngLat.lng, lat: lngLat.lat });
                resolvePinAddress(lngLat.lng, lngLat.lat);
              }}
            >
              <MarkerContent>
                <div className="relative group cursor-grab active:cursor-grabbing">
                  <div className="absolute inset-0 -m-5 rounded-full bg-blue-500/10 border border-blue-500/20 animate-ping" />
                  <div className="relative z-10 bg-blue-600 p-2.5 rounded-xl shadow-lg border border-blue-400">
                    <MapPin size={18} className="text-white" />
                  </div>
                </div>
              </MarkerContent>
              <MarkerPopup className="p-0 min-w-[220px]">
                <div className="flex flex-col gap-2.5 p-1">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                      Dropped Pin
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      {resolvingPinAddress
                        ? "Resolving address…"
                        : destinationPinAddress || "Drag the pin, then tap it again to confirm."}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 rounded-lg text-[10px] font-bold border-none text-white flex items-center justify-center gap-1.5"
                      disabled={resolvingPinAddress}
                      onClick={confirmDestinationPin}
                    >
                      <Check size={14} /> Set as Destination
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      onClick={() => setPickingDestination(false)}
                      title="Cancel"
                    >
                      <XIcon size={14} />
                    </Button>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          )}

          {/*
            Pass safeRouteResult + selectedAltIndex to MapCurrent via Outlet context
            so it can render the correct route geometry (best or chosen alternative).
          */}
          <Outlet context={{ data, placesToAvoid, coords, locationSearched, draggableMarker, runCheck, safeRouteResult, selectedAltIndex }} />
          
          <div className="absolute bottom-24 right-10">
            <MapControls position="bottom-right" />
          </div>
        </Map>
      </section>

      <SubscriptionDrawer
        isOpen={openSubscripDraw} 
        onClose={() => setOpenSubscripDraw(false)}
        setValue={setUserRole}
      />

      <footer className="absolute bottom-4 sm:bottom-8 left-0 right-0 z-[1000] px-3 sm:px-6 pointer-events-none flex flex-col items-center gap-2">
        {pickingDestination ? (
          <div className="pointer-events-auto max-w-full text-center flex items-center gap-2 bg-slate-900/95 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-blue-500/30 shadow-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-blue-300">
            <MapPin size={12} className="shrink-0" /> <span>Drag the blue pin, then tap it to confirm your destination</span>
          </div>
        ) : isEmpty ? (
          <div className="pointer-events-auto max-w-full text-center flex items-center gap-2 bg-slate-900/95 backdrop-blur-2xl px-4 py-1.5 rounded-full border border-blue-500/30 shadow-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-blue-300">
            <Navigation2 size={12} className="shrink-0" /> <span>Search above or drop a pin, then tap AI SAFE PATH</span>
          </div>
        ) : activeTripId && (
          <button
            onClick={endTrip}
            disabled={endingTrip}
            className="pointer-events-auto max-w-full text-center flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 px-4 py-1.5 rounded-full border border-green-400 shadow-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wide text-white transition-colors"
          >
            <Check size={12} className="shrink-0" /> <span>{endingTrip ? "Ending trip…" : "Reached your destination? End Trip"}</span>
          </button>
        )}
        <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-1.5 sm:gap-4 pointer-events-auto bg-slate-900/95 backdrop-blur-2xl p-2 sm:p-2.5 rounded-[28px] border border-blue-500/30 shadow-2xl">

          <Button
            onClick={() => {
              setReport(prev => !prev);
              handleFlyTo([coords[0] as number, coords[1] as number]);
            }}
            title="Report danger"
            className={`h-10 px-3 sm:px-5 rounded-xl flex gap-2 items-center border text-[11px] font-bold tracking-wider transition-colors shrink-0
              ${
                report
                  ? "bg-red-600 border-red-400 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
          >
            <AlertTriangle size={16} />
            <span className="hidden sm:inline">REPORT DANGER</span>
          </Button>

          <div className="flex items-center gap-1.5 bg-blue-950/40 px-2 sm:px-3 py-1.5 rounded-lg border border-white/5 min-w-0">
            <Mountain size={14} className="text-blue-400 shrink-0" />
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as StyleKey)}
              className="bg-transparent text-white text-[9px] sm:text-[10px] font-bold uppercase outline-none cursor-pointer min-w-0 max-w-[4.5rem] sm:max-w-none"
            >
              <option value="default">Standard</option>
              <option value="openstreetmap">Detailed</option>
              <option value="openstreetmap3d">3D Terrain</option>
            </select>
          </div>

          <Button
            onClick={runCheck}
            disabled={isCalculating || isEmpty}
            title="AI Safe Path"
            className={`
              relative h-10 px-3 sm:px-5 overflow-hidden shrink-0
              bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900
              text-white border border-blue-500/40
              rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.2)]
              transition-all duration-300 group
              ${isCalculating ? 'opacity-70' : 'hover:border-blue-400 hover:scale-[1.02] active:scale-95'}
            `}
          >
            <div className="relative z-10 flex items-center gap-2">
              {isCalculating ? (
                <>
                  <BrainCircuit size={18} className="text-blue-300 animate-pulse" />
                  <span className="hidden sm:inline text-[10px] font-medium uppercase">Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">AI SAFE PATH</span>
                </>
              )}
            </div>
            {isCalculating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            )}
          </Button>
        </div>
      </footer>
    </main>
  );
}
