/**
 * Exact port of the reference design app's `ui.tsx` primitive library.
 * Classes use arbitrary values against the --c-* raw-hex tokens (added in
 * index.css) instead of the shadcn HSL tokens, so colors/shadows/radii
 * match the reference pixel-for-pixel regardless of the rest of the app's
 * theme. Keep this file's logic verbatim with the reference; only the
 * import paths (cn, Icon, initials) were adjusted to this project's layout.
 */
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/* ---------------------------------- Card ---------------------------------- */
export function Card({
  className,
  children,
  pad = true,
}: {
  className?: string;
  children: ReactNode;
  pad?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--c-line)] bg-[var(--c-surface)] shadow-[0_1px_2px_rgba(11,32,38,0.04),0_8px_24px_-16px_rgba(11,32,38,0.25)]",
        pad && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-sans text-[15px] font-semibold tracking-tight text-[var(--c-ink)]">{title}</h2>
        {sub && <p className="mt-0.5 text-[13px] text-[var(--c-muted)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- Button --------------------------------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "soft" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
};

export function RefButton({ variant = "primary", size = "md", className, ...rest }: BtnProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-[var(--c-brand)] text-white hover:brightness-110 active:brightness-95 shadow-[0_6px_18px_-8px_var(--c-brand)]",
    dark: "bg-[var(--c-ink)] text-[var(--c-canvas)] hover:opacity-90",
    outline: "border border-[var(--c-line)] bg-[var(--c-surface)] text-[var(--c-ink)] hover:bg-[var(--c-surface2)]",
    soft: "bg-[var(--c-brandsoft)] text-[var(--c-brandink)] hover:brightness-[0.97]",
    ghost: "text-[var(--c-muted)] hover:bg-[var(--c-surface2)] hover:text-[var(--c-ink)]",
    danger: "bg-[var(--c-danger)] text-white hover:brightness-110",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[12.5px] gap-1.5",
    md: "h-10 px-4 text-[13.5px] gap-2",
    lg: "h-12 px-6 text-[15px] gap-2",
    icon: "h-10 w-10 justify-center",
  };
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
}

/* ---------------------------------- Badge --------------------------------- */
export function RefBadge({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
        "bg-[var(--c-surface2)] text-[var(--c-muted)]",
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      {children}
    </span>
  );
}

/* --------------------------------- Avatar --------------------------------- */
export function RefAvatar({
  src,
  name,
  size = 40,
  ring,
  online,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  ring?: boolean;
  online?: boolean;
  className?: string;
}) {
  const [bad, setBad] = useState(false);
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <span
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden rounded-full font-semibold text-white",
          ring && "ring-2 ring-[var(--c-brand)]/70 ring-offset-2 ring-offset-[var(--c-surface)]",
        )}
        style={{
          fontSize: size * 0.36,
          background: `linear-gradient(140deg, hsl(${hue} 55% 46%), hsl(${(hue + 48) % 360} 60% 36%))`,
        }}
      >
        {src && !bad ? (
          <img
            src={src}
            alt={name}
            loading="lazy"
            onError={() => setBad(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          initials(name)
        )}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full border-2 border-[var(--c-surface)]",
            online ? "bg-emerald-500" : "bg-slate-400",
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </span>
  );
}

/* ---------------------------------- Stars --------------------------------- */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--c-ink)]", className)}>
      <Icon name="star" filled className="h-3.5 w-3.5 text-amber-400" strokeWidth={0} />
      {value.toFixed(1)}
    </span>
  );
}

/* ------------------------------- Segmented -------------------------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-xl border border-[var(--c-line)] bg-[var(--c-surface2)] p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-all",
            value === o.value
              ? "bg-[var(--c-surface)] text-[var(--c-ink)] shadow-sm"
              : "text-[var(--c-muted)] hover:text-[var(--c-ink)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------- Ring ---------------------------------- */
export function Ring({
  value,
  size = 64,
  stroke = 7,
  color = "var(--c-brand)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, value)) / 100}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  );
}

/* -------------------------------- Sparkline ------------------------------- */
export function Sparkline({
  data,
  color = "var(--c-brand)",
  height = 40,
  width = 120,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 4 - ((v - min) / span) * (height - 10);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const id = `sg-${color.replace(/[^a-z0-9]/gi, "")}-${width}`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

/* ---------------------------------- Field --------------------------------- */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold tracking-wide text-[var(--c-muted)] uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[var(--c-muted)]">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-[var(--c-line)] bg-[var(--c-surface2)] px-3.5 py-2.5 text-[13.5px] text-[var(--c-ink)] outline-none transition placeholder:text-[var(--c-muted)]/70 focus:border-[var(--c-brand)] focus:bg-[var(--c-surface)] focus:ring-4 focus:ring-[var(--c-brand)]/10";

/* ------------------------- Image with safe fallback ----------------------- */
export function Img({
  src,
  alt,
  className,
  name,
}: {
  src?: string;
  alt: string;
  className?: string;
  name: string;
}) {
  const [bad, setBad] = useState(false);
  if (!src || bad) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-[radial-gradient(circle_at_35%_25%,#1b3b45,#07141a)]",
          className,
        )}
      >
        <span className="text-[26px] font-extrabold tracking-wide text-white/60">{initials(name)}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setBad(true)} className={className} />;
}

/* ------------------------------- Empty state ------------------------------ */
export function Empty({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--c-line)] py-14 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--c-surface2)] text-[var(--c-muted)]">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <p className="text-[14px] font-semibold text-[var(--c-ink)]">{title}</p>
      <p className="max-w-xs text-[13px] text-[var(--c-muted)]">{body}</p>
    </div>
  );
}

/* ---------------------------------- Modal --------------------------------- */
export function Modal({
  open,
  onClose,
  children,
  width = "max-w-xl",
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  label?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#04161a]/50 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "anim-pop relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-[var(--c-line)] bg-[var(--c-surface)] shadow-2xl sm:rounded-3xl",
          width,
        )}
      >
        {children}
      </div>
    </div>
  );
}
