import {
  BarChart3,
  BellRing,
  Boxes,
  CloudSnow,
  FileCheck2,
  GitCompareArrows,
  History,
  LayoutDashboard,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", description: "Station health at a glance", icon: LayoutDashboard },
  { href: "/dashboard/alerts", label: "Alerts", description: "Every station alert, unacknowledged and acknowledged", icon: BellRing },
  { href: "/dashboard/twin", label: "Digital Twin", description: "3D model of the station with live building health", icon: Boxes },
  { href: "/dashboard/energy", label: "Energy", description: "Generators, renewables, battery and heating load", icon: Zap },
  { href: "/dashboard/logistics", label: "Logistics", description: "Fuel runway, inventory and the next resupply", icon: BarChart3 },
  { href: "/dashboard/environment", label: "Environment", description: "Weather, wind chill and outdoor safety", icon: CloudSnow },
  { href: "/dashboard/replay", label: "Replay", description: "Scrub back through past station states", icon: History },
  { href: "/dashboard/compliance", label: "Compliance", description: "Diesel, emissions, waste and spill records", icon: FileCheck2 },
  { href: "/dashboard/crew", label: "Crew", description: "Anonymous wellbeing trends and incidents", icon: Users },
  { href: "/dashboard/compare", label: "Compare", description: "Maitri and Bharati side by side", icon: GitCompareArrows },
];
