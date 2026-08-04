import diamondBackground from "../../assets/diamond-background.png";
import mapPhone from "../../assets/map-phone.png";

interface AuthHeroGraphicProps {
  /** Sizes the outer diamond-background stack. Defaults to the auth-sidebar size. */
  className?: string;
  /** Sizes the phone mockup layered on top. Defaults to the auth-sidebar size. */
  phoneClassName?: string;
}

/** diamond-background.png as the backdrop with map-phone.png layered centered on top of it. */
export default function AuthHeroGraphic({ className = "w-64 h-64", phoneClassName = "w-36" }: AuthHeroGraphicProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img src={diamondBackground} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-contain" />
      <img src={mapPhone} alt="Mapper app preview" className={`relative object-contain ${phoneClassName}`} />
    </div>
  );
}
