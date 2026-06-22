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

export interface Distination {
        coords : Array<number> ,
        distination : Array<number>,
        placesToAvoid : Array<[number,number]>,
        data:Array<GeoCoordinate>
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