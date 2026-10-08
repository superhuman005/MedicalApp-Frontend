import { useState, type ReactNode, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import { Menu, Sun, Moon, Activity } from "lucide-react";

export type ShellNavItem = { id: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; badge?: number };

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Avatar with a name-derived gradient fallback and an optional online dot -
 * matches the reference design's rail/header avatar treatment. */
export function ShellAvatar({
  src,
  name,
  size = 40,
  online,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <span
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full font-semibold text-white"
        style={{
          fontSize: size * 0.36,
          background: `linear-gradient(140deg, hsl(${hue} 55% 46%), hsl(${(hue + 48) % 360} 60% 36%))`,
        }}
      >
        {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials(name)}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full border-2 border-card",
            online ? "bg-emerald-500" : "bg-slate-400",
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </span>
  );
}

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[20px] font-extrabold tracking-tight text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Shared dashboard chrome - a fixed left icon+label nav rail with an
 * accent-colored active indicator, a sticky translucent header carrying the
 * page title/subtitle and any actions, and a mobile drawer + bottom tab bar
 * for small screens. Each dashboard (patient/doctor/admin) passes its own
 * `accent` hex to tint the active nav state and a few highlights, while the
 * base palette (brand teal, surfaces, status colors) stays the same
 * app-wide via the CSS tokens in index.css.
 */
export function DashboardShell({
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
  dark,
  onToggleDark,
  children,
}: {
  nav: ShellNavItem[];
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
  dark?: boolean;
  onToggleDark?: () => void;
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
          <Activity className="h-5 w-5" strokeWidth={2.1} />
        </div>
        <div className="leading-tight">
          <p className="text-[14.5px] font-extrabold tracking-tight text-foreground">{brand}</p>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{tag}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const on = active === item.id;
          const ItemIcon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNav(item.id);
                setDrawer(false);
              }}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all",
                on ? "text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              style={on ? { background: `color-mix(in srgb, ${accent} 13%, transparent)` } : undefined}
            >
              {on && (
                <span
                  className="absolute top-1/2 -left-5 h-6 w-1 -translate-y-1/2 rounded-r-full"
                  style={{ background: accent }}
                />
              )}
              <ItemIcon className="h-[18px] w-[18px]" strokeWidth={on ? 2 : 1.7} />
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

      <div className="rounded-2xl border border-border bg-secondary p-3.5">
        <div className="flex items-center gap-2.5">
          <ShellAvatar src={user.photo} name={user.name} size={36} online />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-foreground">{user.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] border-r border-border bg-card lg:block">
        {Rail}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="anim-pop absolute inset-y-0 left-0 w-[272px] border-r border-border bg-card">{Rail}</div>
        </div>
      )}

      <div className="lg:pl-[256px]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-7">
            <button
              onClick={() => setDrawer(true)}
              className="-ml-1 cursor-pointer rounded-xl p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[15.5px] font-extrabold tracking-tight text-foreground">{title}</h1>
              <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">{actions}</div>
              {onToggleDark && (
                <button
                  onClick={onToggleDark}
                  className="cursor-pointer rounded-xl p-2.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </button>
              )}
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2 px-4 pb-3">{actions}</div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pt-6 pb-24 lg:px-7 lg:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="flex">
          {nav
            .filter((n) => mobileIds.includes(n.id))
            .map((item) => {
              const on = active === item.id;
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNav(item.id)}
                  className="relative flex flex-1 cursor-pointer flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition"
                  style={{ color: on ? accent : "hsl(var(--muted-foreground))" }}
                >
                  <ItemIcon className="h-[19px] w-[19px]" strokeWidth={on ? 2.1 : 1.7} />
                  {item.label.split(" ")[0]}
                </button>
              );
            })}
        </div>
      </nav>
    </div>
  );
}
