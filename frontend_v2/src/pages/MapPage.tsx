import { useEffect, useRef, useState } from "react";
import { Outlet, useSearchParams } from "react-router";
import {
  TriangleAlert,
  Sparkles,
  BrainCircuit,
  MapPin,
  Check,
  X as XIcon,
  Search,
  Navigation,
  UserCircle2,
  Play,
  Square,
} from "lucide-react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, type MapRef } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import spaceImage from "../assets/space_image.jpg"
import { type RouteData } from "../lib/types"
import {
  fetchRoutes,
  doesRouteInterceptAvoidZone,
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
import { usePageTitle } from "@/lib/usePageTitle";
import MapProfilePanel, { type MapStyleKey } from "@/components/MapProfilePanel";
import MapSidebar from "@/components/MapSidebar";
import { userData } from "../database/auth.js";

type Role = "ADMIN" | "PREMIUM" | "USER"

export default function MapPage(): React.JSX.Element {
  usePageTitle("Map");
  const styles = {
    default: undefined,
    openstreetmap: "https://tiles.openfreemap.org/styles/bright",
    openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
  };

  // Plain [lon, lat] tuple — never undefined, so indexing coords[0]/coords[1]
  // typechecks (LngLatLike is a union that can't be indexed safely) and the
  // map's center prop accepts the tuple directly.
  const [coords, setCoords] = useState<[number, number]>([28.1914, -25.7566]);
  const [locationSearched, setLocationSearched] = useState({ name: "", lon: 0, lat: 0 });
  const [dataSuggested, setDataSuggested] = useState<any[]>([]);
  const [style, setStyle] = useState<MapStyleKey>("openstreetmap");
  const mapRef = useRef<MapRef>(null);
  const hasCenteredOnUser = useRef(false);
  const selectedStyle = styles[style];
  const [report, setReport] = useState<boolean>(false)
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)
  const [profile, setProfile] = useState<{ username?: string; email?: string } | null>(null);
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

  useEffect(() => {
    userData().then(setProfile).catch(() => setProfile({}));
  }, []);

  const [, setIsLoading] = useState(true);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams()
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [disPlacesToAvoid, setDisPlacesToAvoid] = useState<boolean>(false)

  const [avoidanceGeoJSON, setAvoidanceGeoJSON] = useState<{
    type: "FeatureCollection";
    features: any[];
  }>({
    type: "FeatureCollection",
    features: []
  });

  const distinationLon = searchParams.get("lon") && Number(searchParams.get("lon"))
  const distinationLat = searchParams.get("lat") && Number(searchParams.get("lat"))
  const [isCalculating, setIsCalculating] = useState(false);
  const [placesToAvoid, setPlacesToAvoid] = useState<[number, number][]>([])
  const [openSubscripDraw, setOpenSubscripDraw] = useState<boolean>(false)
  const [, setUserRole] = useState<Role>("USER");
  const [hazardType, setHazardType] = useState<string>("accident");
  const hasDestination = searchParams.get("lon") !== null && searchParams.get("lat") !== null;

  // ── SafeMaster rerouting state ─────────────────────────────────────────────
  const [safeRouteResult, setSafeRouteResult] = useState<SafeRouteResult | null>(null);
  const [selectedAltIndex, setSelectedAltIndex] = useState<number | null>(null);
  // Separate from safeRouteResult itself so the Risk Score popup can be
  // dismissed (by starting the trip) while the calculated route it
  // produced keeps rendering on the map.
  const [showRiskPopup, setShowRiskPopup] = useState<boolean>(false);

  // 2. LOGIC: Handle Geolocation (Run once on mount)
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setCoords(next);
        // Center on the user's location the first time a fix comes in, so
        // the map opens there directly instead of the world-wide default
        // view that previously required pressing "Me" to escape.
        if (!hasCenteredOnUser.current) {
          hasCenteredOnUser.current = true;
          mapRef.current?.flyTo({ center: next, zoom: 12 });
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
      setShowRiskPopup(true);
    } catch (err) {
      console.error("generateSafeRoute failed:", err);
    }

    // 4. Build avoidance features for the Layer overlay
    const newFeatures: any[] = [];
    accidentCoords.forEach((point) => {
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

    // 5. Toast acknowledgment for the "route is clear" case only — the
    // hazard-detected case is surfaced via the Route Risk Panel instead
    // (which has working alternative-route selection), not a toast.
    if (result && result.riskLevel === "SAFE" && result.incidentsOnRoute === 0) {
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-xs w-full bg-white border border-brand-border shadow-xl
              rounded-lg pointer-events-auto flex overflow-hidden group`}
          >
            <div className="w-1 bg-brand-blue" />
            <div className="flex-1 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-md bg-brand-blue-soft flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-brand-blue" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-brand-blue uppercase tracking-tighter">
                    AI Scan Complete
                  </p>
                  <p className="text-xs text-brand-ink font-medium truncate">
                    Route is clear. Proceed safely.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 border-l border-brand-border text-[10px] font-bold uppercase
                         text-brand-muted hover:text-brand-ink hover:bg-brand-bg transition-colors"
            >
              Hide
            </button>
          </div>
        ),
        { duration: 3000, position: "top-center" }
      );
    }

    setIsLoading(false);
    setIsCalculating(false);
  }

  function subscribe() {
    runCheck()
  }

  // The AI Safe Path button doubles as the trip's stop control once a trip
  // is active — pressing it then ends the trip instead of recalculating.
  function handleAiSafePathClick() {
    if (activeTripId) {
      endTrip();
      return;
    }
    if (!hasDestination) {
      toast.error("Please confirm a start and destination location first.");
      return;
    }
    subscribe();
  }

  // The Risk Score popup's close (X) button — abandons route planning
  // entirely rather than just hiding the popup, back to "just your current
  // location" with no destination, no calculated route, no hazard overlay.
  function handleCancelRoutePlanning() {
    setSafeRouteResult(null);
    setSelectedAltIndex(null);
    setShowRiskPopup(false);
    setRoutes([]);
    setPlacesToAvoid([]);
    setDisPlacesToAvoid(false);
    setAvoidanceGeoJSON({ type: "FeatureCollection", features: [] });
    setSearchParams({});
    setLocationSearched({ name: "", lon: 0, lat: 0 });
  }

  // Starting the trip is what actually logs it — selecting a destination or
  // dropping a pin no longer starts one on its own. Keeps the calculated
  // route (safeRouteResult/selectedAltIndex) rendering; only the popup card
  // itself goes away.
  async function handleStartTrip() {
    try {
      const stPoint = await geocodeReverse(coords[1], coords[0]);
      const sl = stPoint?.formatted || `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
      const destinationName = locationSearched.name || "Destination";
      const logResult = await logUserDestination({ startLocation: sl, endLocation: destinationName }, localStorage.getItem("token") || "");
      if (logResult.logId) {
        setActiveTripId(logResult.logId);
        toast.success("Trip started. Drive safely.");
      } else {
        toast.error(logResult.message || "Failed to start trip.");
      }
    } catch (err) {
      console.error("Failed to start trip:", err);
      toast.error("Failed to start trip.");
    }
    setShowRiskPopup(false);
  }

  async function handleDirectionClick() {
    if (!hasDestination) {
      toast.error("Choose a destination first — search above or drop a pin.");
      return;
    }
    setDirectionsLoading(true);
    await fetchRoutes(coords, distinationLat, distinationLon, setRoutes, () => {});
    setDirectionsLoading(false);
  }

  // ── Deliberately no background auto-rerun loop here ─────────────────────
  // The SafeMaster check ("AI Safe Path") must only ever run when the user
  // presses the button. Earlier versions re-ran runCheck() automatically
  // on an interval while a trip was active, which fired the full AI scan
  // (hazard fetch + scoring + route generation + toast) every few seconds
  // without the user asking for it. That poller has been removed: analysis
  // is now strictly on-demand. Basic OSRM route lines are the same way now
  // (see handleDirectionClick) — no more auto-fetch on destination change.

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

  function confirmDestinationPin() {
    const name = destinationPinAddress || `${destinationPin.lat.toFixed(5)}, ${destinationPin.lng.toFixed(5)}`;
    setLocationSearched({ name, lon: destinationPin.lng, lat: destinationPin.lat });
    setSearchParams({ name, lon: String(destinationPin.lng), lat: String(destinationPin.lat) });
    setPickingDestination(false);
  }

  // Ends the active trip and resets planning state back to just the user's
  // current location — same "initial state" the popup's cancel (X) button
  // produces, since this button now doubles as that reset once a trip is
  // running.
  async function endTrip() {
    if (!activeTripId) return;
    setEndingTrip(true);
    try {
      const result = await endUserTrip(activeTripId, localStorage.getItem("token") || "");
      if (result.success) {
        toast.success("Trip ended. Glad you made it safely.");
      } else {
        toast.error(result.message || "Failed to end trip.");
      }
    } finally {
      setActiveTripId(null);
      setSafeRouteResult(null);
      setSelectedAltIndex(null);
      setShowRiskPopup(false);
      setRoutes([]);
      setPlacesToAvoid([]);
      setDisPlacesToAvoid(false);
      setAvoidanceGeoJSON({ type: "FeatureCollection", features: [] });
      setSearchParams({});
      setLocationSearched({ name: "", lon: 0, lat: 0 });
      setEndingTrip(false);
    }
  }

  function selectSearchSuggestion(data: any) {
    const destinationName = data?.properties?.formatted || "Pinned location";
    const lon = data?.geometry?.coordinates[0];
    const lat = data?.geometry?.coordinates[1];
    setLocationSearched({ name: destinationName, lon, lat });
    setSearchParams({ name: destinationName, lon: String(lon), lat: String(lat) });
    setDataSuggested([]);
  }

  // Fixed to the viewport (rather than a height unit on a normal in-flow
  // element) so nothing on the page — the toast container, an old #root
  // sizing quirk, whatever — can ever inflate document scroll height and
  // create bottom whitespace/scroll. Same pattern AdminSidebarLayout uses
  // for the same reason.
  return (
    <main className="fixed inset-0 overflow-hidden font-sans antialiased">

      <MapSidebar
        onMe={() => handleFlyTo(coords)}
        onDropPin={startPickingDestination}
        pickingDestination={pickingDestination}
        reportActive={report}
        onReportDanger={() => {
          setReport((prev) => !prev);
          handleFlyTo(coords);
        }}
      />

      {/* ── Search / Direction / AI Safe Path / Account bar ─────────────────── */}
      <div className="absolute top-3 sm:top-6 left-24 sm:left-28 right-3 sm:right-6 z-[1000] flex items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          <input
            value={locationSearched.name}
            onChange={(e) => setLocationSearched({ name: e.target.value, lon: 0, lat: 0 })}
            placeholder="Search Mapper"
            className="w-full h-11 pl-9 pr-9 rounded-2xl border border-brand-border bg-white text-sm text-brand-ink placeholder:text-brand-muted shadow-sm outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          {locationSearched.name && (
            <button
              type="button"
              onClick={() => { setLocationSearched({ name: "", lon: 0, lat: 0 }); setDataSuggested([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-ink"
              title="Clear search"
            >
              <XIcon size={14} />
            </button>
          )}
          {dataSuggested.length > 0 && locationSearched.lat === 0 && (
            <ul className="absolute z-20 mt-1 w-full bg-white border border-brand-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {dataSuggested.map((data, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectSearchSuggestion(data)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-brand-bg flex items-start gap-2"
                  >
                    <MapPin size={14} className="mt-0.5 shrink-0 text-brand-muted" />
                    <span className="min-w-0 truncate">{data?.properties?.formatted}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleDirectionClick}
          disabled={directionsLoading}
          title="Get directions"
          className="h-11 px-4 rounded-2xl bg-white border border-brand-border shadow-sm text-brand-ink font-semibold text-sm flex items-center gap-2 hover:border-brand-blue/40 disabled:opacity-60 shrink-0 transition-colors"
        >
          <Navigation size={16} className={directionsLoading ? "animate-pulse text-brand-blue" : "text-brand-blue"} />
          <span className="hidden sm:inline">Direction</span>
        </button>

        <Button
          onClick={handleAiSafePathClick}
          disabled={isCalculating || endingTrip}
          title={activeTripId ? "End Trip" : "AI Safe Path"}
          className={`h-11 px-4 rounded-2xl font-semibold text-sm flex items-center gap-2 shrink-0 disabled:opacity-60 transition-colors ${
            activeTripId ? "bg-red-600 hover:bg-red-700 text-white" : "bg-brand-ink hover:bg-brand-blue-dark text-white"
          }`}
        >
          {isCalculating ? (
            <BrainCircuit size={16} className="animate-pulse" />
          ) : activeTripId ? (
            <Square size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          <span className="hidden sm:inline">
            {isCalculating ? "Scanning…" : activeTripId ? "End Trip" : "AI Safe Path"}
          </span>
        </Button>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-3 bg-white border border-brand-border rounded-2xl shadow-sm px-3 py-2 shrink-0"
        >
          <div className="w-9 h-9 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
            <UserCircle2 size={22} />
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <p className="font-bold text-black text-sm truncate max-w-[9rem]">{profile?.username || "…"}</p>
            <p className="text-gray-400 text-xs truncate max-w-[9rem]">{profile?.email || ""}</p>
          </div>
        </button>
      </div>

      {/* ── SafeMaster: Route Risk Panel ─────────────────────────────────────── */}
      {safeRouteResult && showRiskPopup && (
        <div className="absolute top-20 left-24 right-3 sm:top-24 sm:left-28 sm:right-auto z-[999] sm:w-72 sm:max-w-xs bg-white border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Panel title — cross cancels route planning entirely, back to
              just the user's current location */}
          <div className="px-4 py-2 flex items-center justify-between bg-red-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Risk Score</span>
            <button
              type="button"
              onClick={handleCancelRoutePlanning}
              title="Cancel route planning"
              className="text-red-700 hover:text-red-900 transition-colors"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Risk level line */}
          <div
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2
              ${safeRouteResult.riskLevel === "SAFE"
                ? "bg-green-50 text-green-700"
                : safeRouteResult.riskLevel === "WARNING"
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700"}`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
            {safeRouteResult.riskLevel} · Score {safeRouteResult.riskScore.toFixed(0)}/100
          </div>

          {/* Best route */}
          <div
            className={`px-4 py-2.5 border-b border-brand-border cursor-pointer transition-colors
              ${selectedAltIndex === null ? "bg-brand-blue-soft/40" : "hover:bg-brand-bg"}`}
            onClick={() => setSelectedAltIndex(null)}
          >
            <p className="text-[11px] font-bold text-brand-ink truncate">
              {safeRouteResult.best.label}
            </p>
            <p className="text-[10px] text-brand-muted mt-0.5 line-clamp-2">
              {safeRouteResult.best.explanation}
            </p>
            {safeRouteResult.best.distanceM && (
              <p className="text-[10px] text-brand-muted mt-0.5">
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
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-muted mb-1.5">
                Alternatives
              </p>
              <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1">
                {safeRouteResult.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors border
                      ${selectedAltIndex === i
                        ? "bg-brand-blue-soft border-brand-blue/40 text-brand-blue"
                        : "bg-brand-bg border-brand-border text-brand-muted hover:bg-white"}`}
                    onClick={() => setSelectedAltIndex(i)}
                  >
                    <p className="text-[10px] font-bold truncate">{alt.label}</p>
                    <p className="text-[9px] text-brand-muted mt-0.5">
                      {alt.incidentsOnRoute === 0 ? "✓ Clear" : `${alt.incidentsOnRoute} hazard(s)`}
                      {alt.distanceM ? ` · ${(alt.distanceM / 1000).toFixed(1)} km` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              }}
              onDragEnd={(lngLat) => {
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
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-red-600">
                      Signal Location
                    </h4>
                    <p className="text-[10px] text-brand-muted font-medium mt-0.5">Select hazard type:</p>
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
                            ? "bg-red-50 border-red-400 text-red-600"
                            : "bg-white border-brand-border text-brand-muted hover:border-red-300"}`}
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
              }}
              onDragEnd={(lngLat) => {
                setDestinationPin({ lng: lngLat.lng, lat: lngLat.lat });
                resolvePinAddress(lngLat.lng, lngLat.lat);
              }}
            >
              <MarkerContent>
                <div className="relative group cursor-grab active:cursor-grabbing">
                  <div className="absolute inset-0 -m-5 rounded-full bg-blue-500/10 border border-blue-500/20 animate-ping" />
                  <div className="relative z-10 bg-brand-blue p-2.5 rounded-xl shadow-lg border border-blue-400">
                    <MapPin size={18} className="text-white" />
                  </div>
                </div>
              </MarkerContent>
              <MarkerPopup className="p-0 min-w-[220px]">
                <div className="flex flex-col gap-2.5 p-1">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-brand-blue">
                      Dropped Pin
                    </h4>
                    <p className="text-[11px] text-brand-ink font-medium mt-0.5">
                      {resolvingPinAddress
                        ? "Resolving address…"
                        : destinationPinAddress || "Drag the pin, then tap it again to confirm."}
                    </p>
                  </div>

                  <div className="flex gap-1.5">
                    <Button
                      className="flex-1 bg-brand-ink hover:bg-brand-blue-dark h-8 rounded-lg text-[10px] font-bold border-none text-white flex items-center justify-center gap-1.5"
                      disabled={resolvingPinAddress}
                      onClick={confirmDestinationPin}
                    >
                      <Check size={14} /> Set as Destination
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-lg text-brand-muted hover:text-brand-ink hover:bg-brand-bg"
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
            Pass safeRouteResult + selectedAltIndex + routes to MapCurrent via
            Outlet context so it can render the correct route geometry.
          */}
          <Outlet context={{ placesToAvoid, coords, locationSearched, draggableMarker, runCheck, routes, safeRouteResult, selectedAltIndex }} />

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

      {/* ── Status pill (drop-pin hint / no-destination hint / start trip) ──── */}
      <div className="absolute bottom-4 sm:bottom-8 left-24 sm:left-28 right-3 sm:right-6 z-[1000] flex justify-center pointer-events-none">
        {pickingDestination ? (
          <div className="pointer-events-auto max-w-full text-center flex items-center gap-2 bg-white border border-brand-border px-4 py-1.5 rounded-full shadow-lg text-xs font-semibold text-brand-ink">
            <MapPin size={14} className="shrink-0 text-brand-blue" /> <span>Drag the blue pin, then tap it to confirm your destination</span>
          </div>
        ) : safeRouteResult && showRiskPopup && !activeTripId ? (
          <button
            onClick={handleStartTrip}
            className="pointer-events-auto max-w-full text-center flex items-center gap-2 bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full shadow-lg text-sm font-bold text-white transition-colors"
          >
            <Play size={16} className="shrink-0" /> <span>Start Trip</span>
          </button>
        ) : !hasDestination ? (
          <div className="pointer-events-auto max-w-full text-center flex items-center gap-2 bg-white border border-brand-border px-4 py-1.5 rounded-full shadow-lg text-xs font-semibold text-brand-muted">
            <Search size={14} className="shrink-0 text-brand-blue" /> <span>Search above or drop a pin, then tap Direction</span>
          </div>
        ) : null}
      </div>

      {isProfileOpen && (
        <MapProfilePanel onClose={() => setIsProfileOpen(false)} mapStyle={style} onMapStyleChange={setStyle} />
      )}
    </main>
  );
}
