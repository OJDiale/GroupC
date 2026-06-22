import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
    type NewsItem ,
    type DisplayMessageToScreenProps,
    type PlaceInformation,type RouteData
} from "./types"
import newImage1 from "../assets/newImage1.jpg"
import newImage2 from "../assets/newImage2.jpg"
import newImage3 from "../assets/newImage2.jpg"
import { redirect } from "react-router"

//do not modify this code it came with installations
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Type definition for geographic coordinates: [longitude, latitude]
export type GeoCoordinate = [number, number]; // [longitude, latitude]

/**
 * Calculates a real street route, actively steering the routing engine
 * around hazard zones by generating physical detour checkpoints.
 * 9226272a-737e-4619-b5bf-ddd689ece99b
 */
export async function fetchSafeRoadRoute(
    start: GeoCoordinate,
    destination: GeoCoordinate,
    avoidList: GeoCoordinate[],
    safetyRadiusMeters: number = 300
): Promise<GeoCoordinate[]> {
    
    // 1. Get the standard, absolute fastest road path first
    let standardRoute = await callFreeRoutingEngine(start, destination);
    if (standardRoute.length === 0) return [];

    // 2. Scan the road path to see if it breaches any safety thresholds
    let breachIndex = -1;
    let targetHazard: GeoCoordinate | null = null;

    for (let i = 0; i < standardRoute.length; i++) {
        for (const avoidPoint of avoidList) {
            if (haversineMeters(standardRoute[i], avoidPoint) <= safetyRadiusMeters) {
                breachIndex = i;
                targetHazard = avoidPoint;
                break;
            }
        }
        if (breachIndex !== -1) break;
    }

    // 3. If the path is perfectly safe, return it as-is!
    if (breachIndex === -1 || !targetHazard) {
        return standardRoute;
    }

    // 4. DETOUR STRATEGY: Create a geometric escape midpoint
    // We look at the heading direction right before the breach to calculate a perpendicular detour waypoint
    const breachPoint = standardRoute[breachIndex];
    const previousPoint = standardRoute[Math.max(0, breachIndex - 5)];
    
    const dy = breachPoint[1] - previousPoint[1];
    const dx = breachPoint[0] - previousPoint[0];
    
    // Rotate 90 degrees to find a parallel street vector
    const perpendicularLng = -dy;
    const perpendicularLat = dx;
    
    // Project the detour point outward past the safety radius (~0.003 degrees ≈ 330 meters)
    const magnitude = Math.sqrt(perpendicularLng * perpendicularLng + perpendicularLat * perpendicularLat) || 1;
    const offsetFactor = 0.003; 
    
    const detourWaypoint: GeoCoordinate = [
        breachPoint[0] + (perpendicularLng / magnitude) * offsetFactor,
        breachPoint[1] + (perpendicularLat / magnitude) * offsetFactor
    ];

    // 5. Fetch two separate clean legs that bypass the hazard zone entirely:
    // Leg A: From the Start to our new safe detour street
    // Leg B: From that detour street safely to the final destination
    console.log("Hazard detected on main route. Generating street detour via:", detourWaypoint);
    
    const legA = await callFreeRoutingEngine(start, detourWaypoint);
    const legB = await callFreeRoutingEngine(detourWaypoint, destination);

    // Combine the road legs together cleanly
    return [...legA, ...legB];
}

/**
 * Standard OSRM road router fetch call (100% Free, no API keys needed)
 */
