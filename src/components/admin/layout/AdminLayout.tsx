import type { NavItem } from "@/components/ui/NavItem";
import { BarChart3, BookOpen, LayoutList, Users } from "lucide-react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Users",
    icon: <Users className="h-4 w-4" />,
    href: "/admin/users",
    children: [
      { title: "User", href: "/admin/users/user" },
      { title: "Admins", href: "/admin/users/admins" },
    ],
  },

  {
    title: "Company",
    icon: <LayoutList className="h-4 w-4" />,
    href: "/admin/companies",
  },

  {
    title: "Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    href: "/admin/reports",
    children: [
      { title: "Revenue", href: "/admin/reports/revenue" },
      { title: "Engagement", href: "/admin/reports/engagement" },
      { title: "Course Performance", href: "/admin/reports/courses" },
    ],
  },
  // {
  //   title: "Settings",
  //   href: "/admin/settings",
  //   icon: <Settings className="h-4 w-4" />,
  // },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex">
        <Sidebar items={navItems} />
        <main className="flex-1 min-h-screen">
          <Header />
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
