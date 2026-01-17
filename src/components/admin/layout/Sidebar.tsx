import type { NavItem as Item } from "@/components/ui/NavItem";
import { useUI } from "@/context/UIContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const NavSection = ({
  item,
  collapsed,
}: {
  item: Item;
  collapsed: boolean;
}) => {
  const router = useRouter();
  const isActive = (href?: string) =>
    href ? router.pathname.startsWith(href) : false;
  const [open, setOpen] = useState(isActive(item.href));

  if (item.children?.length) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
            isActive(item.href) ? "bg-slate-100 dark:bg-slate-800" : ""
          }`}
          aria-expanded={open}
        >
          <span className="shrink-0">{item.icon}</span>
          {!collapsed && (
            <span className="flex-1 text-left text-sm font-medium">
              {item.title}
            </span>
          )}
          {!collapsed &&
            (open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            ))}
        </button>
        {open && !collapsed && (
          <div className="mt-1 ml-10 space-y-1">
            {item.children.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`block text-sm px-3 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  isActive(c.href) ? "bg-slate-100 dark:bg-slate-800" : ""
                }`}
              >
                {c.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
        isActive(item.href) ? "bg-slate-100 dark:bg-slate-800" : ""
      }`}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
    </Link>
  );
};

export default function Sidebar({ items }: { items: Item[] }) {
  const { sidebarCollapsed } = useUI();

  return (
    <aside
      className={`h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-3 transition-[width] duration-200
      ${sidebarCollapsed ? "w-[72px]" : "w-64"}`}
    >
      <div className="flex items-center gap-2 px-2 pb-3">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-semibold">
          L
        </div>
        {!sidebarCollapsed && (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            CO2e Cloud Admin
          </span>
        )}
      </div>
      <nav className="mt-2">
        {items.map((item) => (
          <NavSection
            key={item.title}
            item={item}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>
    </aside>
  );
}
