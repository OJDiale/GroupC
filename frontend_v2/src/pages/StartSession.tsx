import { Outlet } from "react-router";
import Logo from "../components/Logo";
import AuthHeroGraphic from "../components/auth/AuthHeroGraphic";
import { usePageTitle } from "@/lib/usePageTitle";

/** Shared shell for /login, /login/signin and /login/forgot-password. */
export default function StartSession() {
  usePageTitle("Sign In");
  return (
    <div className="w-full min-h-screen flex bg-brand-bg text-brand-ink">
      <div className="max-lg:hidden w-2/5 shrink-0 min-h-screen bg-gradient-to-b from-auth-navy to-auth-teal flex flex-col items-center px-10 py-12 text-center">
        <div className="flex items-center justify-center gap-2">
          <Logo size={32} showWordmark={false} ringClassName="text-white" />
          <span className="logo-font text-white">Mapper</span>
        </div>

        <div className="mt-10">
          <p className="text-2xl font-bold text-white leading-tight">Safe Routing.</p>
          <p className="text-2xl font-bold text-auth-cyan leading-tight">Stress-Free Travel.</p>
        </div>

        <p className="mt-6 max-w-xs text-sm text-white/85">
          Advanced map routing algorithm for safe and efficient travel around the country.
        </p>

        <div className="flex-1 flex items-center justify-center">
          <AuthHeroGraphic />
        </div>
      </div>

      <div className="flex-1 min-h-screen flex flex-col">
        {/* Mobile-only header: the branded left panel is hidden below lg */}
        <div className="lg:hidden flex items-center justify-center p-4 sm:p-6">
          <Logo size={26} />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
