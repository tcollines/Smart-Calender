import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  isSupabaseConfigured,
  getSupabaseEvents,
  createSupabaseEvent,
  updateSupabaseEvent,
  deleteSupabaseEvent,
  signUpUser,
  signInUser
} from "./src/lib/supabase-server.ts";

interface CalendarEvent {
  id: string;
  user_email?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: "pending" | "done";
  color: string; // 'orange' | 'blue' | 'green' | 'purple' | 'rose'
  created_at: string;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to store events
const DATA_DIR = path.join(process.cwd(), "data");
const EVENTS_FILE = path.join(DATA_DIR, "events.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed events with realistic 2026-07-15 centered sample data
const seedEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Design System Review",
    description: "Align on colors, components, and animations for the new calendar workspace dashboard.",
    date: "2026-07-15",
    start_time: "09:00",
    end_time: "10:30",
    status: "done",
    color: "orange",
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    title: "Lunch with Product Team",
    description: "Discuss upcoming roadmap features and enjoy some delicious team tacos.",
    date: "2026-07-15",
    start_time: "12:00",
    end_time: "13:30",
    status: "done",
    color: "green",
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    title: "Sprint Planning & Backlog",
    description: "Scope the new user task board and estimate story points for the next iteration.",
    date: "2026-07-15",
    start_time: "14:30",
    end_time: "16:00",
    status: "pending",
    color: "blue",
    created_at: new Date().toISOString()
  },
  {
    id: "4",
    title: "Weekly Sync with Marketing",
    description: "Review engagement graphics, press releases, and coordinate campaign launches.",
    date: "2026-07-15",
    start_time: "16:30",
    end_time: "17:30",
    status: "pending",
    color: "purple",
    created_at: new Date().toISOString()
  },
  {
    id: "5",
    title: "Gym Session & Cardio",
    description: "Leg day and 30 minutes on the elliptical for high-intensity training.",
    date: "2026-07-15",
    start_time: "18:30",
    end_time: "20:00",
    status: "pending",
    color: "rose",
    created_at: new Date().toISOString()
  },
  {
    id: "6",
    title: "Interactive Showcase Preparation",
    description: "Fine-tune UI transitions, modal responsiveness, and scroll behaviors.",
    date: "2026-07-16",
    start_time: "10:00",
    end_time: "11:30",
    status: "pending",
    color: "orange",
    created_at: new Date().toISOString()
  },
  {
    id: "7",
    title: "1-on-1 with Lead Designer",
    description: "Provide feedback on wireframes and visual tokens for productivity applications.",
    date: "2026-07-16",
    start_time: "13:00",
    end_time: "14:00",
    status: "pending",
    color: "purple",
    created_at: new Date().toISOString()
  },
  {
    id: "8",
    title: "Refactoring & API Hardening",
    description: "Optimize server route parameters, JSON response formats, and error logging.",
    date: "2026-07-16",
    start_time: "15:00",
    end_time: "16:30",
    status: "pending",
    color: "blue",
    created_at: new Date().toISOString()
  },
  {
    id: "9",
    title: "Morning Yoga Practice",
    description: "Restorative stretch and core flow to kickstart the day with positive focus.",
    date: "2026-07-14",
    start_time: "08:00",
    end_time: "09:00",
    status: "done",
    color: "rose",
    created_at: new Date().toISOString()
  },
  {
    id: "10",
    title: "Client Presentation & Pitch",
    description: "Walk the client through project milestones, custom interactive components, and receive feedback.",
    date: "2026-07-14",
    start_time: "10:30",
    end_time: "12:00",
    status: "done",
    color: "orange",
    created_at: new Date().toISOString()
  },
  {
    id: "11",
    title: "Bug Scrub Session",
    description: "Identify and resolve responsive layout visual artifacts on smaller screens.",
    date: "2026-07-14",
    start_time: "14:00",
    end_time: "15:00",
    status: "done",
    color: "blue",
    created_at: new Date().toISOString()
  },
  {
    id: "12",
    title: "Quarterly Strategy Board",
    description: "Define key performance metrics and company-wide growth targets for Q3.",
    date: "2026-07-20",
    start_time: "11:00",
    end_time: "12:30",
    status: "pending",
    color: "purple",
    created_at: new Date().toISOString()
  },
  {
    id: "13",
    title: "Team Onboarding Kickoff",
    description: "Welcome new engineering hires and guide them through our development environment setup.",
    date: "2026-07-08",
    start_time: "09:00",
    end_time: "10:30",
    status: "done",
    color: "orange",
    created_at: new Date().toISOString()
  }
];

// Helper to read events
function readEvents(): CalendarEvent[] {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, "utf-8");
      return JSON.parse(data);
    } else {
      // Seed initial data
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(seedEvents, null, 2), "utf-8");
      return seedEvents;
    }
  } catch (error) {
    console.error("Error reading events database:", error);
    return [];
  }
}

// Helper to write events
function writeEvents(events: CalendarEvent[]) {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing events database:", error);
  }
}

// --- API ROUTES ---

// 0. Get Supabase integration status
app.get("/api/status", (req, res) => {
  res.json({
    supabaseConfigured: isSupabaseConfigured(),
    url: process.env.SUPABASE_URL || null,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
  });
});

// 0.1 Auth: Sign Up
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields: email, password, name" });
  }

  try {
    if (isSupabaseConfigured()) {
      const result = await signUpUser(email, password, name);
      return res.status(201).json({
        success: true,
        ...result
      });
    } else {
      // Offline fallback: simulate account registration
      return res.status(201).json({
        success: true,
        confirmationRequired: false,
        user: { email, name }
      });
    }
  } catch (error: any) {
    console.error("Sign up error:", error);
    return res.status(400).json({ error: error.message || "Failed to sign up" });
  }
});

