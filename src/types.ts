export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD format
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  status: "pending" | "done";
  color: string; // e.g., 'orange' | 'blue' | 'green' | 'purple' | 'rose'
  created_at: string;
}

export type ViewType = "year" | "month" | "week";

export type SidebarMenuType = "calendar" | "events" | "notes" | "reminders" | "documents" | "trash" | "settings";

export interface CategoryOption {
  value: string;
  label: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CATEGORIES: CategoryOption[] = [
  {
    value: "orange",
    label: "Work",
    colorClass: "#FF6A3D",
    bgClass: "bg-[#FF6A3D]/10",
    textClass: "text-[#FF6A3D]",
    borderClass: "border-[#FF6A3D]/20",
  },
  {
    value: "blue",
    label: "Dev/Coding",
    colorClass: "#3B82F6",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
    borderClass: "border-blue-500/20",
  },
  {
    value: "green",
    label: "Personal",
    colorClass: "#10B981",
    bgClass: "bg-green-500/10",
    textClass: "text-green-500",
    borderClass: "border-green-500/20",
  },
  {
    value: "purple",
    label: "Meeting",
    colorClass: "#8B5CF6",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-500",
    borderClass: "border-purple-500/20",
  },
  {
    value: "rose",
    label: "Health/Wellness",
    colorClass: "#F43F5E",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-500",
    borderClass: "border-rose-500/20",
  },
];
