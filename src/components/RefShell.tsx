/**
 * Exact port of the reference design app's `WorkspaceShell.tsx` - the left
 * icon+label nav rail, sticky header, mobile drawer and bottom tab bar.
 * The demo-only WorkspaceSwitcher (for flipping between the reference
 * app's own landing/patient/doctor/admin preview modes) is dropped since
 * this app has real, separately-authenticated dashboards instead.
 */
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import { RefAvatar } from "./ui-ref";

export type RefNavItem = { id: string; label: string; icon: IconName; badge?: number };

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-sans text-[20px] font-extrabold tracking-tight text-[var(--c-ink)]">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-[var(--c-muted)]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function RefShell({
  nav,
  active,
  onNav,
  brand,
  tag,
  accent,
  user,
  title,
  subtitle,
  actions,
  mobileIds,
  children,
}: {
  nav: RefNavItem[];
  active: string;
  onNav: (id: string) => void;
  brand: string;
  tag: string;
  accent: string;
  user: { name: string; role: string; photo?: string };
  title: string;
  subtitle: string;
  actions?: ReactNode;
  mobileIds: string[];
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);

  const Rail = (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 55%, #0b2026))` }}
        >
          <Icon name="wave" className="h-5 w-5" strokeWidth={2.1} />
        </div>
        <div className="leading-tight">
          <p className="font-sans text-[14.5px] font-extrabold tracking-tight text-[var(--c-ink)]">{brand}</p>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[var(--c-muted)] uppercase">{tag}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const on = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNav(item.id);
                setDrawer(false);
              }}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all",
                on
                  ? "text-[var(--c-ink)]"
                  : "text-[var(--c-muted)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-ink)]",
              )}
              style={on ? { background: `color-mix(in srgb, ${accent} 13%, transparent)` } : undefined}
            >
              {on && (
                <span
                  className="absolute top-1/2 -left-5 h-6 w-1 -translate-y-1/2 rounded-r-full"
                  style={{ background: accent }}
                />
              )}
              <Icon name={item.icon} className="h-[18px] w-[18px]" strokeWidth={on ? 2 : 1.7} />
              <span className="flex-1 text-left">{item.label}</span>
              {!!item.badge && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                  style={{ background: accent }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-[var(--c-line)] bg-[var(--c-surface2)] p-3.5">
        <div className="flex items-center gap-2.5">
          <RefAvatar src={user.photo} name={user.name} size={36} online />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-[var(--c-ink)]">{user.name}</p>
            <p className="truncate text-[11px] text-[var(--c-muted)]">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--c-canvas)] text-[var(--c-ink)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-[var(--c-line)] bg-[var(--c-surface)] lg:block">
        {Rail}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#04161a]/50 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="anim-pop absolute inset-y-0 left-0 w-[272px] border-r border-[var(--c-line)] bg-[var(--c-surface)]">
            {Rail}
          </div>
        </div>
      )}

      <div className="lg:pl-[256px]">
        <header className="sticky top-0 z-30 border-b border-[var(--c-line)] bg-[var(--c-canvas)]/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-7">
            <button
              onClick={() => setDrawer(true)}
              className="-ml-1 cursor-pointer rounded-xl p-2 text-[var(--c-muted)] transition hover:bg-[var(--c-surface2)] hover:text-[var(--c-ink)] lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" />
            </button>
            <div className="min-w-0">
              <h1 className="font-sans truncate text-[15.5px] font-extrabold tracking-tight text-[var(--c-ink)]">
                {title}
              </h1>
              <p className="truncate text-[12px] text-[var(--c-muted)]">{subtitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">{actions}</div>
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2 px-4 pb-3">{actions}</div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pt-6 pb-24 lg:px-7 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--c-line)] bg-[var(--c-surface)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="flex">
          {nav
            .filter((n) => mobileIds.includes(n.id))
            .map((item) => {
              const on = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  className="relative flex flex-1 cursor-pointer flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition"
                  style={{ color: on ? accent : "var(--c-muted)" }}
                >
                  <Icon name={item.icon} className="h-[19px] w-[19px]" strokeWidth={on ? 2.1 : 1.7} />
                  {item.label.split(" ")[0]}
                </button>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
