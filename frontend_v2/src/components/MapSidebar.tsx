import { NavLink } from "react-router";
import { LocateFixed, MapPin, Map as MapIcon, History, Radio, AlertTriangle, type LucideIcon } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

interface MapSidebarProps {
  onMe: () => void;
  onDropPin: () => void;
  pickingDestination: boolean;
  reportActive: boolean;
  onReportDanger: () => void;
}

const itemClass = (active: boolean) =>
  `flex flex-col items-center gap-1 py-3 w-full transition-colors ${active ? "text-black" : "text-gray-400 hover:text-gray-600"}`;

function SidebarButton({
  icon: Icon,
  label,
  active,
  onClick,
  title,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button type="button" onClick={onClick} title={title || label} className={itemClass(Boolean(active))}>
      <Icon size={20} />
      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </button>
  );
}

/**
 * White icon rail replacing the old dark floating toolbar buttons. Route/
 * History/Live stay NavLinks so their active state comes from the router
 * (matches MapPage's nested /map routes) rather than local state.
 */
export default function MapSidebar({ onMe, onDropPin, pickingDestination, reportActive, onReportDanger }: MapSidebarProps) {
  return (
    <aside className="absolute inset-y-0 left-0 z-[1000] w-20 bg-white border-r border-brand-border flex flex-col items-center py-4 shadow-sm">
      <SidebarButton icon={LocateFixed} label="Me" onClick={onMe} title="Center on my location" />

      <SidebarButton
        icon={MapPin}
        label="Drop Pin"
        active={pickingDestination}
        onClick={onDropPin}
        title="Drop a pin to choose a destination"
      />

      <NavLink to="/map" end title="Current route" className={({ isActive }) => itemClass(isActive)}>
        <MapIcon size={20} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">Route</span>
      </NavLink>

      <NavLink to="historical_events" title="Past hazard reports" className={({ isActive }) => itemClass(isActive)}>
        <History size={20} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">History</span>
      </NavLink>

      <NavLink to="current_events" title="Live hazard reports" className={({ isActive }) => itemClass(isActive)}>
        <Radio size={20} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">Live</span>
      </NavLink>

      <SidebarButton icon={AlertTriangle} label="Report" active={reportActive} onClick={onReportDanger} title="Report danger" />

      <div className="flex-1" />

      <NotificationCenter panelSide="left" />
    </aside>
  );
}
