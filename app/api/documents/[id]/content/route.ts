import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadFileAsBuffer, getSignedUrl } from "@/lib/supabase/storage";
import { extractTextFromFile, extractHtmlFromDocx } from "@/lib/supabase/extract-text";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const doc = await db.query.documents.findFirst({
      where: (d, { eq }) => eq(d.id, id),
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // For PDFs, return a signed URL for iframe rendering
    if (doc.mimeType === "application/pdf") {
      const signedUrl = await getSignedUrl(doc.storagePath);
      return NextResponse.json({
        type: "pdf",
        url: signedUrl,
        fileName: doc.fileName,
      });
    }

    // For DOCX files, convert to HTML to preserve formatting and images
    const DOCX_MIME =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (doc.mimeType === DOCX_MIME) {
      const buffer = await downloadFileAsBuffer(doc.storagePath);
      const html = await extractHtmlFromDocx(buffer);
      return NextResponse.json({
        type: "html",
        content: html,
        fileName: doc.fileName,
      });
    }

    // For text-based files, extract and return the content as markdown
    const buffer = await downloadFileAsBuffer(doc.storagePath);
    const text = await extractTextFromFile(buffer, doc.mimeType);

    return NextResponse.json({
      type: "markdown",
      content: text,
      fileName: doc.fileName,
    });
  } catch (error) {
    console.error("Error fetching document content:", error);
    return NextResponse.json(
      { error: "Failed to load document content" },
      { status: 500 }
    );
  }
}
