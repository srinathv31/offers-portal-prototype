"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Download, Loader2, Eye } from "lucide-react";
import { format } from "date-fns";
import { DisclosureViewer } from "@/components/disclosure-viewer";

interface Disclosure {
  id: string;
  offerId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  downloadUrl?: string | null;
}

interface DisclosureUploadProps {
  offerId: string;
  initialDisclosures: Disclosure[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const mimeTypeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
  "text/markdown": "MD",
};

export function DisclosureUpload({
  offerId,
  initialDisclosures,
}: DisclosureUploadProps) {
  const [disclosures, setDisclosures] =
    useState<Disclosure[]>(initialDisclosures);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewingDisclosure, setViewingDisclosure] = useState<Disclosure | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/offers/${offerId}/disclosures`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Refresh the list with signed URLs
      const listRes = await fetch(`/api/offers/${offerId}/disclosures`);
      if (listRes.ok) {
        const updated = await listRes.json();
        setDisclosures(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete(disclosureId: string) {
    setDeletingId(disclosureId);
    setError(null);

    try {
      const res = await fetch(
        `/api/offers/${offerId}/disclosures/${disclosureId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setDisclosures((prev) => prev.filter((d) => d.id !== disclosureId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleUpload}
          className="hidden"
          id="disclosure-upload"
        />
        <Button
          variant="outline"
          size="sm"
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
        <span className="text-xs text-muted-foreground">
          PDF, DOCX, TXT, or MD
        </span>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Disclosure list */}
      {disclosures.length > 0 ? (
        <div className="space-y-2">
          {disclosures.map((disclosure) => (
            <div
              key={disclosure.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {disclosure.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mimeTypeLabels[disclosure.mimeType] || disclosure.mimeType}{" "}
                    &middot; {formatFileSize(disclosure.fileSize)} &middot;{" "}
                    {format(new Date(disclosure.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewingDisclosure(disclosure)}
                  title="View document"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {disclosure.downloadUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={disclosure.downloadUrl}
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
                  disabled={deletingId === disclosure.id}
                  onClick={() => handleDelete(disclosure.id)}
                >
                  {deletingId === disclosure.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No disclosure documents uploaded yet
        </p>
      )}

      {viewingDisclosure && (
        <DisclosureViewer
          offerId={offerId}
          disclosureId={viewingDisclosure.id}
          fileName={viewingDisclosure.fileName}
          open={!!viewingDisclosure}
          onOpenChange={(open) => {
            if (!open) setViewingDisclosure(null);
          }}
        />
      )}
    </div>
  );
}
