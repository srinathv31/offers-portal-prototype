import { NextRequest, NextResponse } from "next/server";
import { db, getDisclosuresForCampaignOffers } from "@/lib/db";
import { campaignDisclosures, campaigns } from "@/lib/db/schema";
import { downloadFileAsBuffer } from "@/lib/supabase/storage";
import { extractTextFromFile } from "@/lib/supabase/extract-text";
import {
  generateCampaignDisclosure,
  type OfferDisclosureInput,
} from "@/lib/ai/disclosure";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  try {
    // Validate campaign exists
    const campaign = await db.query.campaigns.findFirst({
      where: (c, { eq }) => eq(c.id, campaignId),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get all offer disclosures for this campaign
    const offerData = await getDisclosuresForCampaignOffers(campaignId);

    if (offerData.length === 0) {
      return NextResponse.json(
        {
          error:
            "No offer disclosures found. Upload disclosure documents to offers first.",
        },
        { status: 400 }
      );
    }

    // Extract text from each disclosure file
    const disclosureInputs: OfferDisclosureInput[] = [];
    const sourceOfferIds: string[] = [];

    for (const item of offerData) {
      sourceOfferIds.push(item.offer.id);

      for (const disclosure of item.disclosures) {
        try {
          const buffer = await downloadFileAsBuffer(disclosure.storagePath);
          const text = await extractTextFromFile(buffer, disclosure.mimeType);

          disclosureInputs.push({
            offerName: item.offer.name,
            offerType: item.offer.type,
            vendor: item.offer.vendor,
            disclosureText: text,
          });
        } catch (err) {
          console.error(
            `Error extracting text from ${disclosure.fileName}:`,
            err
          );
          // Include a note about the failed extraction
          disclosureInputs.push({
            offerName: item.offer.name,
            offerType: item.offer.type,
            vendor: item.offer.vendor,
            disclosureText: `[Unable to extract text from ${disclosure.fileName}]`,
          });
        }
      }
    }

    // Generate combined disclosure via AI
    const content = await generateCampaignDisclosure(
      campaign.name,
      disclosureInputs
    );

    // Store in database
    const [disclosure] = await db
      .insert(campaignDisclosures)
      .values({
        campaignId,
        content,
        sourceOfferIds,
        generatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(disclosure, { status: 201 });
  } catch (error) {
    console.error("Error generating campaign disclosure:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
