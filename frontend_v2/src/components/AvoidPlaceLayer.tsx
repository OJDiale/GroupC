// import React, { useCallback, useEffect, useState } from "react";
// import { type FeatureCollection, type Point } from "geojson";
// import { useMap } from "@/components/ui/map";
// import { Button } from "@/components/ui/button";
// import { Layers, X } from "lucide-react";
// import maplibregl from "maplibre-gl";

// interface ParkProperties {
//   name: string;
//   type: string;
// }

// interface CustomLayerProps {
//   data: FeatureCollection<Point, ParkProperties>;
//   layerId?: string;
//   sourceId?: string;
//   circleColor?: string;
// }


// interface ParkProperties {
//   name: string;
//   type: string;
// }

// // Fixed: Component now properly accepts a props object
// interface CustomLayerProps {
//   geojsonData: FeatureCollection<Point, ParkProperties>;
// }

// export default function Layer({ geojsonData }: CustomLayerProps) {
//   const { map, isLoaded } = useMap();
//   const [isLayerVisible, setIsLayerVisible] = useState(true); // Default to true so they appear immediately
//   const [hoveredPark, setHoveredPark] = useState<string | null>(null);

//   const layerId = "parks-circle";
//   const sourceId = "parks";

//   // 1. Setup Source and Layer
//   useEffect(() => {
//     if (!map || !isLoaded) return;

//     // Add Source
//     if (!map.getSource(sourceId)) {
//       map.addSource(sourceId, {
//         type: "geojson",
//         data: geojsonData,
//       });
//     }

//     // Add Layer
//     if (!map.getLayer(layerId)) {
//       map.addLayer({
//         id: layerId,
//         type: "circle",
//         source: sourceId,
//         paint: {
//           // Responsive radius based on zoom level
//           "circle-radius": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             5, 4,      // 4px at zoom level 5
//             10, 10,    // 10px at zoom level 10
//             15, 25     // 25px at zoom level 15
//           ],
//           "circle-color": "red",
//           "circle-opacity": 0.6,
//           "circle-stroke-width": 2,
//           "circle-stroke-color": "#16a34a",
//         },
//         layout: {
//           visibility: isLayerVisible ? "visible" : "none",
//         },
//       });

//       // Force the layer to stay on top of the base map style
//       map.moveLayer(layerId);
//     }

//     // Cleanup when component unmounts
//     return () => {
//       if (map.getLayer(layerId)) map.removeLayer(layerId);
//       if (map.getSource(sourceId)) map.removeSource(sourceId);
//     };
//   }, [map, isLoaded]);

//   // 2. Update data if geojsonData changes
//   useEffect(() => {
//     if (!map || !isLoaded) return;
//     const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
//     if (source) {
//       source.setData(geojsonData);
//     }
//   }, [geojsonData, map, isLoaded]);

//   // 3. Handle Mouse Events & Cursor
//   useEffect(() => {
//     if (!map || !isLoaded || !map.getLayer(layerId)) return;

//     const onEnter = () => (map.getCanvas().style.cursor = "pointer");
//     const onLeave = () => {
//       map.getCanvas().style.cursor = "";
//       setHoveredPark(null);
//     };
//     const onMove = (e: maplibregl.MapMouseEvent) => {
//       const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
//       if (features.length > 0) {
//         setHoveredPark(features[0].properties?.name || "Unknown Park");
//       } else {
//         setHoveredPark(null);
//       }
//     };

//     map.on("mouseenter", layerId, onEnter);
//     map.on("mouseleave", layerId, onLeave);
//     map.on("mousemove", layerId, onMove);

//     return () => {
//       map.off("mouseenter", layerId, onEnter);
//       map.off("mouseleave", layerId, onLeave);
//       map.off("mousemove", layerId, onMove);
//     };
//   }, [map, isLoaded, isLayerVisible]);

//   // 4. Handle Visibility Changes
//   const toggleLayer = () => {
//     if (!map) return;
//     const nextVisibility = isLayerVisible ? "none" : "visible";
//     map.setLayoutProperty(layerId, "visibility", nextVisibility);
//     setIsLayerVisible(!isLayerVisible);
//   };

