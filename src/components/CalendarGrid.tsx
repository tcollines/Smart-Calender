import { useState, ChangeEvent } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bell, Grid, User, Menu, ListTodo, LogOut, Mail } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ViewType, CalendarEvent, CATEGORIES } from "../types";

interface CalendarGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: CalendarEvent[];
  viewMode: ViewType;
  onViewModeChange: (mode: ViewType) => void;
  onToggleSidebar?: () => void;
  onToggleTimeline?: () => void;
  isTimelineOpen?: boolean;
  user?: { email: string; name: string } | null;
  onLogout?: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020 to 2030

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarGrid({
  currentDate,
  onDateChange,
  selectedDate,
  onSelectDate,
  events,
  viewMode,
  onViewModeChange,
  onToggleSidebar,
  onToggleTimeline,
  isTimelineOpen,
  user,
  onLogout,
}: CalendarGridProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper to get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month (0-6)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate grid days (42 days to fill a 6-row, 7-column calendar grid)
  const generateGridDays = () => {
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Previous month days to pad the start
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true
      });
    }

    // Next month days to pad the end (until we hit a multiple of 7, or 42 total cells)
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(nextYear, nextMonth, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const handleMonthChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    onDateChange(new Date(currentYear, newMonth, 1));
  };

  const handleYearChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    onDateChange(new Date(newYear, currentMonth, 1));
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      onDateChange(new Date(currentYear - 1, 11, 1));
    } else {
      onDateChange(new Date(currentYear, currentMonth - 1, 1));
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      onDateChange(new Date(currentYear + 1, 0, 1));
    } else {
      onDateChange(new Date(currentYear, currentMonth + 1, 1));
    }
  };

  const gridDays = generateGridDays();

  // Filter events for a given date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter(event => event.date === dateStr);
  };

  // Format date helper
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  return (
    <div id="calendar-area" className="flex-1 flex flex-col min-w-0 bg-[#E5E7EB]/45 p-3 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar">
      {/* TOP HEADER BLOCK */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 select-none shrink-0">
        
        {/* LEFT BLOCK: HAMBURGER TOGGLE + YEAR | MONTH | WEEK TABS */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 shadow-sm transition-all xl:hidden cursor-pointer shrink-0"
              title="Open Workspace Menu"
            >
              <Menu className="w-4 h-4 stroke-[2px]" />
            </button>
          )}

          <div className="flex bg-gray-200/60 p-1 rounded-2xl border border-gray-300/20 flex-1 md:flex-initial">
            {(["year", "month", "week"] as ViewType[]).map((mode) => {
              const isActive = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`relative flex-1 md:flex-none px-3.5 sm:px-5 py-2 text-[11px] sm:text-xs font-sans font-semibold tracking-wide capitalize rounded-xl transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="header-active-pill"
                      className="absolute inset-0 bg-[#FF6A3D] rounded-xl shadow-sm -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MIDDLE BLOCK: VIEW SELECTORS (Dropdown selectors with Chevrons) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <span className="text-xs font-sans font-medium text-gray-500 mr-1 hidden sm:inline">View:</span>

            {/* Month Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={currentMonth}
                onChange={handleMonthChange}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 pr-7 rounded-xl font-sans text-xs font-semibold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#FF6A3D] cursor-pointer"
              >
                {MONTHS.map((month, idx) => (
                  <option key={month} value={idx}>{month}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>

            {/* Year Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="w-full sm:w-auto appearance-none bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 pr-7 rounded-xl font-sans text-xs font-semibold text-gray-700 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#FF6A3D] cursor-pointer"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm shrink-0">
            <button 
              onClick={prevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT BLOCK: HEADER CONTROLS */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 w-full md:w-auto">
          {/* Mobile Daily Agenda Toggle */}
          {onToggleTimeline && (
            <button
              onClick={onToggleTimeline}
              className={`p-2.5 border rounded-xl shadow-sm transition-all xl:hidden cursor-pointer relative shrink-0 ${
                isTimelineOpen 
                  ? "bg-[#FF6A3D] text-white border-[#FF6A3D]" 
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
              title="Toggle Agenda Panel"
            >
              <ListTodo className="w-4 h-4 stroke-[2px]" />
              {events.filter(e => e.date === selectedDate.toISOString().split("T")[0]).length > 0 && (
                <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isTimelineOpen ? "bg-white animate-pulse" : "bg-[#FF6A3D]"}`} />
              )}
            </button>
          )}

          {/* Notification Icon */}
          <button 
            onClick={() => alert("You have 1 pending system task due in 2 hours.")}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 shadow-sm transition-all relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
          </button>

          {/* App Grid Icon */}
          <button 
            onClick={() => alert("Taskboard Grid services are online.")}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 shadow-sm transition-all cursor-pointer"
            title="App Grid"
          >
            <Grid className="w-4 h-4 stroke-[2px]" />
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center shrink-0 relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-9 h-9 rounded-full bg-[#FF6A3D] hover:bg-[#E2582B] text-white flex items-center justify-center shadow-md shadow-[#FF6A3D]/15 transition-all bounce-click cursor-pointer"
              title="User Profile"
            >
              <User className="w-4.5 h-4.5" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  {/* Invisible overlay backdrop to close dropdown on click outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileOpen(false)} 
                  />
                  
                  {/* Popover menu card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-50 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-5 flex flex-col gap-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FF6A3D]/10 text-[#FF6A3D] flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 stroke-[2px]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-sans font-bold text-gray-950 truncate leading-tight">
                          {user?.name || "Active Session"}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 truncate leading-none mt-1.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-300" />
                          {user?.email || "demo@example.com"}
                        </span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-gray-100" />

                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-gray-400">
                      <span>SESSION STATUS</span>
                      <span className="text-emerald-500 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ● CONNECTED
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-sans font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-100"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Log Out Workspace</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* RENDER ACTIVE VIEW MODE */}
      <AnimatePresence mode="wait">
        {viewMode === "month" && (
          <motion.div
            key="month-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* WEEKDAY LABELS (SUN -> SAT, orange text) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 select-none text-center">
              {WEEKDAYS.map((day) => (
                <div 
                  key={day} 
                  className="font-sans font-bold text-[10px] sm:text-xs tracking-wider text-[#FF6A3D]/90 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* MONTH DAYS GRID (7-column cards with rounded corners & shadows) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 md:gap-3 flex-1">
              {gridDays.map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDate(date);
                const isSelected = isSameDay(date, selectedDate);
                const isCurrent = isToday(date);

                return (
                  <motion.button
                    key={`${date.toISOString()}-${index}`}
                    onClick={() => onSelectDate(date)}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    className={`min-h-[50px] sm:min-h-[75px] md:min-h-[90px] p-1.5 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl text-left flex flex-col justify-between transition-all relative ${
                      isCurrentMonth ? "bg-white" : "bg-white/30"
                    } ${
                      isSelected 
                        ? "ring-2 ring-[#FF6A3D] shadow-md shadow-[#FF6A3D]/5 z-10" 
                        : "border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.025)]"
                    } cursor-pointer group`}
                  >
                    {/* Date Number Label */}
                    <div className="flex items-center justify-between">
                      <span 
                        className={`text-xs sm:text-sm font-sans font-bold ${
                          isCurrentMonth 
                            ? isCurrent 
                              ? "text-white bg-[#FF6A3D] w-5 h-5 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center text-[10px] sm:text-xs"
                              : "text-gray-800" 
                            : "text-gray-300"
                        }`}
                      >
                        {date.getDate().toString().padStart(2, "0")}
                      </span>

                      {isCurrent && !isSelected && (
                        <span className="w-1.5 h-1.5 bg-[#FF6A3D] rounded-full" />
                      )}
                    </div>

                    {/* Event indicators at the bottom */}
                    <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-1 sm:mt-2">
                      {dayEvents.slice(0, 3).map((event) => {
                        const category = CATEGORIES.find(c => c.value === event.color) || CATEGORIES[0];
                        return (
                          <span
                            key={event.id}
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full inline-block"
                            style={{ backgroundColor: category.colorClass }}
                            title={event.title}
                          />
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-gray-400">
                          +{dayEvents.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Micro hover shadow */}
                    <div className="absolute inset-0 rounded-2xl bg-[#FF6A3D]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewMode === "week" && (
          <motion.div
            key="week-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <div className="text-xs sm:text-sm font-sans font-semibold text-gray-500 mb-4">
              Week of {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>

            {/* Week view horizontal expansion on desktop, vertical list stack on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 sm:gap-4 flex-1">
              {Array.from({ length: 7 }).map((_, idx) => {
                // Compute current week dates
                const currentDayOfWeek = selectedDate.getDay();
                const startOfWeek = new Date(selectedDate);
                startOfWeek.setDate(selectedDate.getDate() - currentDayOfWeek + idx);

                const dayEvents = getEventsForDate(startOfWeek);
                const isSelected = isSameDay(startOfWeek, selectedDate);
                const isCurrent = isToday(startOfWeek);

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectDate(startOfWeek)}
                    className={`p-3.5 sm:p-4 rounded-2xl text-left flex flex-col bg-white border shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all flex-1 min-h-[90px] md:min-h-[300px] cursor-pointer ${
                      isSelected ? "ring-2 ring-[#FF6A3D] shadow-md z-10" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 md:mb-3 border-b border-gray-100 pb-1.5 md:pb-2">
                      <span className="text-[11px] sm:text-xs font-sans font-bold text-gray-400">
                        {WEEKDAYS[idx]}
                      </span>
                      <span className={`text-xs sm:text-sm font-mono font-bold ${
                        isCurrent ? "bg-[#FF6A3D] text-white px-1.5 py-0.5 rounded-md" : "text-gray-800"
                      }`}>
                        {startOfWeek.getDate().toString().padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 w-full">
                      {dayEvents.map(event => {
                        const cat = CATEGORIES.find(c => c.value === event.color) || CATEGORIES[0];
                        return (
                          <div 
                            key={event.id}
                            className={`text-left p-2 rounded-xl text-[11px] font-medium border ${cat.bgClass} ${cat.textClass} ${cat.borderClass} flex flex-col gap-0.5`}
                          >
                            <span className="font-bold line-clamp-1">{event.title}</span>
                            <span className="font-mono text-[9px] opacity-85">
                              {event.start_time} - {event.end_time}
                            </span>
                          </div>
                        );
                      })}
                      {dayEvents.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-[10px] font-sans text-gray-400 text-center py-2 md:py-10">
                          No Tasks
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {viewMode === "year" && (
          <motion.div
            key="year-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[550px] pr-2 custom-scrollbar"
          >
            {MONTHS.map((month, monthIdx) => {
              // Build miniature representation of the month
              const daysCount = getDaysInMonth(currentYear, monthIdx);
              const firstDay = getFirstDayOfMonth(currentYear, monthIdx);
              
              return (
                <button
                  key={month}
                  onClick={() => {
                    onDateChange(new Date(currentYear, monthIdx, 1));
                    onViewModeChange("month");
                  }}
                  className={`p-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm text-left hover:border-[#FF6A3D]/40 transition-all cursor-pointer group`}
                >
                  <div className="font-sans font-bold text-xs text-gray-800 mb-2 group-hover:text-[#FF6A3D] transition-colors border-b border-gray-50 pb-1">
                    {month}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-mono text-gray-400 mb-1">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>

                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {/* Padding cells */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`pad-${i}`} className="h-2.5" />
                    ))}
                    {/* Month cells */}
                    {Array.from({ length: daysCount }).map((_, i) => {
                      const dateNum = i + 1;
                      const checkDate = new Date(currentYear, monthIdx, dateNum);
                      const hasEvents = events.some(e => e.date === checkDate.toISOString().split("T")[0]);
                      const isTodayCell = isToday(checkDate);

                      return (
                        <div
                          key={`day-${dateNum}`}
                          className={`h-2.5 text-[8px] flex items-center justify-center font-bold rounded-sm ${
                            isTodayCell ? "bg-[#FF6A3D] text-white font-black" : hasEvents ? "text-gray-900 bg-gray-100 font-extrabold" : "text-gray-400 font-medium"
                          }`}
                        >
                          {dateNum}
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
