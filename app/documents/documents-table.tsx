"use client";

import { useState, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { DocumentViewer } from "@/components/document-viewer";

interface LinkedOffer {
  id: string;
  name: string;
}

interface DocumentRow {
  id: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  description: string | null;
  createdAt: string;
  downloadUrl: string | null;
  linkedOffers: LinkedOffer[];
}

const mimeTypeLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  "application/pdf": { label: "PDF", variant: "default" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "DOCX",
    variant: "secondary",
  },
  "text/plain": { label: "TXT", variant: "outline" },
  "text/markdown": { label: "MD", variant: "outline" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsTable({
  initialDocuments,
}: {
  initialDocuments: DocumentRow[];
}) {
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refreshDocuments() {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // silently fail
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: ColumnDef<DocumentRow>[] = [
    {
      accessorKey: "fileName",
      header: ({ column }) => (
        <SortableHeader column={column}>File Name</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate font-medium text-sm">
            {row.original.fileName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "mimeType",
      header: "Type",
      cell: ({ row }) => {
        const info = mimeTypeLabels[row.original.mimeType];
        return (
          <Badge variant={info?.variant || "outline"}>
            {info?.label || row.original.mimeType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "fileSize",
      header: ({ column }) => (
        <SortableHeader column={column}>Size</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatFileSize(row.original.fileSize)}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Uploaded</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "linkedOffers",
      header: "Linked Offers",
      cell: ({ row }) => {
        const count = row.original.linkedOffers.length;
        if (count === 0)
          return (
            <span className="text-sm text-muted-foreground">None</span>
          );
        return (
          <Badge variant="secondary">
            {count} offer{count !== 1 ? "s" : ""}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewingDoc(row.original)}
            title="Preview document"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.downloadUrl && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a
                href={row.original.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Download document"
              >
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            disabled={deletingId === row.original.id}
            onClick={() => handleDelete(row.original.id)}
            title="Delete document"
          >
            {deletingId === row.original.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Centralized document library for disclosures and compliance files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleUpload}
            className="hidden"
            id="document-upload"
          />
          <Button
            className="gap-2"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DataTable
        columns={columns}
        data={documents}
        searchKey="fileName"
        searchPlaceholder="Search documents..."
        pageSize={10}
      />

      {viewingDoc && (
        <DocumentViewer
          documentId={viewingDoc.id}
          fileName={viewingDoc.fileName}
          open={!!viewingDoc}
          onOpenChange={(open) => {
            if (!open) setViewingDoc(null);
          }}
        />
      )}
    </div>
  );
}
