import { useOutletContext, useSearchParams } from "react-router"
import { MarkerContent, MapMarker, MarkerPopup, MapRoute } from "../components/ui/map"
import { useEffect, useState, useMemo } from "react"
import { type Distination, type PlaceInformation, type RouteData } from "../lib/types"
import {
  reverseGeocoding,
  fetchRoutes,
  type GeoCoordinate,
  // ── SafeMaster rerouting ──────────────────────────────────────────────────
  type SafeRouteResult,
} from "../lib/utils"
import Spinner from "../components/Spinner"
import { usePageTitle } from "@/lib/usePageTitle";

// Extended outlet context type — includes SafeMaster rerouting fields
interface MapCurrentContext extends Distination {
  safeRouteResult: SafeRouteResult | null;
  selectedAltIndex: number | null;
}

export default function MapCurrent() {
  usePageTitle("Live Route");
  const [searchParams] = useSearchParams()

  const {
    coords,
    data,
    safeRouteResult,
    selectedAltIndex,
  }: MapCurrentContext = useOutletContext()

  const [pinnedInfo, setPinnedInfo] = useState<Array<PlaceInformation>>([{ city: "", street: "" }])
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const distinationLon = searchParams.get("lon") && Number(searchParams.get("lon"))
  const distinationLat = searchParams.get("lat") && Number(searchParams.get("lat"))

  useEffect(() => {
    fetchRoutes(coords, distinationLat, distinationLon, setRoutes, () => {})
    reverseGeocoding(coords, distinationLat, distinationLon, setPinnedInfo)
  }, [coords, distinationLat, distinationLon])

  // ── SafeMaster rerouting: decide which geometry to render ─────────────────
  //
  // Priority:
  //   1. If `data` (fetchSafeRoadRoute result) has been computed, show it.
  //   2. Else if a SafeRouteResult exists, show the selected alternative
  //      (or the best route when no alternative is selected).
  //   3. Otherwise fall back to the standard OSRM routes from fetchRoutes.

  const safeRouteCoords: GeoCoordinate[] | null = useMemo(() => {
    if (!safeRouteResult) return null;
    if (selectedAltIndex !== null && safeRouteResult.alternatives[selectedAltIndex]) {
      return safeRouteResult.alternatives[selectedAltIndex].geojson.geometry.coordinates;
    }
    return safeRouteResult.best.geojson.geometry.coordinates;
  }, [safeRouteResult, selectedAltIndex]);

  const safeRouteLabel: string | null = useMemo(() => {
    if (!safeRouteResult) return null;
    if (selectedAltIndex !== null && safeRouteResult.alternatives[selectedAltIndex]) {
      return safeRouteResult.alternatives[selectedAltIndex].label;
    }
    return safeRouteResult.best.label;
  }, [safeRouteResult, selectedAltIndex]);

  const safeRouteLevel = safeRouteResult
    ? selectedAltIndex !== null && safeRouteResult.alternatives[selectedAltIndex]
      ? safeRouteResult.alternatives[selectedAltIndex].riskLevel
      : safeRouteResult.riskLevel
    : null;

  // Color based on SafeMaster risk level
  const safeRouteColor =
    safeRouteLevel === "SAFE"
      ? "#22c55e"   // green-500
      : safeRouteLevel === "WARNING"
      ? "#eab308"   // yellow-500
      : safeRouteLevel === "DANGEROUS"
      ? "#ef4444"   // red-500
      : "green";

  // Sorted OSRM routes for the fallback display
  const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  // ── Route rendering decision ───────────────────────────────────────────────
  const directions = (() => {
    // 1. fetchSafeRoadRoute result (avoidance-detour path)
    if (data.length >= 100) {
      return (
        <MapRoute
          coordinates={data}
          color="green"
          width={6}
          opacity={1}
        />
      );
    }

    // 2. SafeMaster generateSafeRoute result
    if (safeRouteCoords && safeRouteCoords.length > 0) {
      return (
        <MapRoute
          coordinates={safeRouteCoords}
          color={safeRouteColor}
          width={6}
          opacity={1}
        />
      );
    }

    // 3. Standard OSRM alternatives (original behaviour)
    return sortedRoutes.map(({ route, index }) => {
      const isSelected = index === selectedIndex;
      return (
        <MapRoute
          key={index}
          coordinates={route.coordinates}
          color={isSelected ? "red" : "green"}
          width={isSelected ? 6 : 5}
          opacity={isSelected ? 1 : 0.6}
          onClick={() => setSelectedIndex(index)}
        />
      );
    });
  })();

  return (
    <>
      {(distinationLon && distinationLat) && directions}

      {/* ── SafeMaster: Route label overlay ─────────────────────────────────── */}
      {safeRouteLabel && (distinationLon && distinationLat) && (
        <div className="absolute top-[72px] right-4 z-[998] pointer-events-none">
          <div
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-md border
              ${safeRouteLevel === "SAFE"
                ? "bg-green-600/20 border-green-500/40 text-green-300"
                : safeRouteLevel === "WARNING"
                ? "bg-yellow-600/20 border-yellow-500/40 text-yellow-300"
                : "bg-red-600/20 border-red-500/40 text-red-300"}`}
          >
            {safeRouteLabel}
          </div>
        </div>
      )}

      {/* Current location marker */}
      <MapMarker
        key={1}
        longitude={coords[0]}
        latitude={coords[1]}
      >
        <MarkerContent>
          <div className="size-5 rounded-full bg-blue-800 border-2 border-white shadow-lg" />
        </MarkerContent>
        <MarkerPopup>
          {pinnedInfo[0]?.city ? (
            <div className="space-y-1">
              <p className="font-bold text-lg text-blue-600">{pinnedInfo[0]?.city}</p>
              <p className="text-sm font-bold text-blue-600">{pinnedInfo[0]?.street}</p>
            </div>
          ) : (
            <Spinner />
          )}
        </MarkerPopup>
      </MapMarker>

      {/* Destination marker */}
      {(distinationLon && distinationLat) && (
        <MapMarker
          key={3}
          longitude={distinationLon}
          latitude={distinationLat}
        >
          <MarkerContent>
            <div className="size-5 bg-red-500 rounded-full border-2 border-white shadow-lg" />
          </MarkerContent>
          <MarkerPopup>
            {pinnedInfo[1] ? (
              <div className="space-y-1">
                <p className="font-bold text-lg text-blue-600">{pinnedInfo[1]?.city}</p>
                <p className="text-sm font-bold text-blue-600">{pinnedInfo[1]?.street}</p>
                {/* SafeMaster risk info at destination popup */}
                {safeRouteResult && (
                  <div className={`mt-1 text-[10px] font-bold uppercase
                    ${safeRouteResult.riskLevel === "SAFE"
                      ? "text-green-500"
                      : safeRouteResult.riskLevel === "WARNING"
                      ? "text-yellow-500"
                      : "text-red-500"}`}>
                    Risk: {safeRouteResult.riskLevel} · Score {safeRouteResult.riskScore.toFixed(0)}/100
                  </div>
                )}
              </div>
            ) : (
              <Spinner />
            )}
          </MarkerPopup>
        </MapMarker>
      )}
    </>
  )
}