import React from 'react';
import { Link, useNavigate } from 'react-router';

// Define the interface for our navigation links
interface NavItem {
  href: string;
  icon: string;
  label: string;
  sub: string;
}

const RouteSafetyMonitor: React.FC = () => {

  const navgate = useNavigate()
  // Navigation data array for cleaner maintenance
  const navItems: NavItem[] = [
    {
      href: '/admin_locations',
      icon: '📍',
      label: 'Saved Locations',
      sub: 'Manage area coordinates',
    },
    {
      href: '/users.html',
      icon: '👤',
      label: 'User Profiles',
      sub: 'Add, update & delete users',
    },
    {
      href: '/reports.html',
      icon: '📋',
      label: 'User Reports',
      sub: 'Browse submitted reports',
    },
    {
      href: '/saved_routes.html',
      icon: '🗺️',
      label: 'Saved Routes',
      sub: 'View route history',
    },
    {
      href: '/alert_log.html',
      icon: '🔔',
      label: 'Alert Logs',
      sub: 'Manage alert notifications',
    },
    {
      href: '/incidents.html',
      icon: '⚠️',
      label: 'Incident Archive',
      sub: 'Log & track incidents',
    },
  ];

  const handleLogout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
     localStorage.clear()
      navgate("/")
  };

  return (
    <div className="relative min-h-screen font-sans bg-[hsl(0,0%,10%)] text-white overflow-x-hidden">
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center brightness-[0.52] saturate-[0.8]"
        style={{ backgroundImage: `url('background-image.jpeg')` }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-[900px] mx-auto px-16 py-[60px] max-sm:px-6">
        <header>
          <div className="font-['Oswald'] text-[0.8rem] tracking-[2px] text-[#f0c040] uppercase mb-[2px]">
            Group C
          </div>
          <h1 className="font-['Oswald'] text-[3.4rem] font-bold text-white uppercase tracking-[3px] leading-tight mb-1.5 max-sm:text-4xl">
            Route Safety Monitor
          </h1>
          <div className="text-white/60 text-[0.95rem] tracking-[2px] uppercase mb-10">
            Administrative User Portal
          </div>
        </header>

        {/* Divider */}
        <hr className="border-0 border-t border-white/20 my-7" />

        {/* Navigation Grid */}
        <nav className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mt-8">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="block px-6 py-5.5 bg-black/45 border border-white/15 text-white font-['Oswald'] text-[1.05rem] tracking-[1.5px] uppercase transition-colors duration-200 hover:bg-[rgba(204,34,34,0.35)] hover:border-[rgba(204,34,34,0.7)]"
            >
              <span className="block text-[1.6rem] mb-2">{item.icon}</span>
              <span className="block text-[1rem]">{item.label}</span>
              <span className="block font-['Roboto'] font-normal text-[0.75rem] text-white/50 tracking-[1px] mt-1 normal-case">
                {item.sub}
              </span>
            </Link>
          ))}
        </nav>

        {/* Logout Form Component */}
        <form className="mt-8" onSubmit={handleLogout} method="POST">
          <button
            type="submit"
            className="inline-block px-6 py-2.5 bg-white/10 border border-white/25 text-white/70 font-['Oswald'] text-[0.82rem] font-semibold tracking-[1.5px] uppercase cursor-pointer transition-all duration-200 hover:bg-[rgba(204,34,34,0.4)] hover:border-[rgba(204,34,34,0.7)] hover:text-white"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
};

export default RouteSafetyMonitor;