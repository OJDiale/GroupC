import StaffReportDashboard from "@/components/StaffReportDashboard";
import { usePageTitle } from "@/lib/usePageTitle";

const HAZARD_TYPES = [
  { value: "hijacking", label: "Hijacking Hotspot" },
  { value: "crime_hotspot", label: "Crime Hotspot" },
  { value: "armed_robbery", label: "Armed Robbery" },
  { value: "other", label: "Other" },
];

export default function SecurityAgencyDashboard() {
  usePageTitle("Security Agency Dashboard");
  return (
    <StaffReportDashboard
      title="Security Agency"
      subtitle="Report crime hotspots and hijacking areas so the routing engine can steer drivers clear of them."
      hazardTypeOptions={HAZARD_TYPES}
      accentClass="bg-red-600 hover:bg-red-700"
    />
  );
}
