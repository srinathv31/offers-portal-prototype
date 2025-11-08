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

interface ControlItem {
  name: string;
  result: "PASS" | "WARN" | "FAIL";
  evidenceRef?: string;
}

interface ControlChecklistProps {
  items: ControlItem[];
}

const resultColors: Record<"PASS" | "WARN" | "FAIL", string> = {
  PASS: "bg-green-500 text-white",
  WARN: "bg-yellow-500 text-white",
  FAIL: "bg-red-500 text-white",
};

export function ControlChecklist({ items }: ControlChecklistProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Control</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Evidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn("border-0", resultColors[item.result])}
              >
                {item.result}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {item.evidenceRef || "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

