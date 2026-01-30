"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, FileText } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-renderer";

interface DocumentViewerProps {
  documentId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ContentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; type: "pdf"; url: string }
  | { status: "loaded"; type: "text" | "markdown"; content: string }
  | { status: "loaded"; type: "html"; content: string };

export function DocumentViewer({
  documentId,
  fileName,
  open,
  onOpenChange,
}: DocumentViewerProps) {
  const [state, setState] = useState<ContentState>({ status: "idle" });

  const fetchContent = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/documents/${documentId}/content`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load");
      }
      const data = await res.json();
      if (data.type === "pdf") {
        setState({ status: "loaded", type: "pdf", url: data.url });
      } else {
        setState({
          status: "loaded",
          type: data.type,
          content: data.content,
        });
      }
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to load",
      });
    }
  }, [documentId]);

  // Fetch content when the dialog opens (including initial mount with open=true)
  useEffect(() => {
    if (open) {
      fetchContent();
    } else {
      setState({ status: "idle" });
    }
  }, [open, fetchContent]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{fileName}</span>
          </DialogTitle>
          <DialogDescription>Document preview</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {state.status === "loading" && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {state.status === "error" && (
            <div className="text-center py-16">
              <p className="text-sm text-destructive">{state.message}</p>
            </div>
          )}

          {state.status === "loaded" && state.type === "pdf" && (
            <iframe
              src={state.url}
              className="w-full h-[65vh] rounded-md border"
              title={fileName}
            />
          )}

          {state.status === "loaded" && state.type === "html" && (
            <div
              className="docx-preview p-4 rounded-lg border bg-muted/30"
              dangerouslySetInnerHTML={{ __html: state.content }}
            />
          )}

          {state.status === "loaded" &&
            (state.type === "text" || state.type === "markdown") && (
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg border bg-muted/30">
                <MarkdownContent content={state.content} />
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
