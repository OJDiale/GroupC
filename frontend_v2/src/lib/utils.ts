import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as turf from "@turf/turf"
import { 
    type NewsItem,
    type DisplayMessageToScreenProps,
    type PlaceInformation,
    type RouteData
} from "./types"
import newImage1 from "../assets/newImage1.jpg"
import newImage2 from "../assets/newImage2.jpg"
import newImage3 from "../assets/newImage2.jpg"
import { redirect } from "react-router"
import { API_BASE_URL } from "./apiConfig"

// do not modify this code it came with installations
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Type definition for geographic coordinates: [longitude, latitude]
export type GeoCoordinate = [number, number];

// ─────────────────────────────────────────────────────────────────────────────
// SAFEMASTER REROUTING CONSTANTS (ported from route_optimizer.py + geo_service.py)
// ─────────────────────────────────────────────────────────────────────────────

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const INCIDENT_RADIUS_KM = 0.6;
const BYPASS_OFFSET_KM = 2.2;
const W_INCIDENTS = 0.5;
const W_AREAS = 0.3;
const W_ALERTS = 0.2;

// ─────────────────────────────────────────────────────────────────────────────
// GEO HELPERS  (ported from geo_service.py)
// ─────────────────────────────────────────────────────────────────────────────

/** Great-circle distance in kilometres (haversine). */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371.0;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing from point 1 → point 2 in degrees (0 = north). */
function bearingDeg(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(p2);
  const x =
    Math.cos(p1) * Math.sin(p2) -
    Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Returns [lon, lat] reached by travelling distanceKm along bearing. */
function destinationPoint(
  lat: number, lon: number,
  bearing: number, distanceKm: number
): GeoCoordinate {
  const R = 6371.0;
  const br = (bearing * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceKm / R) +
    Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(br)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(br) * Math.sin(distanceKm / R) * Math.cos(lat1),
      Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
    );
  return [(lon2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
}

/** Sample up to maxPoints evenly-spaced [lon, lat] pairs from a LineString. */
function sampleLine(coords: GeoCoordinate[], maxPoints = 40): GeoCoordinate[] {
  if (!coords.length) return [];
  if (coords.length <= maxPoints) return coords;
  const step = Math.max(1, Math.floor(coords.length / maxPoints));
  const sampled: GeoCoordinate[] = [];
  for (let i = 0; i < coords.length; i += step) sampled.push(coords[i]);
  if (sampled[sampled.length - 1] !== coords[coords.length - 1])
    sampled.push(coords[coords.length - 1]);
  return sampled;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFEMASTER ROUTE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SafeRouteCandidate {
  label: string;
  geojson: {
    type: "Feature";
    geometry: { type: "LineString"; coordinates: GeoCoordinate[] };
    properties: Record<string, unknown>;
  };
  riskScore: number;
  riskLevel: "SAFE" | "WARNING" | "DANGEROUS";
  explanation: string;
  incidentsOnRoute: number;
  distanceM?: number;
  durationS?: number;
}

export interface SafeRouteResult {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  riskScore: number;
  riskLevel: "SAFE" | "WARNING" | "DANGEROUS";
  explanation: string;
  incidentsOnRoute: number;
  best: SafeRouteCandidate;
  alternatives: SafeRouteCandidate[];
}

/** A lightweight hazard point (lat/lon + optional severity 1–10). */
export interface HazardPoint {
  lat: number;
  lon: number;
  severity?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OSRM FETCH HELPERS  (ported from _fetch_osrm_path / _parse_osrm_routes)
// ─────────────────────────────────────────────────────────────────────────────

interface OsrmItem {
  index: number;
  distanceM?: number;
  durationS?: number;
  geojson: {
    type: "Feature";
    geometry: { type: "LineString"; coordinates: GeoCoordinate[] };
    properties: Record<string, unknown>;
  };
}

function parseOsrmRoutes(data: any): OsrmItem[] {
  if (data?.code !== "Ok") return [];
  const features: OsrmItem[] = [];
  for (let i = 0; i < (data.routes ?? []).length; i++) {
    const route = data.routes[i];
    const geom = route?.geometry;
    if (!geom) continue;
    features.push({
      index: i,
      distanceM: route.distance,
      durationS: route.duration,
      geojson: { type: "Feature", geometry: geom, properties: {} },
    });
  }
  return features;
}

async function fetchOsrmPath(
  waypoints: GeoCoordinate[],
  alternatives = false
): Promise<OsrmItem[]> {
  if (waypoints.length < 2) return [];
  const path = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const alt = alternatives ? "true" : "false";
  const url =
    `${OSRM_BASE}/${path}` +
    `?overview=full&geometries=geojson&alternatives=${alt}&steps=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return parseOsrmRoutes(await res.json());
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK SCORING  (ported from _score_route_path)
// ─────────────────────────────────────────────────────────────────────────────

function riskLevel(score: number): "SAFE" | "WARNING" | "DANGEROUS" {
  if (score >= 70) return "DANGEROUS";
  if (score >= 40) return "WARNING";
  return "SAFE";
}

interface RouteScoring {
  riskScore: number;
  riskLevel: "SAFE" | "WARNING" | "DANGEROUS";
  explanation: string;
  incidentsOnRoute: number;
}

/**
 * Scores a route using the hazard list from your backend.
 * Each hazard point is treated like a SafeMaster "incident" —
 * the more hazards within INCIDENT_RADIUS_KM of the sampled path,
 * the higher the risk score.
 */
function scoreRoutePath(
  coords: GeoCoordinate[],
  hazards: HazardPoint[]
): RouteScoring {
  const samples = sampleLine(coords);
  const hitIds = new Set<number>();

  samples.forEach(([lon, lat], _si) => {
    hazards.forEach((h, hi) => {
      if (haversineKm(lat, lon, h.lat, h.lon) <= INCIDENT_RADIUS_KM) {
        hitIds.add(hi);
      }
    });
  });

  const incidentHits = hitIds.size;
  const incidentComponent = Math.min(100, incidentHits * 12);
  const score = Math.round(
    Math.min(100, incidentComponent * W_INCIDENTS + 25 * W_AREAS + 0 * W_ALERTS) * 100
  ) / 100;
  const level = riskLevel(score);

  let explanation: string;
  if (level === "SAFE") {
    explanation =
      incidentHits === 0
        ? "No major hazards detected on this corridor."
        : `Low-risk corridor — ${incidentHits} minor hazard(s) nearby.`;
  } else if (level === "WARNING") {
    explanation = `Moderate risk: ${incidentHits} hazard(s) near this route.`;
  } else {
    explanation = `High-risk route — avoid if possible: ${incidentHits} hazard(s) detected on corridor.`;
  }

  return { riskScore: score, riskLevel: level, explanation, incidentsOnRoute: incidentHits };
}

// ─────────────────────────────────────────────────────────────────────────────
// BYPASS VIA-POINT GENERATION  (ported from _bypass_via_points)
// ─────────────────────────────────────────────────────────────────────────────

function bypassViaPoints(
  hazards: HazardPoint[],
  startCoord: GeoCoordinate,
  endCoord: GeoCoordinate
): GeoCoordinate[] {
  const [lon1, lat1] = startCoord;
  const [lon2, lat2] = endCoord;
  const corridorBearing = bearingDeg(lat1, lon1, lat2, lon2);
  const points: GeoCoordinate[] = [];
  const seen = new Set<string>();

  const topHazards = hazards.slice(0, 3);
  for (const h of topHazards) {
    for (const dist of [BYPASS_OFFSET_KM, BYPASS_OFFSET_KM + 0.8]) {
      for (const offset of [90, -90, 120, -120]) {
        const pt = destinationPoint(h.lat, h.lon, corridorBearing + offset, dist);
        const key = `${pt[0].toFixed(3)},${pt[1].toFixed(3)}`;
        if (!seen.has(key)) { seen.add(key); points.push(pt); }
      }
    }
  }

  const midLon = (lon1 + lon2) / 2;
  const midLat = (lat1 + lat2) / 2;
  for (const h of hazards.slice(0, 2)) {
    const away = bearingDeg(h.lat, h.lon, midLat, midLon) + 180;
    const pt = destinationPoint(h.lat, h.lon, away, BYPASS_OFFSET_KM);
    const key = `${pt[0].toFixed(3)},${pt[1].toFixed(3)}`;
    if (!seen.has(key)) { seen.add(key); points.push(pt); }
  }

  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildCandidate(
  item: OsrmItem,
  scoring: RouteScoring,
  label: string
): SafeRouteCandidate {
  return {
    label,
    geojson: {
      type: "Feature",
      geometry: item.geojson.geometry,
      properties: {
        riskScore: scoring.riskScore,
        riskLevel: scoring.riskLevel,
        label,
        distanceM: item.distanceM,
        durationS: item.durationS,
        incidentsOnRoute: scoring.incidentsOnRoute,
      },
    },
    riskScore: scoring.riskScore,
    riskLevel: scoring.riskLevel,
    explanation: scoring.explanation,
    incidentsOnRoute: scoring.incidentsOnRoute,
    distanceM: item.distanceM,
    durationS: item.durationS,
  };
}

function geometryKey(item: OsrmItem): string {
  const coords = item.geojson.geometry.coordinates;
  if (coords.length < 2) return "";
  const mid = coords[Math.floor(coords.length / 2)];
  const first = coords[0];
  const last = coords[coords.length - 1];
  return `${first[0].toFixed(4)}:${first[1].toFixed(4)}:${mid[0].toFixed(4)}:${mid[1].toFixed(4)}:${last[0].toFixed(4)}:${last[1].toFixed(4)}:${coords.length}`;
}

function labelCandidates(candidates: SafeRouteCandidate[]): void {
  if (!candidates.length) return;
  candidates.forEach((c, i) => {
    const inc = c.incidentsOnRoute;
    if (i === 0) {
      c.label = inc === 0
        ? "Safest route (clear of incidents)"
        : `Best available route (${inc} hazard(s) nearby)`;
    } else if (inc === 0 && !c.label.toLowerCase().includes("detour")) {
      c.label = "Alternate route avoiding incidents";
    } else if (inc > 0 && !c.label) {
      c.label = `Alternative route (${inc} hazard(s) nearby)`;
    }
    c.geojson.properties.label = c.label;
  });

  const best = candidates[0];
  if (
    best.incidentsOnRoute > 0 &&
    candidates.slice(1).some((a) => a.incidentsOnRoute === 0)
  ) {
    best.explanation += " A clearer alternate route is available — compare options below.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: generateSafeRoute
// (ported from generate_route + _fetch_avoidance_routes in route_optimizer.py)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full SafeMaster-style route generation in TypeScript.
 *
 * @param startCoord  [lon, lat] of the user's current position
 * @param endCoord    [lon, lat] of the destination
 * @param hazards     List of hazard points fetched from your backend
 * @returns           SafeRouteResult with best route + ranked alternatives
 */
export async function generateSafeRoute(
  startCoord: GeoCoordinate,
  endCoord: GeoCoordinate,
  hazards: HazardPoint[]
): Promise<SafeRouteResult> {
  const candidates: SafeRouteCandidate[] = [];
  const seenKeys = new Set<string>();

  function addCandidate(c: SafeRouteCandidate): void {
    const key = geometryKey({
      index: 0,
      geojson: c.geojson,
    } as OsrmItem);
    if (key && seenKeys.has(key)) return;
    if (key) seenKeys.add(key);
    candidates.push(c);
  }

  // ── Step 1: fetch OSRM direct + alternatives ──────────────────────────────
  const osrmRoutes = await fetchOsrmPath([startCoord, endCoord], true);

  if (osrmRoutes.length > 0) {
    for (let i = 0; i < osrmRoutes.length; i++) {
      const item = osrmRoutes[i];
      const scoring = scoreRoutePath(item.geojson.geometry.coordinates, hazards);
      const label = i === 0 ? "Direct route" : `OSRM alternative ${i}`;
      addCandidate(buildCandidate(item, scoring, label));
    }
  } else {
    // Straight-line fallback when OSRM is unreachable
    const mid: GeoCoordinate = [
      +((startCoord[0] + endCoord[0]) / 2).toFixed(6),
      +((startCoord[1] + endCoord[1]) / 2).toFixed(6),
    ];
    const fallbackCoords: GeoCoordinate[] = [startCoord, mid, endCoord];
    const scoring = scoreRoutePath(fallbackCoords, hazards);
    addCandidate({
      label: "Direct corridor (offline routing)",
      geojson: {
        type: "Feature",
        geometry: { type: "LineString", coordinates: fallbackCoords },
        properties: { label: "Direct corridor (offline routing)" },
      },
      ...scoring,
    });
  }

  // ── Step 2: find hazards that are close to the primary path ───────────────
  const referenceCoords =
    candidates.length > 0
      ? candidates[0].geojson.geometry.coordinates
      : [startCoord, endCoord];

  const blockingSamples = sampleLine(referenceCoords);
  const blockingHazards = hazards.filter((h) =>
    blockingSamples.some(
      ([lon, lat]) => haversineKm(lat, lon, h.lat, h.lon) <= INCIDENT_RADIUS_KM
    )
  );

  // ── Step 3: generate bypass detours around blocking hazards ───────────────
  if (blockingHazards.length > 0) {
    const viaPoints = bypassViaPoints(blockingHazards, startCoord, endCoord);

    // Single-via detours
    for (const via of viaPoints.slice(0, 8)) {
      const items = await fetchOsrmPath([startCoord, via, endCoord]);
      for (const item of items) {
        const scoring = scoreRoutePath(item.geojson.geometry.coordinates, hazards);
        if (scoring.incidentsOnRoute >= blockingHazards.length) continue;
        const label =
          scoring.incidentsOnRoute === 0
            ? "Safer detour (clear of incidents)"
            : "Detour avoiding incidents";
        addCandidate(buildCandidate(item, scoring, label));
      }
    }

    // Multi-via detour (2 waypoints) when there are ≥2 blocking hazards
    if (blockingHazards.length >= 2 && viaPoints.length >= 2) {
      const items = await fetchOsrmPath([
        startCoord,
        viaPoints[0],
        viaPoints[1],
        endCoord,
      ]);
      for (const item of items) {
        const scoring = scoreRoutePath(item.geojson.geometry.coordinates, hazards);
        if (scoring.incidentsOnRoute === 0) {
          addCandidate(
            buildCandidate(item, scoring, "Multi-point detour (clear of incidents)")
          );
        }
      }
    }
  }

  // ── Step 4: sort by safety, then label ────────────────────────────────────
  candidates.sort((a, b) => {
    if (a.incidentsOnRoute !== b.incidentsOnRoute)
      return a.incidentsOnRoute - b.incidentsOnRoute;
    if (a.riskScore !== b.riskScore) return a.riskScore - b.riskScore;
    return (a.distanceM ?? 0) - (b.distanceM ?? 0);
  });
  labelCandidates(candidates);

  const best = candidates[0];
  const alternatives = candidates.slice(1, 6);

  return {
    startLat: startCoord[1],
    startLng: startCoord[0],
    endLat: endCoord[1],
    endLng: endCoord[0],
    riskScore: best.riskScore,
    riskLevel: best.riskLevel,
    explanation: best.explanation,
    incidentsOnRoute: best.incidentsOnRoute,
    best,
    alternatives,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ORIGINAL GROUP-C HELPERS (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates a real street route, actively steering the routing engine
 * around hazard zones by generating physical detour checkpoints.
 */
export async function fetchSafeRoadRoute(
    start: GeoCoordinate,
    destination: GeoCoordinate,
    avoidList: GeoCoordinate[],
    safetyRadiusMeters: number = 300,
    _depth: number = 0
): Promise<GeoCoordinate[]> {

    if (_depth > 4) return callFreeRoutingEngine(start, destination);

    const standardRoute = await callFreeRoutingEngine(start, destination);
    if (standardRoute.length === 0) return [];

    let breachIndex = -1;
    for (let i = 0; i < standardRoute.length; i++) {
        if (avoidList.some(h => haversineMeters(standardRoute[i], h) <= safetyRadiusMeters)) {
            breachIndex = i;
            break;
        }
    }

    if (breachIndex === -1) return standardRoute;

    const breachPoint = standardRoute[breachIndex];
    const [dx, dy] = getHeadingVector(standardRoute, breachIndex);
    const magnitude = Math.sqrt(dx * dx + dy * dy) || 1;
    const normX = dx / magnitude;
    const normY = dy / magnitude;

    const offsetLat = (safetyRadiusMeters * 1.5) / 111320;
    const offsetLng = (safetyRadiusMeters * 1.5) / (111320 * Math.cos((breachPoint[1] * Math.PI) / 180));

    const candidateA: GeoCoordinate = [
        breachPoint[0] + (-normY) * offsetLng,
        breachPoint[1] + (normX) * offsetLat
    ];
    const candidateB: GeoCoordinate = [
        breachPoint[0] + (normY) * offsetLng,
        breachPoint[1] + (-normX) * offsetLat
    ];

    const clearance = (pt: GeoCoordinate) =>
        Math.min(...avoidList.map(h => haversineMeters(pt, h)));

    const detourWaypoint = clearance(candidateA) >= clearance(candidateB)
        ? candidateA
        : candidateB;

    const legA = await fetchSafeRoadRoute(start, detourWaypoint, avoidList, safetyRadiusMeters, _depth + 1);
    const legB = await fetchSafeRoadRoute(detourWaypoint, destination, avoidList, safetyRadiusMeters, _depth + 1);

    return [...legA, ...legB];
}

function getHeadingVector(route: GeoCoordinate[], idx: number): [number, number] {
    for (let i = idx - 1; i >= 0; i--) {
        const dx = route[idx][0] - route[i][0];
        const dy = route[idx][1] - route[i][1];
        if (Math.sqrt(dx * dx + dy * dy) > 1e-8) return [dx, dy];
    }
    for (let i = idx + 1; i < route.length; i++) {
        const dx = route[i][0] - route[idx][0];
        const dy = route[i][1] - route[idx][1];
        if (Math.sqrt(dx * dx + dy * dy) > 1e-8) return [dx, dy];
    }
    return [1, 0];
}

async function callFreeRoutingEngine(p1: GeoCoordinate, p2: GeoCoordinate): Promise<GeoCoordinate[]> {
    const url = `${OSRM_BASE}/${p1[0]},${p1[1]};${p2[0]},${p2[1]}?overview=full&geometries=geojson`;
    try {
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return data.routes?.[0]?.geometry?.coordinates || [];
    } catch {
        return [];
    }
}

function haversineMeters(p1: GeoCoordinate, p2: GeoCoordinate): number {
    const R = 6371000;
    const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
    const dLng = ((p2[0] - p1[0]) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((p1[1] * Math.PI) / 180) * Math.cos((p2[1] * Math.PI) / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// fake data
export const newsItems: Array<NewsItem> = [
    {
        id: 1,
        title: "News Item 1",
        description: "Description for News Item 1 sddgd   bdjddjsjjss wwjww wjhwhwhqhq" +
               "edde  njdskkkdd wke ee dewjnedned wejedjjewjdkw fdreryreyyeueuurffwwe",
        src: newImage1
    },
    {
        id: 2,
        title: "News Item 2",
        description: "Description for News Item 2",
        src: newImage2
    },
    {
        id: 3,
        title: "News Item 3",
        description: "Description for News Item 3",
        src: newImage3
    }
]

export const sleep: (ms: number) => Promise<void> = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export async function displayMessageToScreen({ message, setButtonDisplayed, setMessageToBeDisplayed }: DisplayMessageToScreenProps) {
    for (let i = 0; i < message.length; i++) {
        await sleep(50)
        setMessageToBeDisplayed(pre => pre.includes("|") ? pre.replace("|", "") : pre)
        setMessageToBeDisplayed(pre => pre.length < message.length ? pre + message[i] : pre)
        setMessageToBeDisplayed(pre => pre + "|")
    }
    setMessageToBeDisplayed(pre => pre.includes("|") ? pre.replace("|", "") : pre)
    setButtonDisplayed(true)
}

export const loggIn = async (message: string) => {
    const isLoggedIn = localStorage.getItem("token")
    if (!isLoggedIn) return redirect(`/login?message=${message}`)
}

export async function reverseGeocoding(
  gpsCoords: Array<number>,
  destinationLat: number | "" | null,
  destinationLon: number | "" | null,
  setMapPopupInfo: React.Dispatch<React.SetStateAction<Array<PlaceInformation>>>
) {
  if (!destinationLat || !destinationLon || !gpsCoords[0] || !gpsCoords[1]) {
    console.warn("Invalid coordinates provided to reverseGeocoding");
    return;
  }

  const apiKey = "5e7b1eab70f24694a61d4362ce38f88e";

  try {
    const [startRes, endRes] = await Promise.all([
      fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${gpsCoords[1]}&lon=${gpsCoords[0]}&format=json&apiKey=${apiKey}`),
      fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${destinationLat}&lon=${destinationLon}&format=json&apiKey=${apiKey}`)
    ]);

    const startData = await startRes.json();
    const endData = await endRes.json();

    const startPoint = startData.results?.[0];
    const endPoint = endData.results?.[0];

    if (startPoint && endPoint) {
      setMapPopupInfo([
        { city: startPoint.city || "Unknown City", street: startPoint.formatted || "Unknown Street" },
        { city: endPoint.city || "Unknown City", street: endPoint.formatted || "Unknown Street" }
      ]);
    }
  } catch (error) {
    console.error("Failed to fetch address data:", error);
  }
}

export async function fetchRoutes(
    coords: Array<number>,
    distinationLat: number | "" | null,
    distinationLon: number | "" | null,
    setRoutes: React.Dispatch<React.SetStateAction<RouteData[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) {
    setIsLoading(true)
    try {
        const response = await fetch(
            `${OSRM_BASE}/${coords[0]},${coords[1]};${distinationLon},${distinationLat}?overview=full&geometries=geojson&alternatives=true`
        );

        const data = await response.json();

        if (data.routes?.length > 0) {
            const routeData: RouteData[] = data.routes.map(
                (route: {
                    geometry: { coordinates: [number, number][] };
                    duration: number;
                    distance: number;
                }) => ({
                    coordinates: route.geometry.coordinates,
                    duration: route.duration,
                    distance: route.distance,
                })
            );
            setRoutes(routeData);
        }
    } catch (error) {
        console.error("Failed to fetch routes:", error);
    } finally {
        setIsLoading(false);
    }
}

export function doesRouteInterceptAvoidZone(
  routeCoordinates: [number, number][],
  avoidCenter: [number, number],
  avoidRadiusInKm: number = 1
): boolean {
  if (!routeCoordinates || routeCoordinates.length < 2) return false;

  const routeLine = turf.lineString(routeCoordinates);
  const centerPoint = turf.point(avoidCenter);
  const shortestDistance = turf.pointToLineDistance(centerPoint, routeLine, { units: "kilometers" });

  return shortestDistance <= avoidRadiusInKm;
}

const BASE_URL = API_BASE_URL;

export async function fetchAccidentCoordinates(): Promise<[number, number][]> {
  try {
    const response = await fetch("http://localhost:8002/mapper/api/history");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const coordinates: [number, number][] = data.features.map(
      (feature: any) => feature.geometry.coordinates
    );
    return coordinates;
  } catch (error) {
    console.error("Failed to fetch accident coordinates:", error);
    return [];
  }
}

export interface HazardReportPayload {
  latitude: number;
  longitude: number;
  hazardType: string;
}

export async function submitHazardReport(payload: HazardReportPayload): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL + "/api/hazards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to submit hazard route token");
    }
    return true;
  } catch (error) {
    console.error("Hazard submission exception:", error);
    throw error;
  }
}

export interface BackendHazard {
  id: number;
  username: string;
  latitude: number;
  longitude: number;
  hazardType: string;
  createdAt: string;
}

export interface UIHazardReport {
  id: string;
  userName: string;
  lat: number;
  lng: number;
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  timestamp: string;
  info: {
    street: string;
    town: string;
    city: string;
  };
}

export function formatRelativeTime(dbDateString: string): string {
  const now = new Date();
  const standardizedString = dbDateString.includes('T')
    ? dbDateString
    : dbDateString.replace(' ', 'T');

  const past = new Date(standardizedString);
  const diffInMs = now.getTime() - past.getTime();

  if (diffInMs < 0) return "Just now";

  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins} mins ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;

  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export async function fetchAndResolveHazardReports(
  setReports?: React.Dispatch<React.SetStateAction<UIHazardReport[]>>
): Promise<UIHazardReport[]> {
  const apiKey = "5e7b1eab70f24694a61d4362ce38f88e";

  try {
    const response = await fetch(`${BASE_URL}/api/hazards`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`Server returned error status code: ${response.status}`);

    const rawData: BackendHazard[] = await response.json();

    const initialReports: UIHazardReport[] = rawData.map((report) => {
      let structuralSeverity: "CRITICAL" | "HIGH" | "MEDIUM" = "MEDIUM";
      if (["accident", "road_block"].includes(report.hazardType)) {
        structuralSeverity = "CRITICAL";
      } else if (report.hazardType === "march") {
        structuralSeverity = "HIGH";
      }

      return {
        id: `TR-${report.id}`,
        userName: report.username || "Anonymous",
        lat: report.latitude,
        lng: report.longitude,
        type: report.hazardType,
        severity: structuralSeverity,
        timestamp: formatRelativeTime(report.createdAt),
        info: {
          street: "Live User Report Location",
          town: "Gauteng Region",
          city: "South Africa",
        },
      };
    });

    if (setReports) setReports(initialReports);

    for (let i = 0; i < initialReports.length; i++) {
      const report = initialReports[i];
      try {
        const geoRes = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${report.lat}&lon=${report.lng}&format=json&apiKey=${apiKey}`
        );

        if (!geoRes.ok) continue;

        const geoData = await geoRes.json();
        const point = geoData.results?.[0];

        if (point) {
          const updatedInfo = {
            street: point.street || point.name || "Primary Route",
            town: point.suburb || point.city_district || "Active Zone",
            city: point.city || "Gauteng",
          };

          initialReports[i].info = updatedInfo;

          if (setReports) {
            setReports((prev) =>
              prev.map((item) =>
                item.id === report.id ? { ...item, info: updatedInfo } : item
              )
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (geoError) {
        console.error(`Failed single address conversion for ${report.id}:`, geoError);
      }
    }

    return initialReports;
  } catch (error) {
    console.error("Failed to query and process live database reports:", error);
    throw error;
  }
}

export interface DestinationLog {
  id: number;
  userId?: number;
  username?: string;
  startLocation: string;
  endLocation: string;
  createdAt: string;
}

export interface NewDestinationPayload {
  startLocation: string;
  endLocation: string;
}

const getHeaders = (token: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
});

export async function logUserDestination(
  payload: NewDestinationPayload,
  token: string
): Promise<{ success: boolean; logId?: number; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/normal-user/destinations`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to transmit user destination payload:", error);
    return { success: false, message: "Network request processing failure." };
  }
}

export async function fetchUserDestinationHistory(token: string): Promise<DestinationLog[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/normal-user/destinations`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    if (!response.ok) throw new Error(`Server responded with: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to recover user route logs:", error);
    return [];
  }
}

export async function fetchAdminGlobalLogs(adminToken: string): Promise<DestinationLog[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin-user/destinations`, {
      method: "GET",
      headers: getHeaders(adminToken),
    });
    if (!response.ok) throw new Error(`Server responded with: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Failed to compile global admin route logs:", error);
    return [];
  }
}

export async function deleteLogEntryAsAdmin(
  logId: number,
  adminToken: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin-user/destinations/${logId}`, {
      method: "DELETE",
      headers: getHeaders(adminToken),
    });
    return await response.json();
  } catch (error) {
    console.error(`Failed execution sequence on deleting record ${logId}:`, error);
    return { success: false, message: "Network action failed." };
  }
}
