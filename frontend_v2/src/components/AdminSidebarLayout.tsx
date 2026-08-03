import { useEffect, useState, type ComponentType } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Users, MapPin, AlertTriangle, UserCog, BarChart3, Sparkles, ClipboardList,
  ShieldAlert, LogOut, UserCircle2, type LucideProps,
} from "lucide-react";
import Logo from "./Logo";
import AdminProfileModal from "./AdminProfileModal";
import { userData } from "../database/auth.js";

interface NavItem {
  href: string;
  Icon: ComponentType<LucideProps>;
  label: string;
  sub: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/driver-management", Icon: Users, label: "Driver Management", sub: "Reset passwords & remove drivers" },
  { href: "/admin/destinations", Icon: MapPin, label: "Destinations", sub: "View logged user destinations" },
  { href: "/admin/hazard-reports", Icon: AlertTriangle, label: "Hazard Reports", sub: "Edit hazard type & remove reports" },
  { href: "/admin/staff-accounts", Icon: UserCog, label: "Staff Accounts", sub: "Create Traffic Authority, Security Agency & Analyst logins" },
  { href: "/admin/safety-report", Icon: BarChart3, label: "Safety Report", sub: "System-wide hazard & trip statistics" },
  { href: "/admin/trip-completion-report", Icon: ClipboardList, label: "Trip Completion Report", sub: "Every completed trip, with server-computed duration" },
  { href: "/admin/hazard-response-report", Icon: ShieldAlert, label: "Hazard Response Report", sub: "Audit trail of who resolved (or reopened) each hazard" },
  { href: "/admin/live-risk-intelligence", Icon: Sparkles, label: "Live Risk Intelligence", sub: "Review AI-classified news before it reaches the risk database" },
];

export default function AdminSidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username?: string; email?: string } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    userData().then(setProfile).catch(() => setProfile({}));
  }, []);

  // The admin portal must only be left via the logout button (point 3 of the
  // spec). Rather than losing the browser Back button entirely, pressing it
  // re-pushes the current admin URL (canceling the navigation) and offers to
  // log out instead of silently trapping the user.
  useEffect(() => {
    const pushGuard = () => window.history.pushState(null, "", window.location.href);
    pushGuard();
    const onPopState = () => {
      pushGuard();
      setConfirmLogout(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Typing a new URL (or a bare domain) into the address bar and hitting
  // Enter is a full page navigation, not a same-document event — JS on the
  // current page can't intercept it or render a custom popup for it the way
  // popstate lets us do for the browser Back button. beforeunload is the
  // only hook browsers allow, and it can only trigger their own generic
  // "Leave site?" confirmation (browsers hard-code that text for security
  // reasons — no custom message or logout button is possible here). Still
  // better than nothing: it gives the admin a chance to cancel before
  // actually leaving.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const activeIndex = NAV_ITEMS.findIndex((item) => location.pathname.startsWith(item.href));

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const currentTitle = activeIndex >= 0 ? NAV_ITEMS[activeIndex].label : "Admin";

  return (
    // Fixed to the viewport (rather than h-screen/w-screen on a normal
    // in-flow div) so nothing on the page — a toast container, an old
    // #root sizing quirk, whatever — can ever inflate document scroll
    // height and push the logout button below the fold.
    <div className="fixed inset-0 flex overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className="w-1/5 shrink-0 h-full flex flex-col overflow-visible relative z-10"
        style={{ background: "linear-gradient(to bottom, #05031b, #1f8aa2)" }}
      >
        <div className="pt-7 pb-5 px-3 text-center shrink-0">
          <h1 className="text-white font-bold text-lg leading-tight">Mapper Admin Portal</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Logo size={18} showWordmark={false} ringClassName="text-white" />
            <p className="text-white text-xs font-normal">Safe Routing. Stress-Free Travel.</p>
          </div>
        </div>

        {/* No overflow/scroll here on purpose — 8 items comfortably fit any
            real viewport height, and any overflow-y-auto here would force
            overflow-x to also compute to 'auto' per the CSS spec, clipping
            the active item's bleed into the content section with an
            unwanted horizontal scrollbar. */}
        <nav className="flex-1">
          {NAV_ITEMS.map((item, i) => {
            const isActive = i === activeIndex;
            const prevActive = i - 1 === activeIndex;
            const showSeparator = i > 0 && !isActive && !prevActive;

            return (
              <div key={item.href} className="relative group py-1">
                {showSeparator && <div className="w-[90%] mx-auto border-t" style={{ borderColor: "#cdd6ff" }} />}
                <Link
                  to={item.href}
                  className={`relative flex items-center justify-center gap-3 px-4 transition-all duration-200 rounded-xl ${
                    isActive
                      ? "py-4 text-base font-semibold text-white w-[112%] z-20 shadow-lg"
                      : "py-3 text-sm text-[#e4fdff] w-[90%] mx-auto hover:bg-white/10"
                  }`}
                  style={isActive ? { background: "linear-gradient(to right, #72cff1, #3536b8)" } : undefined}
                >
                  <item.Icon size={isActive ? 24 : 20} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>

                {/* Hover tooltip with the old page subtitle — wraps instead
                    of running off the right edge of the window. */}
                <div className="pointer-events-none absolute left-[85%] top-1/2 -translate-y-1/2 ml-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#0b0a24] text-[#e4fdff] text-xs px-3 py-1.5 rounded-lg shadow-xl w-[220px] whitespace-normal break-words">
                  {item.sub}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 shrink-0">
          <button
            type="button"
            onClick={logout}
            className="w-[90%] mx-auto flex items-center justify-center gap-2 py-1.5 rounded-xl font-normal text-white bg-[#171e5b] active:bg-white active:text-[#171e5b] transition-colors"
          >
            <LogOut size={14} />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </aside>

      {/* HEADER + CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-brand-border bg-white relative z-0">
          <h2 className="text-xl font-extrabold text-brand-ink truncate">{currentTitle}</h2>

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center shrink-0">
              <UserCircle2 size={22} />
            </div>
            <div className="text-left leading-tight">
              <p className="font-bold text-black text-sm">{profile?.username || "…"}</p>
              <p className="text-gray-400 text-xs">{profile?.email || ""}</p>
            </div>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brand-bg">
          <div className="w-[80%] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {isProfileOpen && <AdminProfileModal onClose={() => setIsProfileOpen(false)} />}

      {confirmLogout && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-brand-ink">Log out?</h3>
            <p className="text-sm text-brand-muted mt-2">
              You can't go back to the site while in the admin portal. Would you like to log out instead?
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="px-4 py-2 rounded-lg border border-brand-border text-sm font-semibold text-brand-muted hover:text-brand-ink"
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-[#171e5b] text-white text-sm font-semibold hover:opacity-90"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
