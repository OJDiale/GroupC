import { describe, it, expect } from "vitest";
import { scoreRoutePath, type GeoCoordinate, type HazardPoint } from "../safemaster";
import fixture from "../__fixtures__/safemaster-vectors.json";

// Guards SafeMaster Rule 3: the frontend and backend ports must compute
// identical riskScore/riskLevel/incidentsOnRoute for the same route +
// hazard input. This file and backend/src/routes/__tests__/safemaster-parity.test.js
// run the SAME fixture (safemaster-vectors.json, kept byte-identical across
// both repos) through each port's own scoreRoutePath — if a future change
// to one port's scoring logic isn't mirrored in the other, one of these two
// test files fails.
describe("SafeMaster scoreRoutePath (frontend port) matches shared fixture", () => {
  for (const vector of fixture.vectors) {
    it(vector.name, () => {
      const hazards: HazardPoint[] = vector.hazards.map((h) => ({ lat: h.lat, lon: h.lon }));
      const result = scoreRoutePath(vector.coordinates as GeoCoordinate[], hazards);
      expect(result.riskScore).toBe(vector.expected.riskScore);
      expect(result.riskLevel).toBe(vector.expected.riskLevel);
      expect(result.incidentsOnRoute).toBe(vector.expected.incidentsOnRoute);
    });
  }
});
