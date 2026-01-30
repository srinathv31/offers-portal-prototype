import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offerDisclosures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFile, downloadFileAsBuffer, getSignedUrl } from "@/lib/supabase/storage";
import { extractTextFromFile, extractHtmlFromDocx } from "@/lib/supabase/extract-text";

export async function GET(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; disclosureId: string }> }
) {
  const { id: offerId, disclosureId } = await params;

  try {
    const disclosure = await db.query.offerDisclosures.findFirst({
      where: (d, { eq, and }) =>
        and(eq(d.id, disclosureId), eq(d.offerId, offerId)),
    });

    if (!disclosure) {
      return NextResponse.json(
        { error: "Disclosure not found" },
        { status: 404 }
      );
    }

    // For PDFs, return a signed URL so the browser can render it in an iframe
    if (disclosure.mimeType === "application/pdf") {
      const signedUrl = await getSignedUrl(disclosure.storagePath);
      return NextResponse.json({
        type: "pdf",
        url: signedUrl,
        fileName: disclosure.fileName,
      });
    }

    // For DOCX files, convert to HTML to preserve formatting and images
    const DOCX_MIME =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (disclosure.mimeType === DOCX_MIME) {
      const buffer = await downloadFileAsBuffer(disclosure.storagePath);
      const html = await extractHtmlFromDocx(buffer);
      return NextResponse.json({
        type: "html",
        content: html,
        fileName: disclosure.fileName,
      });
    }

    // For text-based files, extract and return the content
    const buffer = await downloadFileAsBuffer(disclosure.storagePath);
    const text = await extractTextFromFile(buffer, disclosure.mimeType);

    return NextResponse.json({
      type: "markdown",
      content: text,
      fileName: disclosure.fileName,
    });
  } catch (error) {
    console.error("Error fetching disclosure content:", error);
    return NextResponse.json(
      { error: "Failed to load disclosure content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; disclosureId: string }> }
) {
  const { id: offerId, disclosureId } = await params;

  try {
    // Find the disclosure
    const disclosure = await db.query.offerDisclosures.findFirst({
      where: (d, { eq, and }) =>
        and(eq(d.id, disclosureId), eq(d.offerId, offerId)),
    });

    if (!disclosure) {
      return NextResponse.json(
        { error: "Disclosure not found" },
        { status: 404 }
      );
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await deleteFile(disclosure.storagePath);
    if (deleteError) {
      console.error("Storage delete error:", deleteError);
      // Continue to delete DB row even if storage delete fails
    }

    // Delete DB row
    await db
      .delete(offerDisclosures)
      .where(eq(offerDisclosures.id, disclosureId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting disclosure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