// 0.2 Auth: Sign In
app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields: email, password" });
  }

  try {
    if (isSupabaseConfigured()) {
      const result = await signInUser(email, password);
      return res.json({
        success: true,
        ...result
      });
    } else {
      // Offline fallback: simulate sign in
      return res.json({
        success: true,
        user: { email, name: email.split("@")[0] || "Demo User" }
      });
    }
  } catch (error: any) {
    console.error("Sign in error:", error);
    return res.status(400).json({ error: error.message || "Failed to sign in" });
  }
});

// 1. Get all events
app.get("/api/events", async (req, res) => {
  const userEmail = req.headers["x-user-email"] as string;
  if (!userEmail) {
    return res.status(400).json({ error: "X-User-Email header is required" });
  }

  try {
    if (isSupabaseConfigured()) {
      console.log(`Supabase is active, fetching events for ${userEmail}...`);
      const events = await getSupabaseEvents(userEmail);
      return res.json(events);
    }
  } catch (error) {
    console.error("Supabase fetch failed, falling back to local file:", error);
  }

  const events = readEvents();
  const userEvents = events.filter(
    (e) => !e.user_email || e.user_email.toLowerCase() === userEmail.toLowerCase()
  );
  res.json(userEvents);
});

// 2. Add new event
app.post("/api/events", async (req, res) => {
  const userEmail = req.headers["x-user-email"] as string;
  if (!userEmail) {
    return res.status(400).json({ error: "X-User-Email header is required" });
  }

  const { title, description, date, start_time, end_time, status, color } = req.body;
  
  if (!title || !date || !start_time || !end_time) {
    return res.status(400).json({ error: "Missing required fields: title, date, start_time, end_time" });
  }

  const eventPayload = {
    id: Math.random().toString(36).substr(2, 9),
    user_email: userEmail,
    title,
    description: description || "",
    date,
    start_time,
    end_time,
    status: status || "pending",
    color: color || "orange"
  };

  try {
    if (isSupabaseConfigured()) {
      console.log(`Supabase is active, inserting event for ${userEmail}...`);
      const newEvent = await createSupabaseEvent(eventPayload, userEmail);
      return res.status(201).json(newEvent);
    }
  } catch (error) {
    console.error("Supabase insert failed, falling back to local file:", error);
  }

  const events = readEvents();
  const newEvent = {
    ...eventPayload,
    created_at: new Date().toISOString()
  };
  events.push(newEvent);
  writeEvents(events);
  res.status(201).json(newEvent);
});

// 3. Update an event
app.put("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const userEmail = req.headers["x-user-email"] as string;
  if (!userEmail) {
    return res.status(400).json({ error: "X-User-Email header is required" });
  }

  const { title, description, date, start_time, end_time, status, color } = req.body;

  try {
    if (isSupabaseConfigured()) {
      console.log(`Supabase is active, updating event ${id} for ${userEmail}...`);
      const updated = await updateSupabaseEvent(id, {
        title,
        description,
        date,
        start_time,
        end_time,
        status,
        color
      }, userEmail);
      return res.json(updated);
    }
  } catch (error) {
    console.error(`Supabase update failed for event ${id}, falling back to local file:`, error);
  }

  const events = readEvents();
  const eventIndex = events.findIndex(
    (e) => e.id === id && (!e.user_email || e.user_email.toLowerCase() === userEmail.toLowerCase())
  );

  if (eventIndex === -1) {
    return res.status(404).json({ error: "Event not found or unauthorized" });
  }

  const updatedEvent = {
    ...events[eventIndex],
    title: title !== undefined ? title : events[eventIndex].title,
    description: description !== undefined ? description : events[eventIndex].description,
    date: date !== undefined ? date : events[eventIndex].date,
    start_time: start_time !== undefined ? start_time : events[eventIndex].start_time,
    end_time: end_time !== undefined ? end_time : events[eventIndex].end_time,
    status: status !== undefined ? status : events[eventIndex].status,
    color: color !== undefined ? color : events[eventIndex].color,
  };

  events[eventIndex] = updatedEvent;
  writeEvents(events);
  res.json(updatedEvent);
});

// 4. Delete an event
app.delete("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  const userEmail = req.headers["x-user-email"] as string;
  if (!userEmail) {
    return res.status(400).json({ error: "X-User-Email header is required" });
  }

  try {
    if (isSupabaseConfigured()) {
      console.log(`Supabase is active, deleting event ${id} for ${userEmail}...`);
      await deleteSupabaseEvent(id, userEmail);
      return res.json({ success: true, message: `Event ${id} successfully deleted from Supabase` });
    }
  } catch (error) {
    console.error(`Supabase delete failed for event ${id}, falling back to local file:`, error);
  }

  const events = readEvents();
  const filteredEvents = events.filter(
    (e) => e.id !== id || (e.user_email && e.user_email.toLowerCase() !== userEmail.toLowerCase())
  );

  if (events.length === filteredEvents.length) {
    return res.status(404).json({ error: "Event not found or unauthorized" });
  }

  writeEvents(filteredEvents);
  res.json({ success: true, message: `Event ${id} successfully deleted` });
});

// --- VITE MIDDLEWARE CONFIGURATION ---

async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production build from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started at http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Failed to initialize server:", err);
});
