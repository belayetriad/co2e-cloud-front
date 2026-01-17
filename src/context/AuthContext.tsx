import { loginRequest } from "@/services/auth";
import { LoginPayload, User } from "@/types/auth";
import {
  clearTokens,
  getCurrentUser,
  setAccessToken,
  setRefreshToken,
  setUser,
} from "@/utils/token";
import { useRouter } from "next/router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextType = {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  useEffect(() => {
    const u = getCurrentUser<User>();
    if (u) setCurrentUserState(u);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await loginRequest(payload);

      // Normalize failure modes (handle both throw and non-throw returns)
      if (!data || data?.success === false) {
        const apiMsg =
          (data && (data.message || data.error)) ||
          "Authentication failed. Please try again.";
        throw new Error(apiMsg);
      }

      // Validate required fields
      if (!data.accessToken || !data.refreshToken || !data.user) {
        throw new Error("Invalid login response from server.");
      }

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      setCurrentUserState(data.user);

      if (data.user.role === "admin") {
        router.push("/admin");
      } else if (data.user.role === "instructor") {
        router.push("/instructor");
      } else {
        router.push("/student");
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    clearTokens();
    setCurrentUserState(null);
    router.push("/");
  }, [router]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      login,
      logout,
    }),
    [currentUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
