import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router";
import { 
  Mountain, Map as MapIcon, 
 History, Radio, 
  Navigation2, 
  AlertTriangle, 
  TriangleAlert,
  Sparkles,
  BrainCircuit,
  LocateFixed
} from "lucide-react";
import { Map, MapControls, MapMarker, MarkerContent, MarkerPopup, type MapRef } from "@/components/ui/map";
import type { LngLatLike } from "maplibre-gl";
import DialogDemo from "../components/Popup";
import { Button } from "@/components/ui/button";
import spaceImage from "../assets/space_image.jpg"
import {type RouteData} from "../lib/types"
import { fetchRoutes,doesRouteInterceptAvoidZone, fetchAccidentCoordinates,fetchSafeRoadRoute,type  GeoCoordinate, submitHazardReport, fetchAndResolveHazardReports, logUserDestination} from "../lib/utils"
import Layer from "@/components/AvoidPlaceLayer";
import { toast } from "react-hot-toast";
import { SubscriptionDrawer } from "@/components/SubscriptionDrawer";
//To types
 type Role = "ADMIN"|"PREMIUM"|"USER"

export default function MapPage(): React.JSX.Element {
  const styles = {
    default: undefined,
    openstreetmap: "https://tiles.openfreemap.org/styles/bright",
    openstreetmap3d: "https://tiles.openfreemap.org/styles/liberty",
  };

  // Constants for rotation speed
//const ROTATION_SPEED = 0.05;

   const apiKey = "5e7b1eab70f24694a61d4362ce38f88e"; 

//  const navigate = useNavigate()

//   const [display, setDisplay] = useState(false);

  type StyleKey = keyof typeof styles;
  const [coords, setCoords] = useState<LngLatLike | undefined>([28.1914, -25.7566]);
  const [locationSearched, setLocationSearched] = useState({ name: "", lon: 0, lat: 0 });
  const [dataSuggested, setDataSuggested] = useState([]);
  const [style, setStyle] = useState<StyleKey>("default");
  const mapRef = useRef<MapRef>(null);
  const is3D = style === "openstreetmap3d";
  const selectedStyle = styles[style];
  const [report , setReport] = useState<boolean>(false)
  const [draggableMarker, setDraggableMarker] = useState({
    lng: (coords[0] as number),
    lat: (coords[1] as number),
  });


  const [isLoading, setIsLoading] = useState(true);
const [searchParams , setSearchParams] = useSearchParams()
const [routes, setRoutes] = useState<RouteData[]>([]);
const [disPlacesToAvoid ,setDisPlacesToAvoid] = useState<boolean>(false)

const [avoidanceGeoJSON, setAvoidanceGeoJSON] = useState({
    type: "FeatureCollection",
    features: []
  });
    const distinationLon = searchParams.get("lon") && Number(searchParams.get("lon"))
    const distinationLat = searchParams.get("lat") && Number(searchParams.get("lat"))
    const [isCalculating, setIsCalculating] = useState(false);
    const [data,setData] = useState<Array<GeoCoordinate>>([])
    const [placesToAvoid,setPlacesToAvoid]=useState<[number,number][]>([]) 
    const [openSubscripDraw ,setOpenSubscripDraw] = useState<boolean>(false)
    //For backend to connect
    const [userRole,setUserRole]=useState<Role>("USER");
    const [hazardType, setHazardType] = useState<string>("accident");
    const isEmpty : boolean = searchParams.get("lon")===null && searchParams.get("lat") ===null
    
    
  // 2. LOGIC: Handle Geolocation (Run once on mount)
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    // Cleanup on unmount
    return () => navigator.geolocation.clearWatch(id);
  }, []);

