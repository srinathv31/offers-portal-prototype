"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, FileText } from "lucide-react";

interface DisclosureViewerProps {
  offerId: string;
  disclosureId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ContentState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; type: "pdf"; url: string }
  | { status: "loaded"; type: "text" | "markdown"; content: string };

export function DisclosureViewer({
  offerId,
  disclosureId,
  fileName,
  open,
  onOpenChange,
}: DisclosureViewerProps) {
  const [state, setState] = useState<ContentState>({ status: "idle" });

  const fetchContent = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch(
        `/api/offers/${offerId}/disclosures/${disclosureId}`
      );
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
  }, [offerId, disclosureId]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      fetchContent();
    } else {
      setState({ status: "idle" });
    }
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
          <DialogDescription>Disclosure document preview</DialogDescription>
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

          {state.status === "loaded" &&
            (state.type === "text" || state.type === "markdown") && (
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg border bg-muted/30">
                <TextContent
                  content={state.content}
                  isMarkdown={state.type === "markdown"}
                />
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextContent({
  content,
  isMarkdown,
}: {
  content: string;
  isMarkdown: boolean;
}) {
  if (!isMarkdown) {
    return (
      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
        {content}
      </pre>
    );
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-xl font-bold mt-4 mb-2">
          {processInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-lg font-semibold mt-4 mb-2">
          {processInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-base font-semibold mt-3 mb-1">
          {processInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={key++} className="my-4 border-border" />);
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={key++} className="ml-4 list-disc text-sm">
          {processInline(line.slice(2))}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<br key={key++} />);
    } else {
      elements.push(
        <p key={key++} className="text-sm leading-relaxed">
          {processInline(line)}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

function processInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
