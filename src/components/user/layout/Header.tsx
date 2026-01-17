import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { getCurrentUser } from "@/utils/token";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import UserMenu from "./UserMenu";

export default function Header() {
  const { toggleSidebar, theme, toggleTheme } = useUI();
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (currentUser.role == "admin") {
        router.push("/admin");
      } else if (currentUser.role == "instructor") {
        router.push("/instructor");
      }
    }
  }, [router]);
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur flex items-center px-4 justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Dashboard
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <UserMenu
            currentUser={currentUser}
            onProfile={() => {
              // route to /admin/profile
            }}
            onSettings={() => {
              // route to /admin/settings
            }}
            onLogout={logout}
          />
        </div>
      </div>
    </header>
  );
}
