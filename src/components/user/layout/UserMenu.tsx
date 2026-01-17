import { User } from "@/types/auth";
import clsx from "clsx";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
  currentUser: User | null;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout: () => void;
  align?: "left" | "right";
};

export default function UserMenu({
  currentUser,
  onProfile,
  onSettings,
  onLogout,
  align = "right",
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initialFallback =
    currentUser?.firstName
      ?.split(" ")
      .map((n: any) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const menuItems = [
    {
      key: "profile",
      label: "Profile",
      icon: <UserIcon className="h-4 w-4" />,
      onClick: () => onProfile?.(),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => onSettings?.(),
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogOut className="h-4 w-4" />,
      onClick: onLogout,
      destructive: true,
    },
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className={clsx(
          "flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5",
          "hover:bg-muted/60 dark:hover:bg-muted/40",
          "transition-colors"
        )}
      >
        <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-border/60">
          {currentUser?.imageUrl ? (
            <Image
              src={currentUser.imageUrl}
              alt={currentUser.firstName}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-sm font-semibold">
              {initialFallback}
            </div>
          )}
        </div>
        <div className="hidden min-w-0 flex-col text-left sm:flex">
          <span className="truncate text-sm font-medium text-foreground">
            {currentUser?.firstName}
          </span>
          {currentUser?.email && (
            <span className="truncate text-xs text-muted-foreground">
              {currentUser?.email}
            </span>
          )}
        </div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Card */}
      <div
        ref={menuRef}
        role="menu"
        tabIndex={-1}
        className={clsx(
          "absolute z-50 mt-2 w-64 rounded-2xl bg-background ",
          "backdrop-blur supports-[backdrop-filter]:bg-background",
          "shadow-lg ring-1 ring-black/5",
          align === "right" ? "right-0" : "left-0",
          open
            ? "opacity-100 scale-100"
            : "pointer-events-none opacity-0 scale-95",
          "origin-top",
          "transition transform duration-150 ease-out"
        )}
      >
        {/* Header summary */}
        <div className="flex items-center gap-3 p-4">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-border/60">
            {currentUser?.imageUrl ? (
              <Image
                src={currentUser.imageUrl}
                alt={currentUser.firstName}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-sm font-semibold">
                {initialFallback}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {currentUser?.firstName}
            </div>
            {currentUser?.email && (
              <div className="truncate text-xs text-muted-foreground">
                {currentUser.email}
              </div>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-border/70" />

        <div className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className={clsx(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm",
                "hover:bg-muted/70 dark:hover:bg-muted/40",
                item.destructive
                  ? "text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  : "text-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
