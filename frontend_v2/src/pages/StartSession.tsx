import { Outlet, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import Logo from "../components/Logo";
import RouteDiamondMockup from "../components/RouteDiamondMockup";

export default function StartSession() {
  const navigate = useNavigate();
  return (
    <div className="w-screen min-h-screen flex bg-brand-bg text-brand-ink">
      <div className="max-lg:hidden relative w-1/2 bg-brand-ink overflow-hidden flex items-center justify-center p-12">
        <button
          className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} /> Back to home
        </button>

        <div className="absolute top-8 right-8 z-10">
          <Logo ringClassName="text-white" />
        </div>

        <RouteDiamondMockup className="w-72 h-72" phoneClassName="w-40" />

        <p className="absolute bottom-8 left-8 right-8 text-sm text-slate-400 max-w-xs">
          Routes that weigh hazard reports, not just distance and time.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </div>
    </div>
  );
}
