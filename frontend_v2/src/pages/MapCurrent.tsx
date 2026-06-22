import { useOutletContext ,useSearchParams} from "react-router"
import { MapControls,MarkerContent,MapMarker,MarkerPopup, MapRoute } from "../components/ui/map"
import { useEffect,  useState,useMemo} from "react"
//import { MapPin } from "lucide-react";
import { type Distination ,type PlaceInformation,type RouteData} from "../lib/types"
import { reverseGeocoding ,fetchRoutes,fetchSafeRoadRoute,type  GeoCoordinate} from "../lib/utils"
import Spinner from "../components/Spinner"


export default  function MapCurrent(){
//comment before procceding

  
    const [searchParams , setSearchParams] = useSearchParams()
    const {coords,placesToAvoid,data} : Distination = useOutletContext()
    const [pinnedInfo , setPinnedInfo] = useState<Array<PlaceInformation>>([{city:"",street:""}])
   

    const [routes, setRoutes] = useState<RouteData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

  
    
    const distinationLon = searchParams.get("lon") && Number(searchParams.get("lon"))
    const distinationLat = searchParams.get("lat") && Number(searchParams.get("lat"))
    
   

     

 
     
   
    useEffect(()=>{
        fetchRoutes(coords,distinationLat,distinationLon,setRoutes,setIsLoading)
        reverseGeocoding(coords,distinationLat,distinationLon,setPinnedInfo)
    },[coords,distinationLat,distinationLon])
   //http://localhost:8002/mapper/api/history

   
    const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });



    //route directions with the selected route on top and different styling for it
    const directions = data.length<100 ? sortedRoutes.map(({ route, index }) => {
          const isSelected = index === selectedIndex;
          return (
            <MapRoute
              key={index}
              coordinates={route.coordinates}
              color={isSelected ? "red" : "green"}
              width={isSelected ? 6 : 5}
              opacity={isSelected ? 1 : 0.6}
              onClick={() => setSelectedIndex(index)}
            />
          );
        }) : <MapRoute
              coordinates={data}
              color={ "green"}
              width={ 6 }
              opacity={ 1 }
              
            />

    return <>

      
        {(distinationLon && distinationLat ) && directions}
        
            <MapMarker
                key={1}
                longitude={coords[0]}
                latitude={coords[1]}
            >
           
            <MarkerContent>
                <div className="size-5 rounded-full bg-blue-800 border-2 border-white shadow-lg" ></div>
            </MarkerContent>
            <MarkerPopup>
               { pinnedInfo[0]?.city ?<div className="space-y-1">
                    <p className="font-bold text-lg text-blue-600">{pinnedInfo[0]?.city}</p>
                    <p className="text-sm font-bold text-blue-600">{pinnedInfo[0]?.street}</p>
                </div>:<Spinner/>}
            </MarkerPopup>
               
            </MapMarker>
             
            {(distinationLon && distinationLat ) && (
                <MapMarker
                    key={3}
                    longitude={distinationLon}
                    latitude={distinationLat}
                >
                        <MarkerContent >
                          
                             { /*
                             <div className=" flex items-center flex-col   justify-center" >
                                 <MapPin className="  w-7 h-9 text-red-500 shadow-lg m-0"/ >
                             </div>
                             */}
                              <div className="size-5 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
                        </MarkerContent>
                        <MarkerPopup>
                           {pinnedInfo[1]?<div className="space-y-1">
                                <p className="font-bold text-lg text-blue-600">{pinnedInfo[1]?.city }</p>
                                <p className="text-sm font-bold text-blue-600">{pinnedInfo[1]?.street}</p>
                            </div>:<Spinner/>}
                        </MarkerPopup>
                </MapMarker>   
            )}
         </>
}
