import React from 'react';
import { Link } from 'react-router';
import { Users, MapPin, AlertTriangle, UserCog, BarChart3 } from 'lucide-react';
import AdminShell from '@/components/AdminShell';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}

const Admin: React.FC = () => {
  // Only pages that are actually built and wired up are listed here.
  const navItems: NavItem[] = [
    {
      href: '/users.html',
      icon: <Users size={22} />,
      label: 'Driver Management',
      sub: 'Reset passwords & remove drivers',
    },
    {
      href: '/admin_locations',
      icon: <MapPin size={22} />,
      label: 'Destinations',
      sub: 'View logged user destinations',
    },
    {
      href: '/reports.html',
      icon: <AlertTriangle size={22} />,
      label: 'Hazard Reports',
      sub: 'Edit hazard type & remove reports',
    },
    {
      href: '/admin_staff',
      icon: <UserCog size={22} />,
      label: 'Staff Accounts',
      sub: 'Create Traffic Authority, Security Agency & Analyst logins',
    },
    {
      href: '/admin_safety_report',
      icon: <BarChart3 size={22} />,
      label: 'Safety Report',
      sub: 'System-wide hazard & trip statistics',
    },
  ];

  return (
    <AdminShell
      title="Route Safety Monitor"
      subtitle="Administrative user portal"
      backTo="/"
    >
      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className="block p-6 bg-white border border-brand-border rounded-2xl shadow-sm transition-colors hover:border-brand-blue/40"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-blue-soft text-brand-blue flex items-center justify-center mb-3">
              {item.icon}
            </div>
            <span className="block font-bold text-base">{item.label}</span>
            <span className="block text-sm text-brand-muted mt-1">{item.sub}</span>
          </Link>
        ))}
      </nav>
    </AdminShell>
  );
};

export default Admin;
