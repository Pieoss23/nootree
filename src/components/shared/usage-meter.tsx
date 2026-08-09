import { cn } from "@/lib/utils";

type UsageMeterProps = {
  label: string;
  current: number;
  /** `null` means unlimited. */
  limit: number | null;
};

export function UsageMeter({ label, current, limit }: UsageMeterProps) {
  const isUnlimited = limit === null;
  const ratio = isUnlimited ? 0 : limit === 0 ? 1 : Math.min(current / limit, 1);
  const isNearLimit = !isUnlimited && ratio >= 0.9;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {current} {isUnlimited ? "" : `/ ${limit}`}
        </span>
      </div>
      {isUnlimited ? null : (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isNearLimit ? "bg-amber-500" : "bg-primary",
            )}
            style={{ width: `${ratio * 100}%` }}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={limit}
          />
        </div>
      )}
    </div>
  );
}
