import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Inbox, 
  FileText, 
  Bell, 
  Folder, 
  Trash2, 
  Settings, 
  Plus,
  Moon,
  Sun,
  LogOut,
  User
} from "lucide-react";
import { SidebarMenuType } from "../types";

interface SidebarProps {
  selectedDate: Date;
  activeTab: SidebarMenuType;
  onTabChange: (tab: SidebarMenuType) => void;
  onAddEventClick: () => void;
  eventCount: number;
  trashCount: number;
  user?: { email: string; name: string } | null;
  onLogout?: () => void;
}

export default function Sidebar({
  selectedDate,
  activeTab,
  onTabChange,
  onAddEventClick,
  eventCount,
  trashCount,
  user,
  onLogout
}: SidebarProps) {
  // Format selected date
  const dayNumber = selectedDate.getDate().toString().padStart(2, "0");
  const monthYearStr = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const menuItems = [
    { id: "calendar" as SidebarMenuType, label: "Calendar", icon: Calendar, badge: null },
    { id: "events" as SidebarMenuType, label: "Events", icon: Inbox, badge: eventCount > 0 ? eventCount : null },
    { id: "notes" as SidebarMenuType, label: "Notes", icon: FileText, badge: null },
    { id: "reminders" as SidebarMenuType, label: "Reminders", icon: Bell, badge: null },
    { id: "documents" as SidebarMenuType, label: "Documents", icon: Folder, badge: null },
    { id: "trash" as SidebarMenuType, label: "Trash", icon: Trash2, badge: trashCount > 0 ? trashCount : null },
  ];

  return (
    <aside 
      id="sidebar"
      className="w-72 bg-[#F3F4F6] border-r border-gray-200/60 p-7 flex flex-col justify-between select-none shrink-0"
    >
      <div className="flex flex-col gap-8">
        {/* Top Logo / App Header */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-4 h-4 rounded-full bg-[#FF6A3D]" />
          <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>

        {/* Big Date Widget */}
        <div className="px-2 py-4">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={dayNumber}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="text-8xl font-display font-bold text-[#FF6A3D] tracking-tighter leading-none"
            >
              {dayNumber}
            </motion.div>
          </AnimatePresence>
          
          <AnimatePresence mode="popLayout">
            <motion.div
              key={monthYearStr}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="text-xl font-sans font-semibold text-gray-800 mt-2 tracking-tight"
            >
              {monthYearStr}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Primary Action Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddEventClick}
          className="w-full py-3.5 px-5 bg-[#FF6A3D] hover:bg-[#E2582B] text-white rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 font-sans font-medium text-sm tracking-wide active:scale-95 cursor-pointer cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span>+ Add Task</span>
        </motion.button>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 mt-4">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative group w-full flex items-center justify-between py-3 px-4 rounded-xl text-left font-sans text-[14px] font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? "text-[#FF6A3D]" 
                    : "text-gray-500 hover:text-gray-950 hover:bg-gray-200/50"
                }`}
              >
                {/* Active Indicator Slide Background */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                
                <div className="flex items-center gap-3">
                  <IconComponent 
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-[#FF6A3D] stroke-[2.2px]" : "text-gray-400 group-hover:text-gray-600 stroke-[1.8px]"
                    }`} 
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== null && (
                  <span className={`text-[10px] px-2 py-0.5 font-mono rounded-full font-bold ${
                    isActive ? "bg-[#FF6A3D] text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Menu Items */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => onTabChange("settings")}
          className={`relative group w-full flex items-center justify-between py-3 px-4 rounded-xl text-left font-sans text-[14px] font-medium transition-all duration-200 cursor-pointer ${
            activeTab === "settings" 
              ? "text-[#FF6A3D]" 
              : "text-gray-500 hover:text-gray-950 hover:bg-gray-200/50"
          }`}
        >
          {/* Active Indicator Slide Background */}
          {activeTab === "settings" && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute inset-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-gray-100 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}

          <div className="flex items-center gap-3">
            <Settings className={`w-4 h-4 transition-transform group-hover:scale-110 group-hover:rotate-45 duration-300 ${
              activeTab === "settings" ? "text-[#FF6A3D] stroke-[2.2px]" : "text-gray-400 group-hover:text-gray-600 stroke-[1.8px]"
            }`} />
            <span>Settings</span>
          </div>
        </button>

        {/* Mini environment details - elegant & human */}
        <div className="px-4 text-[10px] font-mono text-gray-400 leading-tight">
          <span>Standard Workspace v1.4</span>
        </div>

        {/* User profile & Logout */}
        {user && (
          <div className="mt-1 pt-3 border-t border-gray-200/60 flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-200/30">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-[#FF6A3D]/10 text-[#FF6A3D] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 stroke-[2.2px]" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-sans font-bold text-gray-950 truncate leading-tight">{user.name}</span>
                  <span className="text-[10px] font-mono text-gray-400 truncate leading-none mt-1">{user.email}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50/80 transition-all cursor-pointer group shrink-0"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform stroke-[2px]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
