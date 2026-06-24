import {
  createContext,
  useContext,
  useState,
  useEffect,
  FC,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  credits_remaining: number;
  total_turns_used: number;
  is_lifetime: boolean;
}

interface AuthContextValue {
  authSession: Session | null;
  profile: UserProfile | null;
  fetchProfile: (userId?: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (userId?: string) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      // If no profile exists yet, create one
      if (error.code === "PGRST116") {
        const { data: newProfile } = await supabase
          .from("user_profiles")
          .insert({
            id: userId,
            credits_remaining: 0,
            total_turns_used: 0,
            is_lifetime: false,
          })
          .select()
          .single();
        if (newProfile) setProfile(newProfile);
      }
    } else if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session);
      fetchProfile(session?.user?.id);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      fetchProfile(session?.user?.id);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ authSession, profile, fetchProfile, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