async function runCheck() {
     if (!coords || !distinationLat || !distinationLon) {
      console.warn("Missing coordinates for routing");
      return;
    }

    setIsCalculating(true);
    setIsLoading(true);
    
    // 1. Fetch Route
    await fetchRoutes(coords as [number, number], distinationLat, distinationLon, setRoutes, setIsLoading);

    // 2. Fetch Danger Zones
    const u_accidentCoords = await fetchAndResolveHazardReports();
    const accidentCoords : [number,number][]= u_accidentCoords.map( coor => {
      return [coor.lng as number,coor.lat as number]
    })
    setPlacesToAvoid([...accidentCoords, [draggableMarker.lng, draggableMarker.lat]])

    console.log("Accident Coordinates:", placesToAvoid)
    // 3. Build Features
    const newFeatures: any[] = [];
    
    placesToAvoid.forEach((point, index) => {
        // Check intersection (Ensure your util handles null routes)
        if ( doesRouteInterceptAvoidZone(routes[0]?.coordinates, point as [number, number]) || doesRouteInterceptAvoidZone(routes[1]?.coordinates, point as [number, number])) {
            newFeatures.push({
                type: "Feature",
                properties: { 
                    name: index === placesToAvoid.length - 1 ? "User Reported Danger" : "High Accident Zone",
                },
                geometry: {
                    type: "Point",
                    coordinates: point,
                },
            });
        }
    });

    

console.log("Places to Avoid:", newFeatures);
    // 4. Update State to trigger Child Layer
    setAvoidanceGeoJSON({
        type: "FeatureCollection",
        features: newFeatures
    });
    setDisPlacesToAvoid(newFeatures.length > 0);
    if(newFeatures.length <= 0){
      toast.custom((t) => (
  <div
      className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-xs w-full bg-slate-900/95 border border-indigo-500/40 shadow-xl 
      rounded-lg pointer-events-auto flex backdrop-blur-md overflow-hidden group`}
  >
    {/* Thin AI accent bar on the left */}
    <div className="w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />

    <div className="flex-1 p-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-md bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-indigo-400 uppercase tracking-tighter">
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
), {
  duration: 3000,
  position: 'top-center',
});
    }else{

       toast.custom((t) => (
  <div
    className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-xs w-full bg-slate-900/95 border border-indigo-500/40 shadow-xl 
      rounded-lg pointer-events-auto flex backdrop-blur-md overflow-hidden group`}
  >
    {/* Thin AI accent bar on the left */}
    <div className="w-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />

    <div className="flex-1 p-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-md bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-indigo-400 uppercase tracking-tighter">
            AI Scan Complete
          </p>
          <p className="text-xs text-slate-200 font-medium truncate">
              {newFeatures.length} Potential dangers detected on route.
          </p>
        </div>
      </div>
    </div>

    <button
      onClick={() =>{getData()

       toast.dismiss(t.id)}}
      className="px-3 border-l border-slate-800 text-[10px] font-bold uppercase 
                 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
    >
      Safe Path
    </button>
  </div>
), {
  duration: 60000,
  position: 'top-center',
});
    }
    setIsLoading(false);
     setIsCalculating(false);
  }

  async function getData(){
            const data = await fetchSafeRoadRoute(
             [coords[0] as number||0 ,coords[1] as number||0],
             [distinationLon as number,distinationLat as number],
             placesToAvoid
         )  
             setData(data)
         }

  function subscribe(){
          // if(userRole!=="PREMIUM" ){
          //    setOpenSubscripDraw(true)
          //    return
          // }

           runCheck()
  }
  // 3. LOGIC: Handle Search API (Debounced)
  useEffect(() => {
    // Only fetch if there's a name and we haven't already selected these exact coordinates
    if (!locationSearched.name || locationSearched.lat !== 0) {
      if (!locationSearched.name) setDataSuggested([]);
      return;
    }

    //Replace with google maps autocomplete
    const timer = setTimeout(() => {
      fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${locationSearched.name}&apiKey=5e7b1eab70f24694a61d4362ce38f88e`)
        .then(res => res.json())
        .then(result => setDataSuggested(result.features || []))
        .catch(err => console.error("Search error:", err));
    }, 800); // Wait 400ms after user stops typing

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
    // Access the MapLibre GL map instance via ref
        mapRef.current?.flyTo({ center: [coords[0] , coords[1]], zoom: 12 });
  };
  return (
<main className="relative h-screen w-full overflow-hidden font-sans antialiased text-slate-100">
  
  <header className="absolute top-6 left-6 z-[1000] flex items-start pointer-events-none">
    <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-2xl p-1.5 rounded-2xl shadow-2xl border border-indigo-500/30 pointer-events-auto">
      
      {/* Search Area - Squeezed */}
      <div className="flex items-center bg-indigo-950/40 rounded-xl px-2 border border-white/10 mr-1">
        <DialogDemo 
          locationSearched={locationSearched}
          setLocationSearched={setLocationSearched} 
          locationsSuggests={dataSuggested?.map((data, i) => (
            <div 
              key={i}
              className="p-3 flex items-center gap-2 hover:bg-indigo-900/40 cursor-pointer transition-colors border-b border-slate-800 last:border-0"
              onClick={async() => {
                 setLocationSearched({
                name: data?.properties?.formatted,
                lon: data?.geometry?.coordinates[0],
                lat: data?.geometry?.coordinates[1]
              })
                  const stLoc = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${coords[1] as number}&lon=${coords[0] as number}&format=json&apiKey=${apiKey}`) 
                  const startData = await stLoc.json()
                  const sl = startData.results?.[0].formatted
                 await logUserDestination({ startLocation: sl, endLocation:locationSearched.name},localStorage.getItem("token")||"")
              }}
            >
              <Navigation2 size={14} className="text-indigo-400 rotate-45" />
              <span className="text-xs text-slate-300">{data?.properties?.formatted}</span>
            </div>
          ))}
        />
      </div>

      {/* Navigation Buttons */}
      <nav className="flex items-center gap-1">
        <NavLink to="../map" end className={({ isActive }) => `p-2 rounded-lg transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-300'}`}>
          <MapIcon size={18} />
        </NavLink>
        <NavLink to="historical_events" className={({ isActive }) => `p-2 rounded-lg transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-300'}`}>
          <History size={18} />
        </NavLink>
        <NavLink to="current_events" className={({ isActive }) => `p-2 rounded-lg transition-all ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-300'}`}>
          <Radio size={18} />
        </NavLink>
       <button 
        onClick={() => handleFlyTo(coords as [number, number])}
        className="p-2 rounded-lg transition-all text-slate-400 hover:text-indigo-300 hover:bg-indigo-600/20 active:scale-90"
        title="My Location"
      >
        <LocateFixed size={18} />
      </button>
      </nav>
    </div>
  </header>

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
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-red-500">
                    Signal Location
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Select hazard type:</p>
                </div>

                {/* Grid selector */}
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

      <Outlet context={{data, placesToAvoid,coords, locationSearched, draggableMarker, runCheck }} />
      
      <div className="absolute bottom-24 right-10">
        <MapControls position="bottom-right" />
      </div>
    </Map>
  </section>
  <SubscriptionDrawer
      isOpen ={openSubscripDraw} 
      onClose={()=>setOpenSubscripDraw(false)}
      setValue={setUserRole}
    />
  <footer className="absolute bottom-8 left-0 right-0 z-[1000] px-6 pointer-events-none">
    <div className="max-w-xl mx-auto flex items-center justify-between gap-4 pointer-events-auto bg-slate-900/95 backdrop-blur-2xl p-2.5 rounded-[28px] border border-indigo-500/30 shadow-2xl">
      
      {/* RESTORED REPORT BUTTON LOGIC */}
      <Button 
        onClick={() => {
          setReport(prev => !prev);
          handleFlyTo([draggableMarker.lng, draggableMarker.lat]);
        }}
        className={`h-10 px-5 rounded-xl transition-all flex gap-2 items-center border text-[11px] font-bold tracking-wider
          ${report ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/40' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
      >
        <AlertTriangle size={16} />
        <span>REPORT DANGER</span>
      </Button>

      {/* Style Pill - Integrated into bar */}
      <div className="flex items-center gap-2 bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-white/5">
        <Mountain size={14} className="text-indigo-400" />
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as StyleKey)}
          className="bg-transparent text-white text-[10px] font-bold uppercase outline-none cursor-pointer"
        >
          <option value="default">Standard</option>
          <option value="openstreetmap">Detailed</option>
          <option value="openstreetmap3d">3D Terrain</option>
        </select>
      </div>

      {/* AI Safe Path - Using Deep Indigo Theme */}
      <Button 
        onClick={() => {
          subscribe()
         
        }}
        disabled={isCalculating || isEmpty}
        className={`
          relative h-10 px-5 overflow-hidden
          bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900
          text-white border border-indigo-500/40
          rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.2)]
          transition-all duration-300 group
          ${isCalculating ? 'opacity-70' : 'hover:border-indigo-400 hover:scale-[1.02] active:scale-95'}
        `}
      >
        <div className="relative z-10 flex items-center gap-2">
          {isCalculating ? (
            <>
              <BrainCircuit size={18} className="text-indigo-300 animate-pulse" />
              <span className="text-[10px] font-medium uppercase">Processing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">AI SAFE PATH</span>
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
