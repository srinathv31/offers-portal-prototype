import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountTier } from "@/lib/db/schema";
import { Crown, Star, Gem, User } from "lucide-react";

interface AccountTierBadgeProps {
  tier: AccountTier;
  className?: string;
  showIcon?: boolean;
}

const tierConfig: Record<
  AccountTier,
  { label: string; className: string; icon: React.ElementType }
> = {
  STANDARD: {
    label: "Standard",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: User,
  },
  GOLD: {
    label: "Gold",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    icon: Star,
  },
  PLATINUM: {
    label: "Platinum",
    className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
    icon: Gem,
  },
  DIAMOND: {
    label: "Diamond",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    icon: Crown,
  },
};

export function AccountTierBadge({
  tier,
  className,
  showIcon = true,
}: AccountTierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium gap-1",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