async function callFreeRoutingEngine(p1: GeoCoordinate, p2: GeoCoordinate): Promise<GeoCoordinate[]> {
    const url = `https://router.project-osrm.org/route/v1/driving/${p1[0]},${p1[1]};${p2[0]},${p2[1]}?overview=full&geometries=geojson`;
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
//fake data
export const newsItems :Array<NewsItem> = [
    {
        id : 1,
        title: "News Item 1",
        description: "Description for News Item 1 sddgd   bdjddjsjjss wwjww wjhwhwhqhq"+
               "edde  njdskkkdd wke ee dewjnedned wejedjjewjdkw fdreryreyyeueuurffwwe",
        src:newImage1
    },
    {
        id : 2,
        title: "News Item 2",
        description: "Description for News Item 2",
        src:newImage2
    },
    {
        id : 3,
        title: "News Item 3",
        description: "Description for News Item 3",
        src:newImage3
    }
]

//delay to simulate a promise form a server
export const sleep: (ms: number) => Promise<void> = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
//home page message animation function that displays the message one character at a time and then displays the navigate button after the message has been fully displayed.
export async function  displayMessageToScreen({ message, setButtonDisplayed,setMessageToBeDisplayed }:DisplayMessageToScreenProps )
 {
       
    
       for(let i=0;i<message.length;i++){
            // 
             await  sleep(50)
             setMessageToBeDisplayed(pre=>pre.includes("|") ? pre.replace("|","") : pre)
             setMessageToBeDisplayed(pre=>pre.length<message.length ? pre+message[i]:pre)
             setMessageToBeDisplayed(pre=>pre+"|")
        }  
        setMessageToBeDisplayed(pre=>pre.includes("|") ? pre.replace("|","") : pre)
        setButtonDisplayed(true)
   }

//the samethinng as the loggIn function but with a different name to test the login functionality in the account holder page
 export const loggIn =  async (message:string)=>{
                        const isLoggedIn = localStorage.getItem("token")
                        if(!isLoggedIn) return redirect(`/login?message=${message}`)
                     }


//reverse geocoding function that takes gps coordinates and distination coordinates and returns the city and street of both the current location and the distination to be displayed on the map popup when a route is pinned
export async function reverseGeocoding(
  gpsCoords: Array<number>,
  destinationLat: number | "" | null,
  destinationLon: number | "" | null,
  setMapPopupInfo: React.Dispatch<React.SetStateAction<Array<PlaceInformation>>>
) {
  // 1. Guard Clause: Check for valid coordinates
  if (!destinationLat || !destinationLon || !gpsCoords[0] || !gpsCoords[1]) {
    console.warn("Invalid coordinates provided to reverseGeocoding");
    return;
  }

  const apiKey = "5e7b1eab70f24694a61d4362ce38f88e"; // Move to env file later

  try {
    // 2. Parallel Fetching (Faster)
    const [startRes, endRes] = await Promise.all([
      fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${gpsCoords[1]}&lon=${gpsCoords[0]}&format=json&apiKey=${apiKey}`),
      fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${destinationLat}&lon=${destinationLon}&format=json&apiKey=${apiKey}`)
    ]);

    const startData = await startRes.json();
    const endData = await endRes.json();

    // 3. Safe Access with Optional Chaining and Defaults
    const startPoint = startData.results?.[0];
    const endPoint = endData.results?.[0];

    if (startPoint && endPoint) {
      setMapPopupInfo([
        { 
          city: startPoint.city || "Unknown City", 
          street: startPoint.formatted || "Unknown Street" 
        },
        { 
          city: endPoint.city || "Unknown City", 
          street: endPoint.formatted || "Unknown Street" 
        }
      ]);
    }
  } catch (error) {
    console.error("Failed to fetch address data:", error);
    // Optionally set an error state here to show the user
  }
}

