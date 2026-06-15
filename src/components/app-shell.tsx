import Link from "next/link";
import type { ReactNode } from "react";
import { authNavigation, mainNavigation } from "@/lib/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">PP</span>
          <span>
            <strong>PowerPicks</strong>
            <small>Fantasy powerlifting predictions</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {mainNavigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <div className="auth-nav">
            {authNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="nav-button">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
