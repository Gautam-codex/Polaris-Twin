import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "").replace(/\/$/, "");
export const DEMO_EMAIL = "demo@polaristwin.app";
export const DEMO_PASSWORD = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? "";

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && ANON_KEY.length > 0;

/** Supabase client with sessions stored in AsyncStorage. */
export const supabase = createClient(SUPABASE_URL || "https://not-configured.supabase.co", ANON_KEY || "missing", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") void supabase.auth.startAutoRefresh();
  else void supabase.auth.stopAutoRefresh();
});
