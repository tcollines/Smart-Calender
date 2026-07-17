import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  FileText, 
  CheckSquare, 
  FolderPlus, 
  X, 
  AlertCircle,
  Search,
  ChevronRight,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  Settings,
  Database,
  Key,
  Terminal,
  CheckCircle2
} from "lucide-react";

import Sidebar from "./components/Sidebar";
import CalendarGrid from "./components/CalendarGrid";
import TimelineView from "./components/TimelineView";
import LoginPage from "./components/LoginPage";
import { CalendarEvent, SidebarMenuType, ViewType, CATEGORIES } from "./types";
import { 
  isClientSupabaseConfigured, 
  getClientEvents, 
  createClientEvent, 
  updateClientEvent, 
  deleteClientEvent 
} from "./lib/supabase-client";

export default function App() {
  // State
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem("calendar_app_current_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [trashEvents, setTrashEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date("2026-07-15"));
  const [currentDate, setCurrentDate] = useState<Date>(new Date("2026-07-15"));
  const [activeTab, setActiveTab] = useState<SidebarMenuType>("calendar");
  const [viewMode, onViewModeChange] = useState<ViewType>("month");
  
  // Mobile responsive menu states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  
  // Loading and feedback
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [modalForm, setModalForm] = useState({
    title: "",
    description: "",
    date: "2026-07-15",
    start_time: "09:00",
    end_time: "10:30",
    status: "pending" as "pending" | "done",
    color: "orange",
  });

  // Search & Filters for "Events" Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
  const [colorFilter, setColorFilter] = useState<string>("all");

  // Notes state
  const [notes, setNotes] = useState<{ id: string; title: string; content: string; updated: string }[]>([
    {
      id: "note-1",
      title: "Workspace Guidelines",
      content: "Ensure all new calendar elements match the warm orange accent color (#FF6A3D). Follow up with lead designer about spacing rules.",
      updated: "2026-07-15 10:15 AM"
    },
    {
      id: "note-2",
      title: "Team Lunch Options",
      content: "Taco place down the street is highly recommended. Otherwise, the sushi spot has a fast lunch special.",
      updated: "2026-07-14 12:30 PM"
    }
  ]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Reminders checklist state
  const [reminders, setReminders] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: "rem-1", text: "Submit Q3 budget projections", completed: false },
    { id: "rem-2", text: "Update Jira boards and backlog points", completed: true },
    { id: "rem-3", text: "Order team swag for new recruits", completed: false },
    { id: "rem-4", text: "Water the desk plants", completed: false }
  ]);
  const [newReminderText, setNewReminderText] = useState("");

  // Documents/Folder Organizer mock data
  const [documents, setDocuments] = useState<{ id: string; name: string; size: string; category: string; downloads: number }[]>([
    { id: "doc-1", name: "Product_Roadmap_2026.pdf", size: "4.2 MB", category: "Strategy", downloads: 28 },
    { id: "doc-2", name: "Style_Guide_Tokens.json", size: "12 KB", category: "Design", downloads: 145 },
    { id: "doc-3", name: "Developer_Onboarding_V2.md", size: "38 KB", category: "Guides", downloads: 92 },
    { id: "doc-4", name: "Sprint_Velocity_Reports.xlsx", size: "1.1 MB", category: "Finance", downloads: 12 }
  ]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState("Strategy");

  // Supabase Connection Status
  const [supabaseStatus, setSupabaseStatus] = useState<{
    supabaseConfigured: boolean;
    url: string | null;
    hasAnonKey: boolean;
  } | null>(null);

  // Fetch Supabase configuration status
  const fetchSupabaseStatus = async () => {
    if (isClientSupabaseConfigured()) {
      setSupabaseStatus({
        supabaseConfigured: true,
        url: (import.meta as any).env.VITE_SUPABASE_URL || "Connected (Client Mode)",
        hasAnonKey: true
      });
      return;
    }

    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const data = await response.json();
        setSupabaseStatus(data);
      } else {
        setSupabaseStatus({
          supabaseConfigured: false,
          url: null,
          hasAnonKey: false
        });
      }
    } catch (err) {
      console.error("Failed to fetch Supabase status:", err);
      setSupabaseStatus({
        supabaseConfigured: false,
        url: null,
        hasAnonKey: false
      });
    }
  };

  useEffect(() => {
    fetchSupabaseStatus();
  }, [activeTab]);

  // Show dynamic notification toasts
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all events on load (scoped by active user)
  const fetchEvents = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      if (isClientSupabaseConfigured()) {
        const data = await getClientEvents(currentUser.email);
        setEvents(data);
      } else {
        const response = await fetch("/api/events", {
          headers: {
            "X-User-Email": currentUser.email
          }
        });
        if (!response.ok) throw new Error("Could not fetch calendar events from server");
        const data = await response.json();
        setEvents(data);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError("Unable to connect to calendar service. Using offline state.");
      triggerToast("Offline mode activated", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

  // Update form date when selectedDate shifts
  useEffect(() => {
    const formatted = selectedDate.toISOString().split("T")[0];
    setModalForm(prev => ({ ...prev, date: formatted }));
  }, [selectedDate]);

  // Create Event / Task
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      triggerToast("Task title is required", "error");
      return;
    }

    const payload = {
      ...modalForm,
      id: editingEvent ? editingEvent.id : undefined
    };

    try {
      let savedEvent: CalendarEvent;

      if (isClientSupabaseConfigured()) {
        const userEmail = currentUser?.email || "";
        if (editingEvent) {
          savedEvent = await updateClientEvent(editingEvent.id, payload, userEmail);
        } else {
          // Generate a safe unique ID if needed
          const eventToCreate = {
            ...payload,
            id: payload.id || Math.random().toString(36).substring(2, 9)
          } as CalendarEvent;
          savedEvent = await createClientEvent(eventToCreate, userEmail);
        }
      } else {
        const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
        const method = editingEvent ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { 
            "Content-Type": "application/json",
            "X-User-Email": currentUser?.email || ""
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Failed to save event to database");
        savedEvent = await response.json();
      }

      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === savedEvent.id ? savedEvent : e));
        triggerToast("Task updated successfully!");
      } else {
        setEvents(prev => [...prev, savedEvent]);
        triggerToast("New task scheduled!");
      }

      setIsModalOpen(false);
      setEditingEvent(null);
      // Reset title/desc
      setModalForm(prev => ({ ...prev, title: "", description: "" }));
    } catch (err) {
      // Local fallback in case of server disconnects
      const localEvent: CalendarEvent = {
        id: editingEvent?.id || Math.random().toString(36).substring(2, 9),
        title: modalForm.title,
        description: modalForm.description,
        date: modalForm.date,
        start_time: modalForm.start_time,
        end_time: modalForm.end_time,
        status: modalForm.status,
        color: modalForm.color,
        created_at: editingEvent?.created_at || new Date().toISOString()
      };

      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? localEvent : e));
        triggerToast("Saved task locally");
      } else {
        setEvents(prev => [...prev, localEvent]);
        triggerToast("Scheduled task locally");
      }
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  // Toggle status (done vs pending)
  const handleToggleStatus = async (eventId: string, currentStatus: "pending" | "done") => {
    const nextStatus = currentStatus === "done" ? "pending" : "done";
    
    // Optimistic state update
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: nextStatus } : e));

    try {
      if (isClientSupabaseConfigured()) {
        await updateClientEvent(eventId, { status: nextStatus }, currentUser?.email || "");
      } else {
        const response = await fetch(`/api/events/${eventId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "X-User-Email": currentUser?.email || ""
          },
          body: JSON.stringify({ status: nextStatus })
        });
        if (!response.ok) throw new Error();
      }
      triggerToast(nextStatus === "done" ? "Task completed! 🎉" : "Task marked pending");
    } catch (err) {
      triggerToast("Status updated locally");
    }
  };

  // Open edit event modal
  const handleEditClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setModalForm({
      title: event.title,
      description: event.description,
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      status: event.status,
      color: event.color,
    });
    setIsModalOpen(true);
  };

  // Delete event (move to trash)
  const handleDeleteEvent = async (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    // Optimistic UI updates
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setTrashEvents(prev => [...prev, eventToDelete]);

    try {
      if (isClientSupabaseConfigured()) {
        await deleteClientEvent(eventId, currentUser?.email || "");
      } else {
        await fetch(`/api/events/${eventId}`, { 
          method: "DELETE",
          headers: {
            "X-User-Email": currentUser?.email || ""
          }
        });
      }
      triggerToast("Task moved to Trash", "info");
    } catch (err) {
      triggerToast("Moved to local Trash", "info");
    }
  };

  // Permanent empty trash
  const handleEmptyTrash = () => {
    if (trashEvents.length === 0) return;
    setTrashEvents([]);
    triggerToast("Trash emptied permanently");
  };

  // Restore event from trash
  const handleRestoreEvent = async (event: CalendarEvent) => {
    setTrashEvents(prev => prev.filter(e => e.id !== event.id));
    setEvents(prev => [...prev, event]);

    try {
      if (isClientSupabaseConfigured()) {
        await createClientEvent(event, currentUser?.email || "");
      } else {
        await fetch("/api/events", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-User-Email": currentUser?.email || ""
          },
          body: JSON.stringify(event)
        });
      }
      triggerToast("Task restored to calendar!");
    } catch (err) {
      triggerToast("Restored locally");
    }
  };

  // Quick slot click add event helper
  const handleQuickAddEvent = (hour: number) => {
    const hourStr = hour.toString().padStart(2, "0");
    const endHourStr = (hour + 1).toString().padStart(2, "0");
    
    setEditingEvent(null);
    setModalForm({
      title: "",
      description: "",
      date: selectedDate.toISOString().split("T")[0],
      start_time: `${hourStr}:00`,
      end_time: `${endHourStr}:00`,
      status: "pending",
      color: "orange",
    });
    setIsModalOpen(true);
  };

  // New Note Action
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNoteTitle,
      content: newNoteContent,
      updated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    };
    
    setNotes(prev => [newNote, ...prev]);
    setNewNoteTitle("");
    setNewNoteContent("");
    triggerToast("Note added!");
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    triggerToast("Note deleted");
  };

  // New Reminder Action
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;

    const newReminder = {
      id: Math.random().toString(36).substr(2, 9),
      text: newReminderText,
      completed: false
    };

    setReminders(prev => [...prev, newReminder]);
    setNewReminderText("");
    triggerToast("Reminder added!");
  };

  const handleToggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // New Document upload mock action
  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDocName.endsWith(".pdf") || newDocName.endsWith(".md") || newDocName.endsWith(".xlsx") || newDocName.endsWith(".json") 
        ? newDocName 
        : `${newDocName}.pdf`,
      size: `${(Math.random() * 5 + 0.1).toFixed(1)} MB`,
      category: newDocCategory,
      downloads: 0
    };

    setDocuments(prev => [newDoc, ...prev]);
    setNewDocName("");
    triggerToast("Document logged successfully!");
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    triggerToast("Document removed");
  };

  // Filters for All Events view
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesColor = colorFilter === "all" || e.color === colorFilter;
    return matchesSearch && matchesStatus && matchesColor;
  });

  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem("calendar_app_current_user", JSON.stringify(user));
          triggerToast(`Welcome back, ${user.name}!`);
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-800 antialiased font-sans">
      
      {/* SIDEBAR NAVIGATION PANEL - WITH MOBILE DRAWER & BACKDROP OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 xl:hidden"
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed inset-y-0 left-0 z-50 transform xl:transform-none xl:static transition-transform duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        }`}
      >
        <Sidebar
          selectedDate={selectedDate}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          onAddEventClick={() => {
            setEditingEvent(null);
            setModalForm(prev => ({
              ...prev,
              title: "",
              description: "",
              start_time: "09:00",
              end_time: "10:00",
              status: "pending"
            }));
            setIsModalOpen(true);
            setIsSidebarOpen(false);
          }}
          eventCount={events.length}
          trashCount={trashEvents.length}
          user={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            localStorage.removeItem("calendar_app_current_user");
            triggerToast("Successfully logged out.", "info");
          }}
        />
      </div>

      {/* MAIN CONTAINER FRAME */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile menu button for tabs other than Calendar */}
        {activeTab !== "calendar" && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 p-2.5 bg-white border border-gray-200 rounded-xl shadow-md hover:bg-gray-50 text-gray-500 xl:hidden cursor-pointer"
            title="Open Menu"
          >
            <svg className="w-4 h-4 stroke-[2.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <AnimatePresence mode="wait">
          
          {/* TAB 1: MAIN MONTH / WEEK / YEAR CALENDAR GRID */}
          {activeTab === "calendar" && (
            <motion.div
              key="tab-calendar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex overflow-hidden relative"
            >
              <CalendarGrid
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setCurrentDate(date); // Align header month with click
                  setIsTimelineOpen(true); // Automatically slide open Agenda on mobile day click!
                }}
                events={events}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                onToggleTimeline={() => setIsTimelineOpen(prev => !prev)}
                isTimelineOpen={isTimelineOpen}
                user={currentUser}
                onLogout={() => {
                  setCurrentUser(null);
                  localStorage.removeItem("calendar_app_current_user");
                  triggerToast("Successfully logged out.", "info");
                }}
              />
              
              {/* Responsive Slide-Over Drawer for Timeline (Selected Day Agenda) */}
              <div
                className={`fixed xl:static inset-y-0 right-0 z-40 transform xl:transform-none transition-transform duration-300 ease-in-out flex shrink-0 h-full w-full max-w-[420px] xl:w-[420px] ${
                  isTimelineOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"
                }`}
              >
                {/* Backdrop on mobile */}
                {isTimelineOpen && (
                  <div 
                    onClick={() => setIsTimelineOpen(false)} 
                    className="fixed inset-0 bg-black/20 -z-10 xl:hidden cursor-pointer" 
                  />
                )}
                <TimelineView
                  selectedDate={selectedDate}
                  events={events}
                  onToggleStatus={handleToggleStatus}
                  onEditEvent={handleEditClick}
                  onDeleteEvent={handleDeleteEvent}
                  onQuickAddEvent={handleQuickAddEvent}
                  onCloseTimeline={() => setIsTimelineOpen(false)}
                />
              </div>
            </motion.div>
          )}

          {/* TAB 2: EVENTS AGGREGATION & SEARCH */}
          {activeTab === "events" && (
            <motion.div
              key="tab-events"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F3F4F6]/50 overflow-y-auto custom-scrollbar flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400">Database Search</span>
                  <h1 className="text-2xl font-display font-bold text-gray-900 mt-1">Scheduled Events Registry</h1>
                </div>
                
                {/* Reset filters */}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setColorFilter("all");
                  }}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                
                {/* Text query input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search keywords or titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-[#FF6A3D]/60 pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all"
                  />
                </div>

                {/* Status select filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="w-full bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-[#FF6A3D]/60 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="all">All Statuses (Pending & Done)</option>
                    <option value="pending">⏳ Pending Only</option>
                    <option value="done">✅ Done Only</option>
                  </select>
                </div>

                {/* Color/Category tag filter */}
                <div>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    className="w-full bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:border-[#FF6A3D]/60 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* RESULTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map(event => {
                  const cat = CATEGORIES.find(c => c.value === event.color) || CATEGORIES[0];
                  const isDone = event.status === "done";
                  
                  return (
                    <div
                      key={event.id}
                      className={`p-5 rounded-2xl bg-white border shadow-[0_4px_12px_rgba(0,0,0,0.015)] transition-all flex flex-col justify-between ${
                        isDone ? "border-gray-100 opacity-70" : "border-gray-200/60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${cat.bgClass} ${cat.textClass}`}>
                            {cat.label}
                          </span>
                          
                          <span className="text-[10px] font-mono font-bold text-gray-400">
                            {event.date}
                          </span>
                        </div>

                        <h3 className={`font-sans font-bold text-sm leading-snug ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}>
                          {event.title}
                        </h3>

                        <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">
                          {event.description || "No supplemental details provided."}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(event.id, event.status)}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-[#FF6A3D] transition-colors cursor-pointer"
                            title="Toggle status"
                          >
                            <Check className={`w-4 h-4 ${isDone ? "text-[#FF6A3D]" : "text-gray-300"}`} />
                          </button>
                          
                          <button
                            onClick={() => handleEditClick(event)}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center select-none">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-sans font-semibold text-gray-400">No events found matching current criteria</p>
                    <p className="text-xs text-gray-400 mt-1">Try broadening your keywords or reset all active filter dropdowns.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: NOTES scratchpad */}
          {activeTab === "notes" && (
            <motion.div
              key="tab-notes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F3F4F6]/50 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-8"
            >
              {/* Creator Column */}
              <div className="w-full md:w-80 shrink-0">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-0">
                  <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Create Scratchpad Note</h2>
                  <form onSubmit={handleAddNote} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Note Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Design review checklist"
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6A3D]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Content Body
                      </label>
                      <textarea
                        placeholder="Write details, outlines, or quick copyable snippets here..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6A3D] h-32"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#FF6A3D] hover:bg-[#E2582B] text-white rounded-xl font-sans font-medium text-xs tracking-wide transition-colors cursor-pointer"
                    >
                      Save Private Note
                    </button>
                  </form>
                </div>
              </div>

              {/* Notes Grid List */}
              <div className="flex-1 space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400">My Notebook</span>
                  <h1 className="text-xl font-display font-bold text-gray-800 mt-0.5">Quick Sticky Notes</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm relative group">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-sans font-bold text-sm text-gray-800">{note.title}</h3>
                        
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {note.content || "Empty content. Click body to modify."}
                      </p>

                      <div className="text-[9px] font-mono font-bold text-gray-400 mt-4 pt-2 border-t border-gray-50 flex items-center justify-between">
                        <span>Updated:</span>
                        <span>{note.updated}</span>
                      </div>
                    </div>
                  ))}

                  {notes.length === 0 && (
                    <div className="col-span-full text-center py-16 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                      <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-gray-400 font-sans">Scratchpad is empty</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: REMINDERS checklist */}
          {activeTab === "reminders" && (
            <motion.div
              key="tab-reminders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F3F4F6]/50 overflow-y-auto custom-scrollbar max-w-3xl mx-auto flex flex-col gap-6"
            >
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-gray-400">Action Items</span>
                <h1 className="text-2xl font-display font-bold text-gray-900 mt-0.5">Reminders & Tasks</h1>
              </div>

              {/* Add Input */}
              <form onSubmit={handleAddReminder} className="flex gap-2 bg-white p-3 rounded-2xl border border-gray-200/60 shadow-sm">
                <input
                  type="text"
                  placeholder="Type a fast action item e.g. Sync marketing files..."
                  value={newReminderText}
                  onChange={(e) => setNewReminderText(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6A3D]"
                  required
                />
                <button
                  type="submit"
                  className="px-5 bg-[#FF6A3D] hover:bg-[#E2582B] text-white font-sans font-medium text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5px]" />
                  <span>Add List Item</span>
                </button>
              </form>

              {/* Checklist Group */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {reminders.map(rem => (
                  <div key={rem.id} className="flex items-center justify-between p-4 group hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => handleToggleReminder(rem.id)}
                      className="flex items-center gap-4 flex-1 text-left cursor-pointer"
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        rem.completed 
                          ? "bg-[#FF6A3D] border-[#FF6A3D] text-white" 
                          : "border-gray-300 hover:border-[#FF6A3D]"
                      }`}>
                        {rem.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </div>

                      <span className={`text-xs font-sans font-medium transition-all ${
                        rem.completed ? "text-gray-400 line-through" : "text-gray-700"
                      }`}>
                        {rem.text}
                      </span>
                    </button>

                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {reminders.length === 0 && (
                  <div className="p-12 text-center text-gray-400 select-none">
                    <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold font-sans">Perfect. All action reminders are complete!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 5: DOCUMENTS manager */}
          {activeTab === "documents" && (
            <motion.div
              key="tab-documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F3F4F6]/50 overflow-y-auto custom-scrollbar flex flex-col gap-6"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200/60 pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400">Resource Library</span>
                  <h1 className="text-2xl font-display font-bold text-gray-900 mt-0.5">Documents & Specs</h1>
                </div>

                <form onSubmit={handleAddDoc} className="flex gap-2 bg-white p-2 rounded-xl border border-gray-200/60 shadow-sm shrink-0">
                  <input
                    type="text"
                    placeholder="Document title or link..."
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="border-none bg-gray-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none w-48"
                    required
                  />
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="bg-gray-50 border-none rounded-lg text-xs font-semibold text-gray-600 px-2 focus:outline-none cursor-pointer"
                  >
                    <option value="Strategy">Strategy</option>
                    <option value="Design">Design</option>
                    <option value="Guides">Guides</option>
                    <option value="Finance">Finance</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#FF6A3D] hover:bg-[#E2582B] text-white font-sans font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Log File
                  </button>
                </form>
              </div>

              {/* Grid of Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between group h-40">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[9px] font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {doc.category}
                        </span>
                        
                        <span className="text-[10px] font-mono font-bold text-gray-400">
                          {doc.size}
                        </span>
                      </div>

                      <h3 className="font-sans font-bold text-xs text-gray-800 line-clamp-2 leading-snug group-hover:text-[#FF6A3D] transition-colors">
                        {doc.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <span className="text-[10px] font-mono text-gray-400">
                        {doc.downloads} views / logs
                      </span>

                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 6: TRASH STORAGE & RECOVERY */}
          {activeTab === "trash" && (
            <motion.div
              key="tab-trash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F3F4F6]/50 overflow-y-auto custom-scrollbar flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400 font-bold">Trash & Recovery Bin</span>
                  <h1 className="text-2xl font-display font-bold text-gray-900 mt-0.5">Recycle Bin</h1>
                </div>

                {trashEvents.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty All Trash</span>
                  </button>
                )}
              </div>

              {/* Trash items list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashEvents.map(event => (
                  <div key={event.id} className="p-5 bg-white rounded-2xl border border-gray-200/70 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono font-bold uppercase bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                          {event.color}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {event.date}
                        </span>
                      </div>
                      <h3 className="font-sans font-bold text-sm text-gray-500 line-through">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                      <span className="text-[10px] font-mono text-gray-400">
                        {event.start_time} - {event.end_time}
                      </span>

                      <button
                        onClick={() => handleRestoreEvent(event)}
                        className="text-[11px] font-sans font-semibold text-[#FF6A3D] hover:text-[#E2582B] flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3 animate-spin-slow" />
                        <span>Restore Task</span>
                      </button>
                    </div>
                  </div>
                ))}

                {trashEvents.length === 0 && (
                  <div className="col-span-full text-center py-24 select-none bg-white rounded-2xl border border-dashed border-gray-200">
                    <Trash2 className="w-10 h-10 text-gray-300 mx-auto mb-3 stroke-[1.5px]" />
                    <p className="text-sm font-sans font-semibold text-gray-400">Your recycling bin is completely empty</p>
                    <p className="text-xs text-gray-400 mt-1">Deleted schedule tasks will remain here until explicitly wiped.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 7: SETTINGS & SUPABASE INTEGRATION */}
          {activeTab === "settings" && (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F3F4F6]/50 overflow-y-auto custom-scrollbar flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-4">
                <div>
                  <span className="text-[11px] font-mono font-bold uppercase text-gray-400">Database Synchronisation</span>
                  <h1 className="text-2xl font-display font-bold text-gray-900 mt-0.5">Settings & Integrations</h1>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="grid grid-cols-1 gap-6">
                {supabaseStatus?.supabaseConfigured ? (
                  <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 stroke-[2px]" />
                      </div>
                      <div>
                        <h2 className="text-base font-sans font-bold text-emerald-950">Supabase Cloud Connected</h2>
                        <p className="text-xs text-emerald-700/80 mt-0.5 leading-relaxed">
                          Your agenda events and schedule tasks are currently writing directly to and reading from your live Supabase database!
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-800">
                          <span className="px-2 py-0.5 bg-emerald-100 rounded-md">URL: {supabaseStatus.url}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-200/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 stroke-[2px]" />
                      </div>
                      <div>
                        <h2 className="text-base font-sans font-bold text-amber-950">Local File Storage Mode (Fallback Active)</h2>
                        <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                          The app is running offline-first. Your agenda and tasks are currently saved inside the workspace file database (<code className="font-mono bg-amber-100/50 px-1 py-0.5 rounded font-bold">/data/events.json</code>).
                        </p>
                        <p className="text-[11px] text-amber-600 font-sans font-medium mt-1.5">
                          Configure Supabase credentials in the panel below to activate live database syncing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secret Key Onboarding Block */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-5">
                    <Key className="w-5 h-5 text-[#FF6A3D] stroke-[2px]" />
                    <h3 className="font-sans font-bold text-sm text-gray-800">Where to Add Secrets</h3>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    To securely connect your calendar to Supabase, you must provide your database API credentials as environment secrets. Add them in either of the following places:
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-sans font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 bg-[#FF6A3D] rounded-full"></span>
                        Method A: AI Studio Secrets Manager (Recommended for Preview & Share)
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed pl-3">
                        Locate the <strong>Secrets panel</strong> in the Google AI Studio settings menu or sidebar (represented by the key icon 🔑 or in the global App settings). Enter the following key-value pairs exactly:
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="text-xs font-sans font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 bg-[#FF6A3D] rounded-full"></span>
                        Method B: Local Environment Configuration (.env File)
                      </h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed pl-3">
                        Create a file named <code className="font-mono bg-gray-200/60 px-1 py-0.5 rounded text-gray-700 font-bold">.env</code> in the project's root folder and add the variables below:
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase text-gray-400">Secret Key</th>
                          <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase text-gray-400">Supabase Setting Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        <tr>
                          <td className="px-4 py-3 font-mono font-bold text-gray-700"><code className="bg-orange-50 text-[#FF6A3D] px-1.5 py-0.5 rounded text-[11px]">SUPABASE_URL</code></td>
                          <td className="px-4 py-3 text-gray-500 leading-relaxed">
                            Navigate to <strong>Project Settings</strong> → <strong>API</strong> in Supabase. Copy the URL found under Project URL.
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-mono font-bold text-gray-700"><code className="bg-orange-50 text-[#FF6A3D] px-1.5 py-0.5 rounded text-[11px]">SUPABASE_ANON_KEY</code></td>
                          <td className="px-4 py-3 text-gray-500 leading-relaxed">
                            Navigate to <strong>Project Settings</strong> → <strong>API</strong> in Supabase. Copy the key found under <code className="font-mono text-[10px]">anon (public)</code>.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Setup SQL Generator */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3 mb-4">
                    <Terminal className="w-5 h-5 text-[#FF6A3D] stroke-[2px]" />
                    <h3 className="font-sans font-bold text-sm text-gray-800">Database Schema Execution Script</h3>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-4">
                    Copy and run the following script in your <strong>Supabase SQL Editor</strong> to create the database table. This matches the application's internal data model perfectly:
                  </p>

                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 text-[11px] font-mono p-4 rounded-xl overflow-x-auto select-all leading-relaxed shadow-inner">
{`-- OPTION A: If you are setting up the events table for the first time:
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  color TEXT DEFAULT 'orange',
  user_email TEXT, -- Added for scoping events per user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

-- OPTION B: If you already have the events table, run this to add the user_email column:
ALTER TABLE events ADD COLUMN IF NOT EXISTS user_email TEXT;`}
                    </pre>
                    <div className="absolute right-3 top-3 px-2 py-1 bg-white/10 text-[9px] font-mono font-bold rounded text-white/70 uppercase">
                      SQL Script
                    </div>
                  </div>
                  
                  <div className="mt-3.5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                    <span className="text-[11px] font-mono bg-blue-500/15 text-blue-600 px-1.5 py-0.5 rounded font-bold">PRO-TIP</span>
                    <p className="text-[11px] text-blue-700 leading-normal">
                      Once created, the Express backend will automatically perform queries against this table. You do not need to configure Row Level Security (RLS) policies unless you are exposing your client keys directly to the browser.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* --- ADD / EDIT TASK DIALOG MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none">
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100"
            >
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEvent(null);
                }}
                className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
              </button>

              <div className="mb-4">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FF6A3D]">
                  {editingEvent ? "Task Properties Modification" : "Schedule New Agenda Task"}
                </span>
                <h3 className="text-xl font-display font-bold text-gray-900 mt-0.5">
                  {editingEvent ? "Modify Task Parameters" : "Draft a New Task"}
                </h3>
              </div>

              {/* Form Block */}
              <form onSubmit={handleSaveEvent} className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Event Title / Objective *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Code review or Gym workout..."
                    value={modalForm.title}
                    onChange={(e) => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF6A3D]/60 focus:ring-1 focus:ring-[#FF6A3D] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                {/* Date + Category Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Event Date (YYYY-MM-DD) *
                    </label>
                    <input
                      type="date"
                      required
                      value={modalForm.date}
                      onChange={(e) => setModalForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF6A3D]/60 focus:ring-1 focus:ring-[#FF6A3D] rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none transition-all cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Category Tag
                    </label>
                    <select
                      value={modalForm.color}
                      onChange={(e) => setModalForm(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF6A3D]/60 focus:ring-1 focus:ring-[#FF6A3D] rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 focus:outline-none transition-all cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Start Time + End Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                      Start Time (HH:mm) *
                    </label>
                    <input
                      type="time"
                      required
                      value={modalForm.start_time}
                      onChange={(e) => setModalForm(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF6A3D]/60 focus:ring-1 focus:ring-[#FF6A3D] rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none transition-all cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                      End Time (HH:mm) *
                    </label>
                    <input
                      type="time"
                      required
                      value={modalForm.end_time}
                      onChange={(e) => setModalForm(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF6A3D]/60 focus:ring-1 focus:ring-[#FF6A3D] rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:outline-none transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    placeholder="Supplemental points, checklists, or location links..."
                    value={modalForm.description}
                    onChange={(e) => setModalForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#FF6A3D]/60 focus:ring-1 focus:ring-[#FF6A3D] rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none h-20 resize-none transition-all"
                  />
                </div>

                {/* Status Options */}
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
                    Current Status:
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setModalForm(prev => ({ ...prev, status: "pending" }))}
                      className={`px-3 py-1 text-[11px] font-sans font-semibold rounded-lg transition-colors cursor-pointer ${
                        modalForm.status === "pending" 
                          ? "bg-[#FF6A3D] text-white" 
                          : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalForm(prev => ({ ...prev, status: "done" }))}
                      className={`px-3 py-1 text-[11px] font-sans font-semibold rounded-lg transition-colors cursor-pointer ${
                        modalForm.status === "done" 
                          ? "bg-green-500 text-white" 
                          : "bg-white border border-gray-200 text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Done / Complete
                    </button>
                  </div>
                </div>

                {/* Save Options */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingEvent(null);
                    }}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel Draft
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#FF6A3D] hover:bg-[#E2582B] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF6A3D]/10 cursor-pointer"
                  >
                    {editingEvent ? "Update Task" : "Schedule Task"}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- NOTIFICATION TOAST OVERLAYS --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              toast.type === "error" 
                ? "bg-red-50 text-red-700 border-red-100" 
                : toast.type === "info" 
                  ? "bg-blue-50 text-blue-700 border-blue-100" 
                  : "bg-white text-gray-800 border-gray-100"
            }`}
          >
            {toast.type === "success" && (
              <span className="w-5 h-5 rounded-full bg-[#FF6A3D]/10 text-[#FF6A3D] flex items-center justify-center text-xs font-bold">✓</span>
            )}
            {toast.type === "error" && (
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs font-bold">!</span>
            )}
            {toast.type === "info" && (
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center text-xs font-bold">i</span>
            )}
            <span className="text-xs font-sans font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