//   return (
//     <>
//       <div className="absolute top-3 left-3 z-10">
//         <Button
//           size="sm"
//           variant={isLayerVisible ? "default" : "secondary"}
//           onClick={toggleLayer}
//           className="shadow-md"
//         >
//           {isLayerVisible ? (
//             <X className="mr-1.5 size-4" />
//           ) : (
//             <Layers className="mr-1.5 size-4" />
//           )}
//           {isLayerVisible ? "Hide Parks" : "Show Parks"}
//         </Button>
//       </div>

//       {hoveredPark && (
//         <div className="bg-background/90 absolute bottom-6 left-1/2 -translate-x-1/2 z-20 rounded-md border px-3 py-2 text-sm font-bold shadow-xl backdrop-blur">
//           {hoveredPark}
//         </div>
//       )}
//     </>
//   );
// }

import React, { useEffect, useState } from "react";
import { type FeatureCollection, type Point } from "geojson";
import { useMap } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Layers, X } from "lucide-react";
import maplibregl from "maplibre-gl";

interface DangerProperties {
  name: string;
}

interface CustomLayerProps {
  geojsonData: any; // Using any for flexibility with FeatureCollection
}

export default function Layer({ geojsonData }: CustomLayerProps) {
  const { map, isLoaded } = useMap();
  const [isLayerVisible, setIsLayerVisible] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const layerId = "danger-zones-layer";
  const sourceId = "danger-zones-source";

  // 1. Initial Setup: Create Source and Layer
  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojsonData,
      });
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          3, 3,
          8, 6,
          12, 12,
          16, 20,
          18, 28
        ],

        // Dark red fill
        "circle-color": "#7f1d1d",

        // Slightly more visible fill
        "circle-opacity": 0.45,

        // Darker border
        "circle-stroke-width": 2,
        "circle-stroke-color": "#450a0a",

        // Border a bit more visible
        "circle-stroke-opacity": 0.8,
      },
        layout: {
          visibility: isLayerVisible ? "visible" : "none",
        },
      });
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, isLoaded]);

  // 2. DATA UPDATE: This handles the communication when Parent state changes
  useEffect(() => {
    if (map && isLoaded && map.getSource(sourceId)) {
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
      source.setData(geojsonData);
    }
  }, [geojsonData, map, isLoaded]);

  // 3. Hover Logic
  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(layerId)) return;

    const onEnter = () => (map.getCanvas().style.cursor = "pointer");
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoveredZone(null);
    };

    const onMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [layerId] });
      if (features.length > 0) {
        setHoveredZone(features[0].properties?.name || "Hazard Area");
      }
    };

    map.on("mouseenter", layerId, onEnter);
    map.on("mouseleave", layerId, onLeave);
    map.on("mousemove", layerId, onMove);

    return () => {
      map.off("mouseenter", layerId, onEnter);
      map.off("mouseleave", layerId, onLeave);
      map.off("mousemove", layerId, onMove);
    };
  }, [map, isLoaded]);

  const toggleLayer = () => {
    if (!map) return;
    const nextVisibility = isLayerVisible ? "none" : "visible";
    map.setLayoutProperty(layerId, "visibility", nextVisibility);
    setIsLayerVisible(!isLayerVisible);
  };

  return (
    <>
      <div className="absolute top-24 left-24 z-[1000]">
        <Button
          size="sm"
          variant={isLayerVisible ? "destructive" : "secondary"}
          onClick={toggleLayer}
          className="shadow-2xl border border-white/20 backdrop-blur-md"
        >
          {isLayerVisible ? <X className="mr-2 size-4" /> : <Layers className="mr-2 size-4" />}
          {isLayerVisible ? "Hide Threats" : "Show Threats"}
        </Button>
      </div>

      {hoveredZone && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1001] bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-2xl animate-bounce">
          ⚠️ Not safe to pass through try finding an alternative route! ⚠️
        </div>
      )}
    </>
  );
}