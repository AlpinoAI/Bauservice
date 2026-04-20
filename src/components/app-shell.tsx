"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  Mails,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/empfaenger", label: "Kontakte", icon: Users },
  { href: "/kampagnen", label: "Kampagnen", icon: Mails },
  { href: "/services", label: "Services", icon: Building2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
            BS
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-900">
              Bauservice
            </div>
            <div className="truncate text-[11px] text-zinc-500">
              Email-Automation
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                  active
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-100 p-2">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <LogOut size={16} />
              Abmelden
            </button>
          </form>
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
