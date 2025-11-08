"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Approval {
  id: string;
  role: string;
  actor?: string;
  decision: "APPROVED" | "REJECTED" | "PENDING";
  timestamp?: Date | string;
}

interface ApprovalStatusProps {
  approvals: Approval[];
}

const decisionColors: Record<"APPROVED" | "REJECTED" | "PENDING", string> = {
  APPROVED: "bg-green-500 text-white",
  REJECTED: "bg-red-500 text-white",
  PENDING: "bg-yellow-500 text-white",
};

export function ApprovalStatus({ approvals }: ApprovalStatusProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableHead>Decision</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No approvals yet
            </TableCell>
          </TableRow>
        ) : (
          approvals.map((approval) => (
            <TableRow key={approval.id}>
              <TableCell className="font-medium">{approval.role}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("border-0", decisionColors[approval.decision])}
                >
                  {approval.decision}
                </Badge>
              </TableCell>
              <TableCell>{approval.actor || "-"}</TableCell>
              <TableCell>
                {approval.timestamp
                  ? new Date(approval.timestamp).toLocaleString()
                  : "-"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

