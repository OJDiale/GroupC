import { MapClusterLayer, MapPopup } from "../components/ui/map";
import { useEffect, useState } from "react";
import { fetchAndResolveHazardReports } from "@/lib/utils";

interface HazardPointProperties {
  id: string;
  hazardType: string;
  userName: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

const EMPTY_COLLECTION: GeoJSON.FeatureCollection<GeoJSON.Point, HazardPointProperties> = {
  type: "FeatureCollection",
  features: [],
};

export default function CrimeMap() {
  const [selectedPoint, setSelectedPoint] = useState<{
    coordinates: [number, number];
    properties: HazardPointProperties;
  } | null>(null);
  const [hazardCollection, setHazardCollection] = useState(EMPTY_COLLECTION);

  useEffect(() => {
    let cancelled = false;

    fetchAndResolveHazardReports()
      .then((reports) => {
        if (cancelled) return;
        setHazardCollection({
          type: "FeatureCollection",
          features: reports.map((report) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [report.lng, report.lat] },
            properties: {
              id: report.id,
              hazardType: report.type,
              userName: report.userName,
              timestamp: report.timestamp,
              severity: report.severity,
            },
          })),
        });
      })
      .catch((error) => {
        console.error("Failed to load historical hazard reports:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <MapClusterLayer<HazardPointProperties>
        data={hazardCollection}
        clusterRadius={45}
        pointColor="#ef4444"
        onPointClick={(feature, coordinates) => {
          setSelectedPoint({
            coordinates,
            properties: feature.properties,
          });
        }}
      />

      {selectedPoint && (
     <MapPopup
  longitude={selectedPoint.coordinates[0]}
  latitude={selectedPoint.coordinates[1]}
  onClose={() => setSelectedPoint(null)}
  // Some libraries use 'className' or 'style' on the popup itself to remove default padding
  className="custom-popup"
>
  {/* Main Container: Removed border-slate-700 and ensured full dark coverage */}
  <div className="w-80 bg-slate-900 text-slate-100 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">

    {/* 1. Header: Priority Level */}
    <div className={`px-4 py-2 flex justify-between items-center ${
      selectedPoint.properties.severity === 'CRITICAL'
      ? 'bg-red-600' : 'bg-slate-800'
    }`}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {selectedPoint.properties.severity} Report
        </span>
      </div>
      <span className="text-[10px] font-mono text-white/70">#{selectedPoint.properties.id}</span>
    </div>

    <div className="p-4 space-y-4">
      {/* 2. Primary Focus: The Hazard Type */}
      <div>
        <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 tracking-tighter">Hazard Type</label>
        <h3 className="text-base font-bold leading-tight">
          {selectedPoint.properties.hazardType}
        </h3>
      </div>

      {/* 3. Data Grid: Clean Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <label className="text-[8px] uppercase font-bold text-slate-500 block">Reported By</label>
          <p className="text-sm font-mono font-bold text-blue-400 truncate">
            {selectedPoint.properties.userName}
          </p>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <label className="text-[8px] uppercase font-bold text-slate-500 block">Reported</label>
          <p className="text-[11px] font-mono mt-1 leading-tight">
            {selectedPoint.properties.timestamp}
          </p>
        </div>
      </div>
    </div>

    {/* Coordinates Footer: Subtle contrast */}
    <div className="bg-black/20 px-4 py-2 flex justify-between items-center">
      <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">
        GPS: {selectedPoint.coordinates[1].toFixed(5)}, {selectedPoint.coordinates[0].toFixed(5)}
      </span>
      <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
    </div>
  </div>
</MapPopup>
      )}
    </>
  );
}
