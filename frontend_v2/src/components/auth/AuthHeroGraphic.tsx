import diamondBackground from "../../assets/diamond-background.png";
import mapPhone from "../../assets/map-phone.png";

/** diamond-background.png as the backdrop with map-phone.png layered centered on top of it. */
export default function AuthHeroGraphic() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <img src={diamondBackground} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-contain" />
      <img src={mapPhone} alt="Mapper app preview" className="relative w-36 object-contain" />
    </div>
  );
}
