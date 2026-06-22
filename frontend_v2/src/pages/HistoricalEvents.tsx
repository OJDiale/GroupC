import { MapClusterLayer, MapPopup } from "../components/ui/map";
import { useState } from "react";

// The data structure stays the same, but we interpret it better
interface CrimeProperties {
  id: number;
  name: string;
  creationDate: string;
  severity: string; 
  vehiclesInvolved: number;
}

export default function CrimeMap() {
  const [selectedPoint, setSelectedPoint] = useState<{
    coordinates: [number, number];
    properties: CrimeProperties;
  } | null>(null);

  // Helper to format the raw date into a readable South African format
  const formatIncidentTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <>
      <MapClusterLayer<CrimeProperties>
        data={`http://localhost:8002/mapper/api/history`}
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
      selectedPoint.properties.severity?.toLowerCase() === 'high' 
      ? 'bg-red-600' : 'bg-slate-800'
    }`}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {selectedPoint.properties.severity || 'Incident'} Report
        </span>
      </div>
      <span className="text-[10px] font-mono text-white/70">#{selectedPoint.properties.id}</span>
    </div>

    <div className="p-4 space-y-4">
      {/* 2. Primary Focus: The Location */}
      <div>
        <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 tracking-tighter">Incident Area</label>
        <h3 className="text-base font-bold leading-tight">
          {selectedPoint.properties.name}
        </h3>
      </div>

      {/* 3. Data Grid: Clean Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Removed borders from internal boxes as well */}
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <label className="text-[8px] uppercase font-bold text-slate-500 block">Vehicles</label>
          <p className="text-lg font-mono font-bold text-blue-400">
            {selectedPoint.properties.vehiclesInvolved || 0}
          </p>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <label className="text-[8px] uppercase font-bold text-slate-500 block">Time Recorded</label>
          <p className="text-[11px] font-mono mt-1 leading-tight">
            {formatIncidentTime(selectedPoint.properties.creationDate)}
          </p>
        </div>
      </div>

      {/* 4. Actionable Footer */}
      <div className="pt-2">
        <button 
          onClick={() => console.log("Navigating to:", selectedPoint.properties.id)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          View Safety Route
        </button>
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

// import { MapClusterLayer, MapPopup } from "../components/ui/map"
// import { useState } from "react";

// interface CrimeProperties {
//    id :number,
//    name :string,
//    creationDate :string,
// }

// export default function CrimeMap() {
//   const [selectedPoint, setSelectedPoint] = useState<{
//     coordinates: [number, number];
//     properties: CrimeProperties;
//   } | null>(null);

//   return (
//     <>
//         <MapClusterLayer<CrimeProperties>
//           // 2. Use your DC Gov URL here
//           data={`http://localhost:8002/mapper/api/history`}
//           clusterRadius={40}
//           pointColor="#ff4d4d"
//           onPointClick={(feature, coordinates) => {
//             setSelectedPoint({
//               coordinates,
//               properties: feature.properties,
//             });
//           }}
//         />

//         {selectedPoint && (
//           <MapPopup
//             longitude={selectedPoint.coordinates[0]}
//             latitude={selectedPoint.coordinates[1]}
//             onClose={() => setSelectedPoint(null)}
//           >
//             <div className="p-2">
//               {/* 3. Update the UI to show Crime details */}
//               <h4 className="font-bold border-b mb-1">{selectedPoint.properties.severity}</h4>
//               <p className="text-xs">Method: {selectedPoint.properties.creationDate}</p>
//               <p className="text-xs text-muted-foreground">
//                 Location: {selectedPoint.properties.name}
//                 <br/>
//                 Vehicles Involved: {selectedPoint.properties.vehiclesInvolved}
//               </p>
//             </div>
//           </MapPopup>
//         )}
//     </>
//   );
// }


