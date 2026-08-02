// Pure SafeMaster risk-scoring functions, deliberately isolated from
// anything DOM/fetch/env-dependent. This is the half of the routing engine
// that MUST behave identically to the backend JS port (see
// backend/src/lib/safemaster.js) — keeping it dependency-free means the
// parity test (__tests__/safemaster-parity.test.ts) can import and run it
// with no browser, no network, no build-time env vars.

export type GeoCoordinate = [number, number];

export const INCIDENT_RADIUS_KM = 0.6;
export const W_INCIDENTS = 0.5;
export const W_AREAS = 0.3;
export const W_ALERTS = 0.2;

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

/**
 * Sample ~every 250m along a LineString coordinate array. Mirrors the
 * backend port's sampleLine exactly (parallel-port rule) — must stay
 * distance-based, not index/count-based, or the two ports compute
 * incidentsOnRoute over different sample sets for the same real-world
 * route geometry and silently diverge on riskScore.
 */
export function sampleLine(coords: GeoCoordinate[]): GeoCoordinate[] {
  if (!coords || coords.length === 0) return [];
  const STEP_KM = 0.25;
  const samples: GeoCoordinate[] = [coords[0]];
  let accumulated = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1];
    const [lon2, lat2] = coords[i];
    accumulated += haversineKm(lat1, lon1, lat2, lon2);
    if (accumulated >= STEP_KM) {
      samples.push(coords[i]);
      accumulated = 0;
    }
  }
  if (samples[samples.length - 1] !== coords[coords.length - 1]) {
    samples.push(coords[coords.length - 1]);
  }
  return samples;
}

export function riskLevel(score: number): "SAFE" | "WARNING" | "DANGEROUS" {
  if (score >= 70) return "DANGEROUS";
  if (score >= 40) return "WARNING";
  return "SAFE";
}

/** A lightweight hazard point (lat/lon + optional severity 1–10). */
export interface HazardPoint {
  lat: number;
  lon: number;
  severity?: number;
}

export interface RouteScoring {
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
export function scoreRoutePath(
  coords: GeoCoordinate[],
  hazards: HazardPoint[]
): RouteScoring {
  const samples = sampleLine(coords);
  const hitIds = new Set<number>();

  samples.forEach(([lon, lat]) => {
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
