import { cn } from "@/lib/utils";

type Props = {
  /** Score 0..1 */
  value: number;
  className?: string;
  showLabel?: boolean;
};

export function ScoreBar({ value, className, showLabel = true }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 60
        ? "bg-amber-500"
        : "bg-zinc-400";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="min-w-[2.2rem] text-right text-xs font-medium tabular-nums text-zinc-700">
          {pct}
        </span>
      )}
    </div>
  );
}
