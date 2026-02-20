"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { AuthUser } from "@/components/use-auth-user";

type AppHeaderProps = {
  me: AuthUser;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onLogout: () => Promise<void>;
};
type MenuPath = "/" | "/reports" | "/settings/smtp";

export default function AppHeader({ me, title, subtitle, actions, onLogout }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const roleLabel = String(me.role).toUpperCase();
  const headerAriaLabel = subtitle ? `${title} - ${subtitle}` : title;

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }
      const target = event.target as Node | null;
      if (target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
    };
  }, []);

  function go(path: MenuPath) {
    setMenuOpen(false);
    router.push(path);
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4" aria-label={headerAriaLabel}>
      <div className="flex items-center gap-3 md:gap-4">
        <Image
          src="/oilchem_logo.png"
          alt="Oilchem Logo"
          width={44}
          height={44}
          className="h-10 w-10 shrink-0 object-contain md:h-11 md:w-11"
          priority
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-slate-400 md:text-base">Oilchem</span>
          <span className="text-xl font-semibold text-white md:text-2xl">Entry/Exit Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex items-center rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-200"
          >
            <span className="max-w-[160px] truncate text-cyan-100/90">{`${me.username} (${roleLabel})`}</span>
          </button>

          {menuOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-zinc-700 bg-zinc-900/95 p-1 shadow-xl backdrop-blur">
              <button
                type="button"
                onClick={() => go("/")}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  pathname === "/" || pathname === "/dashboard"
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => go("/reports")}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  pathname?.startsWith("/reports") ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Reports
              </button>
              {me.role === "admin" ? (
                <button
                  type="button"
                  onClick={() => go("/settings/smtp")}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    pathname?.startsWith("/settings") ? "bg-zinc-800 text-zinc-100" : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  Settings
                </button>
              ) : null}
              <div className="my-1 border-t border-zinc-700" />
              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await onLogout();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>

        <Link
          href="/reports"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:border-zinc-500"
        >
          Reports
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
