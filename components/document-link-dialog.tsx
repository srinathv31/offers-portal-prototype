"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Search, Link2 } from "lucide-react";
import { format } from "date-fns";

interface LibraryDocument {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

interface DocumentLinkDialogProps {
  offerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}

const mimeTypeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
  "text/markdown": "MD",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentLinkDialog({
  offerId,
  open,
  onOpenChange,
  onLinked,
}: DocumentLinkDialogProps) {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleLink(documentId: string) {
    setLinking(documentId);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/disclosures/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Link failed");
      }

      onLinked();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Link failed");
    } finally {
      setLinking(null);
    }
  }

  const filtered = documents.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link from Document Library
          </DialogTitle>
          <DialogDescription>
            Select a document from the library to link to this offer
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex-1 min-h-0 overflow-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {documents.length === 0
                ? "No documents in the library yet"
                : "No documents match your search"}
            </p>
          ) : (
            filtered.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mimeTypeLabels[doc.mimeType] || doc.mimeType} &middot;{" "}
                      {formatFileSize(doc.fileSize)} &middot;{" "}
                      {format(new Date(doc.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 flex-shrink-0"
                  disabled={linking === doc.id}
                  onClick={() => handleLink(doc.id)}
                >
                  {linking === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  Link
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
