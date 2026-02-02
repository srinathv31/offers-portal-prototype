import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offerDisclosures } from "@/lib/db/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: offerId } = await params;

  try {
    // Validate offer exists
    const offer = await db.query.offers.findFirst({
      where: (o, { eq }) => eq(o.id, offerId),
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    // Validate document exists
    const doc = await db.query.documents.findFirst({
      where: (d, { eq }) => eq(d.id, documentId),
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Create offerDisclosure row linking to the document
    const [disclosure] = await db
      .insert(offerDisclosures)
      .values({
        offerId,
        fileName: doc.fileName,
        storagePath: doc.storagePath,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        documentId: doc.id,
      })
      .returning();

    return NextResponse.json(disclosure, { status: 201 });
  } catch (error) {
    console.error("Error linking document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
