import React from "react";

/**
 * Simple markdown renderer for disclosure / document content.
 * Handles headers, bold, lists, and horizontal rules.
 */
export function MarkdownContent({ content }: { content: string }) {
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

export function processInline(text: string): React.ReactNode {
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
