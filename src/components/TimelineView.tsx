import { motion } from "motion/react";
import { CheckCircle2, Circle, Edit3, Trash, Clock, Plus, HelpCircle, Inbox } from "lucide-react";
import { CalendarEvent, CATEGORIES } from "../types";

interface TimelineViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onToggleStatus: (eventId: string, currentStatus: "pending" | "done") => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onQuickAddEvent: (hour: number) => void;
  onCloseTimeline?: () => void;
}

export default function TimelineView({
  selectedDate,
  events,
  onToggleStatus,
  onEditEvent,
  onDeleteEvent,
  onQuickAddEvent,
  onCloseTimeline,
}: TimelineViewProps) {
  // Format the selected date for headers
  const dateStr = selectedDate.toISOString().split("T")[0];
  const formattedDay = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Filter events for this specific date
  const dayEvents = events.filter((e) => e.date === dateStr);

  // Sort events chronologically by start time
  const sortedEvents = [...dayEvents].sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Calculate task completion stats
  const totalTasks = dayEvents.length;
  const completedTasks = dayEvents.filter((e) => e.status === "done").length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Generate hourly breakdown from 6 AM to 10 PM (6 to 22)
  const hours = Array.from({ length: 17 }, (_, i) => 6 + i);

  // Format hour number to AM/PM string
  const formatHourString = (hour: number) => {
    if (hour === 12) return "12:00 PM";
    if (hour === 0 || hour === 24) return "12:00 AM";
    return hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
  };

  // Check if an event starts in a given hour
  const getEventsForHour = (hour: number) => {
    return sortedEvents.filter((event) => {
      const eventHour = parseInt(event.start_time.split(":")[0]);
      return eventHour === hour;
    });
  };

  return (
    <div 
      id="timeline-panel"
      className="w-full xl:w-[420px] bg-white border-l border-gray-200/80 flex flex-col shrink-0 select-none h-full shadow-2xl xl:shadow-none"
    >
      {/* PANEL HEADER WITH COMPLETED PROGRESS STATS */}
      <div className="p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
              Selected Agenda
            </span>
            <h2 className="text-xl font-display font-bold text-gray-900 mt-0.5">
              {formattedDay}
            </h2>
          </div>

          {onCloseTimeline && (
            <button
              onClick={onCloseTimeline}
              className="text-xs font-sans font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Close
            </button>
          )}
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-[#F3F4F6] rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center justify-between text-xs font-sans mb-2">
            <span className="text-gray-500 font-medium">Daily Completion</span>
            <span className="text-[#FF6A3D] font-bold font-mono">
              {completedTasks}/{totalTasks} Tasks ({completionPercent}%)
            </span>
          </div>
          
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FF6A3D] rounded-full shadow-[0_0_10px_rgba(255,106,61,0.25)]"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* TIMELINE HOUR LIST (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);

          return (
            <div key={hour} className="relative flex items-start gap-4 group/row min-h-[50px]">
              {/* STICKY TIME LABEL ON LEFT */}
              <div className="w-20 font-mono text-[11px] font-bold text-gray-400 text-right sticky left-0 pt-1 group-hover/row:text-[#FF6A3D] transition-colors leading-none select-none">
                {formatHourString(hour)}
              </div>

              {/* TIMELINE VERTICAL CONNECTING AXIS DOT */}
              <div className="relative flex flex-col items-center self-stretch select-none">
                <div className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                  hourEvents.length > 0 
                    ? "bg-[#FF6A3D] border-[#FF6A3D]/30 scale-110" 
                    : "bg-gray-200 border-white group-hover/row:bg-[#FF6A3D]/40"
                }`} />
                <div className="w-[1.5px] bg-gray-100 flex-1 group-hover/row:bg-gray-200" />
              </div>

              {/* TASK CARDS ON RIGHT */}
              <div className="flex-1 flex flex-col gap-2">
                {hourEvents.length > 0 ? (
                  hourEvents.map((event) => {
                    const category = CATEGORIES.find((c) => c.value === event.color) || CATEGORIES[0];
                    const isDone = event.status === "done";

                    return (
                      <motion.div
                        key={event.id}
                        layoutId={`event-${event.id}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-2xl border transition-all flex flex-col relative ${
                          isDone 
                            ? "bg-gray-50/80 border-gray-100 opacity-65" 
                            : `${category.bgClass} ${category.borderClass} shadow-[0_4px_12px_rgba(0,0,0,0.015)]`
                        }`}
                      >
                        {/* Task Card Header: Checkbox + Title */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Toggle checkbox */}
                            <button
                              onClick={() => onToggleStatus(event.id, event.status)}
                              className={`p-0.5 rounded-lg text-gray-400 hover:text-[#FF6A3D] mt-0.5 shrink-0 transition-transform bounce-click cursor-pointer`}
                              title={isDone ? "Mark Pending" : "Mark Complete"}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-[#FF6A3D] fill-[#FF6A3D]/10" />
                              ) : (
                                <Circle className="w-4.5 h-4.5" />
                              )}
                            </button>
                            
                            {/* Title & Time */}
                            <div className="flex flex-col min-w-0">
                              <span className={`text-[13px] font-sans font-bold leading-tight ${
                                isDone ? "text-gray-400 line-through" : "text-gray-800"
                              }`}>
                                {event.title}
                              </span>
                              <div className="flex items-center gap-1 font-mono text-[9px] font-bold text-gray-400 mt-1">
                                <Clock className="w-3 h-3 stroke-[2.2px]" />
                                <span>{event.start_time} - {event.end_time}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Admin Buttons */}
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => onEditEvent(event)}
                              className="p-1 hover:bg-black/5 rounded-lg text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
                              title="Edit Event"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEvent(event.id)}
                              className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Task Description */}
                        {event.description && (
                          <p className={`text-[11px] font-sans mt-2 leading-relaxed line-clamp-2 ${
                            isDone ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {event.description}
                          </p>
                        )}

                        {/* Category Label Tag */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/[0.03]">
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${category.bgClass} ${category.textClass}`}>
                            {category.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  // EMPTY HOUR PLACEHOLDER (With inline click-to-add button)
                  <button
                    onClick={() => onQuickAddEvent(hour)}
                    className="h-10 border border-dashed border-gray-100 hover:border-[#FF6A3D]/40 rounded-xl flex items-center justify-center text-[11px] text-gray-400 hover:text-[#FF6A3D] font-sans font-medium hover:bg-[#FF6A3D]/5 transition-all text-left px-4 group/btn select-none cursor-pointer"
                  >
                    <Plus className="w-3 h-3 group-hover/btn:scale-110 transition-transform mr-1.5" />
                    <span>Add task at {formatHourString(hour).split(":")[0]} {formatHourString(hour).slice(-2)}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK FLOATING AD-HOC ADVICE */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 text-[11px] font-sans text-gray-400 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 stroke-[1.8px] text-gray-400 shrink-0" />
        <span>Click empty hourly slots to quickly schedule and organize task slots.</span>
      </div>
    </div>
  );
}
