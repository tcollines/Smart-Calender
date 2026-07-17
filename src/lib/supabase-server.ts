import { createClient } from "@supabase/supabase-js";

export interface CalendarEvent {
  id: string;
  user_email?: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: "pending" | "done";
  color: string;
  created_at: string;
}

let supabaseClient: any = null;

// Lazy initialization of Supabase client to prevent app crash if keys are missing
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === "" || supabaseKey.trim() === "") {
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

/**
 * AUTHENTICATION METHODS
 */

export async function signUpUser(email: string, password: string, name: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        full_name: name,
      },
    },
  });

  if (error) {
    throw error;
  }

  // If email confirmation is enabled, session might be null and user confirmation_sent_at might be set
  const confirmationRequired = !data.session;

  return {
    user: data.user ? {
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || name,
    } : null,
    confirmationRequired,
  };
}

export async function signInUser(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user ? {
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || "User",
    } : null,
    session: data.session,
  };
}

/**
 * CALENDAR EVENTS METHODS (Scoped by User Email)
 */

export async function getSupabaseEvents(userEmail: string): Promise<CalendarEvent[]> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching events from Supabase:", error);
    throw error;
  }

  return (data || []) as CalendarEvent[];
}

export async function createSupabaseEvent(
  event: Omit<CalendarEvent, "created_at">,
  userEmail: string
): Promise<CalendarEvent> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const newEvent = {
    ...event,
    user_email: userEmail,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("events")
    .insert([newEvent])
    .select();

  if (error) {
    console.error("Error creating event in Supabase:", error);
    throw error;
  }

  return data[0] as CalendarEvent;
}

export async function updateSupabaseEvent(
  id: string,
  updates: Partial<CalendarEvent>,
  userEmail: string
): Promise<CalendarEvent> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await client
    .from("events")
    .update(updates)
    .eq("id", id)
    .eq("user_email", userEmail)
    .select();

  if (error) {
    console.error(`Error updating event ${id} in Supabase:`, error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Event with ID ${id} not found or unauthorized in Supabase`);
  }

  return data[0] as CalendarEvent;
}

export async function deleteSupabaseEvent(id: string, userEmail: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await client
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_email", userEmail);

  if (error) {
    console.error(`Error deleting event ${id} from Supabase:`, error);
    throw error;
  }
}
