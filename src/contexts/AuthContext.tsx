import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../services/supabaseClient";
import { routes } from "../routes";
import type { User } from "@supabase/supabase-js";

export type SignUpUserMetadata = {
  name?: string;
  weight_kg?: string;
  height_cm?: string;
  gender?: string;
  locale?: string;
  weight_unit?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: SignUpUserMetadata
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ?? null };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: SignUpUserMetadata
    ) => {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}${routes.auth}`
          : undefined;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...(metadata ? { data: metadata as Record<string, string> } : {}),
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      });
      return { error: error ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
