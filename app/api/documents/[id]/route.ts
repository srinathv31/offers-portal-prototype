import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, offerDisclosures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFile } from "@/lib/supabase/storage";

export async function DELETE(
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

    // Delete from Supabase Storage
    const { error: deleteError } = await deleteFile(doc.storagePath);
    if (deleteError) {
      console.error("Storage delete error:", deleteError);
    }

    // Unlink from any offer disclosures (set documentId to null)
    await db
      .update(offerDisclosures)
      .set({ documentId: null })
      .where(eq(offerDisclosures.documentId, id));

    // Delete DB row
    await db.delete(documents).where(eq(documents.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
