import mapImage from "../assets/map_image1.png";

interface RouteDiamondMockupProps {
  /** Sizes the outer diamond stack, e.g. "w-72 h-72 md:w-96 md:h-96" */
  className?: string;
  /** Sizes the phone within the stack, e.g. "w-44 md:w-56" */
  phoneClassName?: string;
}

/**
 * The two-diamond-plus-phone hero graphic from the brand reference: a
 * gradient rotated square behind a lighter outlined one, with a phone
 * mockup (dark map + red safe-route line + current-location dot) centered
 * over both.
 */
export default function RouteDiamondMockup({ className = "", phoneClassName = "w-44 md:w-56" }: RouteDiamondMockupProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-[2.5rem] rotate-45 bg-gradient-to-br from-brand-blue to-brand-blue-dark shadow-2xl" />
      <div className="absolute inset-0 -translate-x-4 -translate-y-4 rounded-[2.5rem] rotate-45 border-2 border-white/70 bg-white/30 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${phoneClassName} aspect-[9/19] rounded-[2rem] border-[6px] border-brand-ink bg-brand-ink shadow-2xl overflow-hidden relative`}>
          <img src={mapImage} alt="Live safe-route map preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M22,175 C42,145 30,112 55,92 S82,62 66,28" stroke="#ef4444" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="22" cy="175" r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
