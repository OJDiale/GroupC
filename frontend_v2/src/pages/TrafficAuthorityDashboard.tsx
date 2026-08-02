import StaffReportDashboard from "@/components/StaffReportDashboard";

const HAZARD_TYPES = [
  { value: "protest", label: "Protest" },
  { value: "road_closure", label: "Road Closure" },
  { value: "march", label: "March" },
  { value: "danger_zone", label: "Danger Zone" },
];

export default function TrafficAuthorityDashboard() {
  return (
    <StaffReportDashboard
      title="Traffic Authority"
      subtitle="Record protests, road closures and danger zones so drivers are routed around them."
      hazardTypeOptions={HAZARD_TYPES}
      accentClass="bg-amber-600 hover:bg-amber-700"
    />
  );
}
