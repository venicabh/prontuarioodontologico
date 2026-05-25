import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "aluno" | "professor_admin";

const PASSWORD_RECOVERY_STORAGE_KEY = "password-recovery-in-progress";

export function isPasswordRecoveryUrl() {
  return (
    typeof window !== "undefined" &&
    (window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery") ||
      window.location.search.includes("reset-password=1"))
  );
}

export function hasPasswordRecoverySession() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "true"
  );
}

function markPasswordRecoverySession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "true");
  }
}

export function clearPasswordRecoverySession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
    window.dispatchEvent(new Event("password-recovery-cleared"));
  }
}

// Captura no carregamento do módulo (antes do Supabase processar o hash)
const IS_RECOVERY_FLOW = isPasswordRecoveryUrl();

if (IS_RECOVERY_FLOW) {
  markPasswordRecoverySession();
}

if (
  IS_RECOVERY_FLOW &&
  typeof window !== "undefined" &&
  window.location.pathname !== "/" &&
  window.location.pathname !== "/reset-password"
) {
  window.history.replaceState(
    null,
    "",
    "/" + window.location.search + window.location.hash,
  );
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    IS_RECOVERY_FLOW || hasPasswordRecoverySession(),
  );

  useEffect(() => {
    const handleRecoveryCleared = () => setIsPasswordRecovery(false);
    window.addEventListener("password-recovery-cleared", handleRecoveryCleared);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // Em fluxo de recuperação, não tratar como login normal
      if (event === "PASSWORD_RECOVERY") {
        markPasswordRecoverySession();
        setIsPasswordRecovery(true);
      }

      if (event === "PASSWORD_RECOVERY" || IS_RECOVERY_FLOW || hasPasswordRecoverySession()) {
        setSession(s);
        setRole(null);
        setLoading(false);
        return;
      }
      setSession(s);
      if (s?.user) {
        setTimeout(() => fetchRole(s.user.id), 0);
      } else {
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (IS_RECOVERY_FLOW || hasPasswordRecoverySession()) {
        setIsPasswordRecovery(true);
        setSession(s);
        setRole(null);
        setLoading(false);
        return;
      }
      setSession(s);
      if (s?.user) {
        fetchRole(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("password-recovery-cleared", handleRecoveryCleared);
    };
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole((data?.role as AppRole) ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, role, loading, isPasswordRecovery, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
