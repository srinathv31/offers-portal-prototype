import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offerDisclosures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFile } from "@/lib/supabase/storage";

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
