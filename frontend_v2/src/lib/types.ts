export interface NewsItem {
    id: number;
    title: string;
    description: string;
    src:string;
}

export type LinkProps = { isActive: boolean}

//User Type
export interface User{
    email :string,
    password :string
}

//type for action props
export interface ActionProps {request:Request}

export type DisplayMessageToScreenProps = {
       message:string;
       setButtonDisplayed:React.Dispatch<React.SetStateAction<boolean>>;
       setMessageToBeDisplayed:React.Dispatch<React.SetStateAction<string>>;
}

export type GeoCoordinate = [number, number];

// SafeMaster rerouting types (used by MapPage → MapCurrent via Outlet context)
export type RiskLevel = "SAFE" | "WARNING" | "DANGEROUS";

export interface SafeRouteCandidate {
  label: string;
  geojson: {
    type: "Feature";
    geometry: { type: "LineString"; coordinates: [number, number][] };
    properties: Record<string, unknown>;
  };
  riskScore: number;
  riskLevel: RiskLevel;
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
  riskLevel: RiskLevel;
  explanation: string;
  incidentsOnRoute: number;
  best: SafeRouteCandidate;
  alternatives: SafeRouteCandidate[];
}

export interface Distination {
        coords : Array<number> ,
        distination : Array<number>,
        placesToAvoid : Array<[number,number]>,
        // Standard OSRM route alternatives — owned by MapPage, populated only
        // when the "Direction" button is clicked (no more auto-routing).
        routes: RouteData[],
        // SafeMaster rerouting — passed from MapPage to MapCurrent via Outlet context
        safeRouteResult: SafeRouteResult | null,
        selectedAltIndex: number | null,
    }

    
 export interface PlaceInformation{
          city:string,
          street:string
    }

export  interface RouteData {
  coordinates: [number, number][];
  duration: number; // seconds
  distance: number; // meters
}

type GeoJsonPoint = {
  type: "Point";
  coordinates: [number, number];
};

type GeoJsonFeature = {
  type: "Feature";
  properties: {
    name: string;
    type: string;
    [key: string]: any; // Allows for additional flexible properties
  };
  geometry: GeoJsonPoint;
};

 export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};