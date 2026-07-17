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

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  // Read client-side environment variables
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === "" || supabaseKey.trim() === "") {
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
    });
    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize client-side Supabase client:", error);
    return null;
  }
}

export function isClientSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

/**
 * CLIENT DIRECT AUTHENTICATION METHODS
 */

export async function clientSignUpUser(email: string, password: string, name: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Client Supabase is not initialized.");
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        full_name: name,
      },
      // When deployed to Vercel/production, we can redirect back to the current site origin
      emailRedirectTo: window.location.origin
    },
  });

  if (error) {
    throw error;
  }

  const confirmationRequired = !data.session;

  return {
    user: data.user ? {
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || name,
    } : null,
    confirmationRequired,
  };
}

export async function clientSignInUser(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Client Supabase is not initialized.");
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
 * CLIENT DIRECT CALENDAR EVENTS METHODS
 */

export async function getClientEvents(userEmail: string): Promise<CalendarEvent[]> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Client Supabase is not initialized.");
  }

  const { data, error } = await client
    .from("events")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching events directly from Supabase:", error);
    throw error;
  }

  return (data || []) as CalendarEvent[];
}

export async function createClientEvent(
  event: Omit<CalendarEvent, "created_at">,
  userEmail: string
): Promise<CalendarEvent> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Client Supabase is not initialized.");
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
    console.error("Error creating event directly in Supabase:", error);
    throw error;
  }

  return data[0] as CalendarEvent;
}

export async function updateClientEvent(
  id: string,
  updates: Partial<CalendarEvent>,
  userEmail: string
): Promise<CalendarEvent> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Client Supabase is not initialized.");
  }

  const { data, error } = await client
    .from("events")
    .update(updates)
    .eq("id", id)
    .eq("user_email", userEmail)
    .select();

  if (error) {
    console.error(`Error updating event ${id} directly in Supabase:`, error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error(`Event with ID ${id} not found or unauthorized directly in Supabase`);
  }

  return data[0] as CalendarEvent;
}

export async function deleteClientEvent(id: string, userEmail: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Client Supabase is not initialized.");
  }

  const { error } = await client
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_email", userEmail);

  if (error) {
    console.error(`Error deleting event ${id} directly from Supabase:`, error);
    throw error;
  }
}
