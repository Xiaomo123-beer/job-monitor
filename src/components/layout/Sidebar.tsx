"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Briefcase,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/configure",
    label: "监控配置",
    icon: PlusCircle,
  },
  {
    href: "/jobs",
    label: "岗位列表",
    icon: Briefcase,
  },
  {
    href: "/settings",
    label: "设置",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {collapsed && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-sidebar border-r border-sidebar-border transition-all duration-200",
          "lg:translate-x-0 lg:static lg:flex lg:flex-col",
          collapsed ? "translate-x-0 w-60" : "-translate-x-full w-60 lg:w-60"
        )}
      >
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Briefcase className="h-5 w-5 text-sidebar-primary" />
            <span className="text-sidebar-primary-foreground">
              岗位监测助手
            </span>
          </Link>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCollapsed(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60">
            © 2026 岗位监测助手
          </p>
        </div>
      </aside>
    </>
  );
}
