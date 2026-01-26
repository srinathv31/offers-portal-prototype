import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offerDisclosures, offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadFile, getSignedUrl } from "@/lib/supabase/storage";

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, DOCX, TXT, MD" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const { path, error: uploadError } = await uploadFile(
      file,
      `offers/${offerId}`
    );

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError}` },
        { status: 500 }
      );
    }

    // Insert metadata row
    const [disclosure] = await db
      .insert(offerDisclosures)
      .values({
        offerId,
        fileName: file.name,
        storagePath: path,
        mimeType: file.type,
        fileSize: file.size,
      })
      .returning();

    return NextResponse.json(disclosure, { status: 201 });
  } catch (error) {
    console.error("Error uploading disclosure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
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

    const disclosures = await db.query.offerDisclosures.findMany({
      where: (d, { eq }) => eq(d.offerId, offerId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });

    // Generate signed URLs for each disclosure
    const disclosuresWithUrls = await Promise.all(
      disclosures.map(async (d) => {
        try {
          const downloadUrl = await getSignedUrl(d.storagePath);
          return { ...d, downloadUrl };
        } catch {
          return { ...d, downloadUrl: null };
        }
      })
    );

    return NextResponse.json(disclosuresWithUrls);
  } catch (error) {
    console.error("Error listing disclosures:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