export async function fetchRoutes(
            coords: Array<number>,
            distinationLat: number|""|null,
            distinationLon: number|""|null,
            setRoutes: React.Dispatch<React.SetStateAction<RouteData[]>>,
            setIsLoading:React.Dispatch<React.SetStateAction<boolean>>
          ) {

             setIsLoading(true)
      try {
       
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords[0]},${coords[1]};${distinationLon},${distinationLat}?overview=full&geometries=geojson&alternatives=true`
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


    import * as turf from "@turf/turf";
   
    
    /**
 * Checks if a route line intercepts a circular avoidance area.
 * * @param routeCoordinates Array of [longitude, latitude] coordinates representing the route path
 * @param avoidCenter The [longitude, latitude] center of the area to avoid
 * @param avoidRadiusInKm The radius of the avoidance area in kilometers (defaults to 1)
 */
export function doesRouteInterceptAvoidZone(
  routeCoordinates: [number, number][],
  avoidCenter: [number, number],
  avoidRadiusInKm: number = 1
): boolean {
  // Edge case: An empty route or a single point route cannot form a line string
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return false;
  }

  // 1. Convert the coordinate array into a Turf LineString helper object
  const routeLine = turf.lineString(routeCoordinates);

  // 2. Convert the avoidance center array into a Turf Point helper object
  const centerPoint = turf.point(avoidCenter);

  // 3. Calculate the shortest distance from the avoidance center to any point along the route line
  const shortestDistance = turf.pointToLineDistance(centerPoint, routeLine, {
    units: "kilometers"
  });

  // 4. If the shortest distance to the line is inside the radius, the route intercepts the zone
  return shortestDistance <= avoidRadiusInKm;
}

const BASE_URL = "http://localhost:5000";
/**
 * Fetches accident history and extracts a flat array of coordinates
 * @returns Promise<[number, number][]> - An array of [longitude, latitude] pairs
 */
export async function fetchAccidentCoordinates(): Promise<[number, number][]> {
  try {
    const response = await fetch("http://localhost:8002/mapper/api/history");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Navigate the GeoJSON structure to extract only the coordinates
    // FeatureCollection -> features (array) -> geometry -> coordinates
    const coordinates: [number, number][] = data.features.map(
      (feature: any) => feature.geometry.coordinates
    );

    return coordinates;
  } catch (error) {
    console.error("Failed to fetch accident coordinates:", error);
    return [];
  }
}


//report harzard
export interface HazardReportPayload {
  latitude: number;
  longitude: number;
  hazardType: string;
}

/**
 * Dispatches a reported hazard to the application backend system
 */
export async function submitHazardReport(payload: HazardReportPayload): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL+"/api/hazards", {
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

//get hazardz
export interface BackendHazard {
  id: number;
  username:string;
  latitude: number;
  longitude: number;
  hazardType: string;
  createdAt: string; // ISO or DB Timestamp string
}

export interface UIHazardReport {
  id: string;
  userName:string;
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

/**
 * Parses a backend database timestamp into a human-friendly relative time string
 */
export function formatRelativeTime(dbDateString: string): string {
  const now = new Date();
  
  // Clean up SQLite space separation and append 'Z' to explicitly denote UTC
  const utcFormattedString = dbDateString.includes('Z') 
    ? dbDateString 
    : `${dbDateString.replace(' ', 'T')}Z`;

  const past = new Date(utcFormattedString);
  const diffInMs = now.getTime() - past.getTime();
  
  // Guard against slight clock synchronization skew (e.g., negative millisecond differences)
  if (diffInMs < 0) return "Just now";

  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);

  if (diffInMins < 1) return "Just now";
  if (diffInMins < 60) return `${diffInMins} mins ago`;
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Fetches real telemetry markers from the SQLite Express Backend
 */
export async function fetchAndResolveHazardReports(
  setReports?: React.Dispatch<React.SetStateAction<UIHazardReport[]>>
): Promise<UIHazardReport[]> {
  const apiKey = "5e7b1eab70f24694a61d4362ce38f88e";

  try {
    // 1. Fetch live telemetry records from your database
    const response = await fetch(`${BASE_URL}/api/hazards`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Server returned error status code: ${response.status}`);
    }

    const rawData: BackendHazard[] = await response.json();

    // 2. Map backend rows immediately to your UI structure with defaults
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

    // If the component provided a state updater, display the markers immediately
    if (setReports) {
      setReports(initialReports);
    }

    // 3. Process the coordinate geocoding sequentially over the array
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

          // Mutate our local tracking array instance
          initialReports[i].info = updatedInfo;

          // If updating UI live, stream the changes row-by-row
          if (setReports) {
            setReports((prev) =>
              prev.map((item) =>
                item.id === report.id ? { ...item, info: updatedInfo } : item
              )
            );
          }
        }

        // Slight cooling pause to protect rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (geoError) {
        console.error(`Failed single address conversion for ${report.id}:`, geoError);
      }
    }

    // Return the completely filled array at the end of execution
    return initialReports;

  } catch (error) {
    console.error("Failed to query and process live database reports:", error);
    throw error;
  }
}




export interface DestinationLog {
  id: number;
  userId?: number;
  username?: string; // Automatically matched to the u.username INNER JOIN alias
  startLocation: string; // Maps directly to startLocation SELECT alias
  endLocation: string;   // Maps directly to endLocation SELECT alias
  createdAt: string;     // Maps directly to createdAt SELECT alias
}

export interface NewDestinationPayload {
  startLocation: string;
  endLocation: string;
}

const getHeaders = (token: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`,
});

// ==========================================
// --- CLIENT / NORMAL USER ENDPOINTS ---
// ==========================================

/**
 * POST /api/normal-user/destinations
 * Matches your exact backend structure: only transmits startLocation and endLocation
 */
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

// Assuming DestinationLog type matching your utility signature
export interface DestinationLog {
    id?: string | number;
    name: string;
    address?: string;
    lat: number;
    lng: number;
    safetyRating?: 'secure' | 'warning' | string;
}

// 1. Integrated standalone network utility function
export async function fetchUserDestinationHistory(token: string): Promise<DestinationLog[]> {
    try {
        // Adjust BASE_URL context if managed externally or via window environment configuration
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
// ==========================================
// --- ADMINISTRATIVE ENDPOINTS ---
// ==========================================

/**
 * GET /api/admin-user/destinations
 * Pulls the compiled global tracking metrics list
 */
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

/**
 * DELETE /api/admin-user/destinations/:id
 * Permanently removes a logging entry line out of the destination log table
 */
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
