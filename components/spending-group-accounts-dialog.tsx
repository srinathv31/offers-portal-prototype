"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { AccountTierBadge } from "@/components/account-tier-badge";
import type { AccountTier } from "@/lib/db/schema";
import { Users, ExternalLink } from "lucide-react";

interface Account {
  id: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  tier: AccountTier;
  annualSpend: number;
}

interface SpendingGroupAccountsDialogProps {
  groupName: string;
  accounts: Account[];
  trigger?: React.ReactNode;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const columns: ColumnDef<Account>[] = [
  {
    accessorKey: "name",
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => {
      const account = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
            {account.firstName[0]}
            {account.lastName[0]}
          </div>
          <div>
            <Link
              href={`/accounts/${account.id}`}
              className="font-medium hover:underline flex items-center gap-1"
            >
              {account.firstName} {account.lastName}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
            <p className="text-xs text-muted-foreground">
              {account.accountNumber}
            </p>
          </div>
        </div>
      );
    },
    filterFn: (row, id, filterValue) => {
      const name = `${row.original.firstName} ${row.original.lastName}`.toLowerCase();
      const accountNum = row.original.accountNumber.toLowerCase();
      const search = (filterValue as string).toLowerCase();
      return name.includes(search) || accountNum.includes(search);
    },
  },
  {
    accessorKey: "tier",
    header: ({ column }) => (
      <SortableHeader column={column}>Tier</SortableHeader>
    ),
    cell: ({ row }) => <AccountTierBadge tier={row.getValue("tier")} />,
    sortingFn: (rowA, rowB) => {
      const tierOrder: Record<AccountTier, number> = {
        DIAMOND: 4,
        PLATINUM: 3,
        GOLD: 2,
        STANDARD: 1,
      };
      return (
        tierOrder[rowA.getValue("tier") as AccountTier] -
        tierOrder[rowB.getValue("tier") as AccountTier]
      );
    },
  },
  {
    accessorKey: "annualSpend",
    header: ({ column }) => (
      <SortableHeader column={column} className="justify-end">
        Annual Spend
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {formatCurrency(row.getValue("annualSpend"))}
      </div>
    ),
  },
];

export function SpendingGroupAccountsDialog({
  groupName,
  accounts,
  trigger,
}: SpendingGroupAccountsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            View All Members
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {groupName} - Members ({accounts.length})
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <DataTable
            columns={columns}
            data={accounts}
            searchKey="name"
            searchPlaceholder="Search by name or account number..."
            pageSize={10}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

