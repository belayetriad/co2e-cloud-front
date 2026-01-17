export const applyInitialTheme = () => {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  ).matches;
  const mode = (saved ?? (prefersDark ? "dark" : "light")) as "dark" | "light";
  document.documentElement.classList.toggle("dark", mode === "dark");
};

export const toggleTheme = () => {
  if (typeof window === "undefined") return;
  const isDark = document.documentElement.classList.contains("dark");
  const next = isDark ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("theme", next);
};
