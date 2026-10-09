/**
 * Exact port of the reference design app's StatTile / MetricCard from
 * `widgets.tsx`, adapted to this project's token names (see ui-ref.tsx).
 */
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Card, Sparkline } from "./ui-ref";

export function StatTile({
  icon,
  label,
  value,
  delta,
  color = "var(--c-brand)",
  series,
  suffix,
}: {
  icon: string;
  label: string;
  value: string;
  delta?: number;
  color?: string;
  series?: number[];
  suffix?: string;
}) {
  const good = (delta ?? 0) >= 0;
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[var(--c-muted)]">{label}</p>
          <p className="mt-1 text-[25px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">
            {value}
            {suffix && <span className="ml-1 text-[13px] font-semibold text-[var(--c-muted)]">{suffix}</span>}
          </p>
          {delta !== undefined && (
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                good
                  ? "bg-[var(--c-brandsoft)] text-[var(--c-brandink)]"
                  : "bg-[var(--c-dangersoft)] text-[var(--c-danger)]",
              )}
            >
              <Icon name={good ? "up" : "down"} className="h-3 w-3" strokeWidth={2.8} />
              {Math.abs(delta)}% vs last month
            </p>
          )}
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      {series && (
        <div className="mt-3 -mb-2 -ml-1 opacity-90">
          <Sparkline data={series} color={color} width={240} height={38} />
        </div>
      )}
    </Card>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  unit,
  delta,
  series,
  color = "var(--c-brand)",
  caption,
  onClick,
}: {
  icon: string;
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  series: number[];
  color?: string;
  caption?: string;
  onClick?: () => void;
}) {
  const up = (delta ?? 0) > 0;
  return (
    <Card
      className={cn(
        "group relative overflow-hidden",
        onClick && "cursor-pointer transition hover:-translate-y-0.5 hover:border-[var(--c-brand)]/40",
      )}
    >
      <div onClick={onClick}>
        <div className="flex items-start justify-between">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
          >
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold",
                up
                  ? "bg-[var(--c-brandsoft)] text-[var(--c-brandink)]"
                  : "bg-[var(--c-accentsoft)] text-[var(--c-accent)]",
              )}
            >
              <Icon name={up ? "up" : "down"} className="h-3 w-3" strokeWidth={2.6} />
              {Math.abs(delta)}
            </span>
          )}
        </div>
        <p className="mt-3 text-[12px] font-semibold text-[var(--c-muted)]">{label}</p>
        <p className="mt-0.5 flex items-baseline gap-1">
          <span className="text-[26px] leading-none font-extrabold tracking-tight text-[var(--c-ink)]">{value}</span>
          {unit && <span className="text-[12.5px] font-semibold text-[var(--c-muted)]">{unit}</span>}
        </p>
        <div className="mt-3 -mb-1">
          <Sparkline data={series} color={color} width={190} height={44} />
        </div>
        {caption && <p className="mt-1 text-[11.5px] text-[var(--c-muted)]">{caption}</p>}
      </div>
    </Card>
  );
}
