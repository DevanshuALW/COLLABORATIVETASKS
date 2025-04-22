import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@shared/schema";
import { auth } from "../firebase";
import { onAuthStateChanged, Auth } from "firebase/auth";
import { signOut } from "../auth";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing user in localStorage
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem("user");
      }
    }

    let unsubscribe = () => {};

    try {
      // Only set up auth state listener if Firebase auth is available
      if (auth) {
        unsubscribe = onAuthStateChanged(auth as Auth, (firebaseUser) => {
          if (!firebaseUser && user) {
            // Firebase says user is logged out but we have a user in state
            localStorage.removeItem("user");
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        console.error("Firebase auth not initialized");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  const logout = async () => {
    try {
      await signOut();
      localStorage.removeItem("user");
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    loading,
    setUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
