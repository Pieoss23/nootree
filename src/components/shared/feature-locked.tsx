import Link from "next/link";
import { Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type FeatureLockedProps = {
  featureName: string;
  description?: string;
};

export function FeatureLocked({
  featureName,
  description = "Questa funzionalità non è inclusa nel piano attuale.",
}: FeatureLockedProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <Lock className="size-8 text-muted-foreground" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{featureName} non disponibile</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href="/app/billing"
        className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2" })}
      >
        Vedi i piani
      </Link>
    </div>
  );
}
