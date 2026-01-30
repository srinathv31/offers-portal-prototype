import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { uploadFile, getSignedUrl } from "@/lib/supabase/storage";

export async function GET() {
  try {
    const allDocuments = await db.query.documents.findMany({
      with: {
        offerDisclosures: {
          with: {
            offer: true,
          },
        },
      },
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      allDocuments.map(async (doc) => {
        let downloadUrl: string | null = null;
        try {
          downloadUrl = await getSignedUrl(doc.storagePath);
        } catch {
          // ignore signing errors
        }
        return {
          ...doc,
          downloadUrl,
          linkedOffers: doc.offerDisclosures.map((od) => ({
            id: od.offer.id,
            name: od.offer.name,
          })),
        };
      })
    );

    return NextResponse.json(documentsWithUrls);
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Upload to Supabase Storage in documents/ folder
    const { path, error: uploadError } = await uploadFile(file, "documents");

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError}` },
        { status: 500 }
      );
    }

    // Insert documents row
    const [doc] = await db
      .insert(documents)
      .values({
        fileName: file.name,
        storagePath: path,
        mimeType: file.type,
        fileSize: file.size,
      })
      .returning();

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
