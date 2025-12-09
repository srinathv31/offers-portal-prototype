"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              Offers OS
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  pathname === "/"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/accounts"
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  pathname.startsWith("/accounts")
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Accounts
              </Link>
              <Link
                href="/offers"
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  pathname.startsWith("/offers") || pathname === "/create-offer"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Offers
              </Link>
              <Link
                href="/spending-groups"
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  pathname === "/spending-groups"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Spending Groups
              </Link>
              <Link
                href="/create-campaign"
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors hover:text-foreground",
                  pathname === "/create-campaign"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Create Campaign
              </Link>
            </div>
          </div>
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}

