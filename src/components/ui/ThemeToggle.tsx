import { toggleTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);
  return (
    <button
      onClick={() => {
        toggleTheme();
        setIsDark((v) => !v);
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted"
      title="Toggle theme"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
