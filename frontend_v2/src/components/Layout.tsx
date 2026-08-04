import { Outlet, NavLink, Link, useLocation } from "react-router";
import { CircleUserRound, Menu, X, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { userData } from "../database/auth.js";
import Logo from "./Logo";
import NotificationCenter from "./NotificationCenter";

export default function HomePage() {
  const isLoggedIn = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const mainRef = useRef<HTMLDivElement>(null);

  function getLocation() {
    const options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      (pos) => console.log("Location found:", pos.coords),
      (err) => console.warn(`ERROR(${err.code}): ${err.message}`),
      options
    );
  }

  useEffect(() => {
    let permissionResult = null;

    // 1. Fetch User Data
    async function fetchUserData() {
      try {
        const userDetails = await userData();
        setUser(userDetails);

        // FIX: Extract user_id from the immediate variable payload, not the stale state variable
        if (userDetails && userDetails.user_id) {
          localStorage.setItem("userId", JSON.stringify(userDetails.user_id));
        }
      } catch (err) {
        console.error("Failed to sync homepage identity:", err);
      }
    }

    if (isLoggedIn) fetchUserData();

    // 2. Geolocation Permission Logic
    const handlePermission = (state) => {
      if (state === 'granted' || state === 'prompt') {
        getLocation();
      }
    };

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      permissionResult = result;
      handlePermission(result.state);
      result.onchange = () => handlePermission(result.state);
    });

    // FIX: Provide a cleanup routine to untrack state updates if the page unmounts
    return () => {
      if (permissionResult) {
        permissionResult.onchange = null;
      }
    };
  }, [isLoggedIn]);

  // Stagger the mobile menu links in on open.
  useEffect(() => {
    if (!isMenuOpen) return;
    animate(".mobile-nav-item", {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: stagger(60),
      duration: 420,
      ease: "outQuad",
    });
  }, [isMenuOpen]);

  // Subtle entrance for freshly-routed page content.
  useEffect(() => {
    if (!mainRef.current) return;
    animate(mainRef.current, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 320,
      ease: "outQuad",
    });
  }, [location.pathname]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden bg-brand-bg">
      {/* HEADER */}
      <header className="sticky top-0 left-0 z-50 w-full h-16 px-4 md:px-8 flex items-center justify-between bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <Link to="/" aria-label="Mapper home">
          <Logo />
        </Link>

        {/* Desktop Right side */}
        <div className="max-md:hidden md:flex items-center gap-4 text-sm">
          {!isLoggedIn ? (
            <>
              <NavLink to="login" className="text-brand-ink font-medium hover:text-brand-blue transition-colors">
                Login
              </NavLink>
              <Link
                to="login/signin"
                className="border-4 border-[#15175b] bg-gradient-to-r from-auth-navy to-auth-teal hover:bg-none hover:bg-white hover:text-[#15175b] text-white font-semibold px-5 py-2 rounded-full transition-all"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <NotificationCenter />
              <NavLink to="account" className="flex items-center gap-2 text-brand-ink font-medium hover:text-brand-blue transition-colors">
                <CircleUserRound size={18} />
                <span>{user?.username || "Profile"}</span>
              </NavLink>
              <Link
                to="map"
                className="flex items-center gap-2 bg-brand-ink hover:bg-brand-blue-dark text-white font-semibold px-5 py-2 rounded-full transition-colors"
              >
                <MapPin size={16} /> Open Map
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-brand-ink" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-brand-bg text-brand-ink flex flex-col items-center justify-center gap-8 text-xl md:hidden">
          <NavLink className="mobile-nav-item" to="map" onClick={() => setIsMenuOpen(false)}>Map</NavLink>

          {!isLoggedIn ? (
            <>
              <NavLink className="mobile-nav-item" to="login" onClick={() => setIsMenuOpen(false)}>Login</NavLink>
              <NavLink
                to="login/signin"
                onClick={() => setIsMenuOpen(false)}
                className="mobile-nav-item border-4 border-[#15175b] bg-gradient-to-r from-auth-navy to-auth-teal hover:bg-none hover:bg-white hover:text-[#15175b] text-white font-semibold px-6 py-2 rounded-full transition-all"
              >
                Sign up
              </NavLink>
            </>
          ) : (
            <NavLink className="mobile-nav-item flex items-center gap-2" to="account" onClick={() => setIsMenuOpen(false)}>
              <CircleUserRound size={22} />
              <span>{user?.username || "Profile"}</span>
            </NavLink>
          )}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main ref={mainRef} className="flex-grow w-full">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="bg-white text-brand-muted py-10 px-6 font-sans mt-auto border-t border-brand-border">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-2">
          <span className="logo-font text-brand-ink">Mapper</span>
          <p className="text-xs text-brand-muted max-w-xs">
            Safe routing for South African roads.
          </p>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-brand-border text-center text-[10px]">
          &copy; {currentYear} Mapper. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
