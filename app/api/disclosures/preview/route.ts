import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { downloadFileAsBuffer } from "@/lib/supabase/storage";
import { extractTextFromFile } from "@/lib/supabase/extract-text";
import {
  generateCampaignDisclosure,
  type OfferDisclosureInput,
} from "@/lib/ai/disclosure";

interface OfferWithDisclosures {
  id: string;
  name: string;
  type: string;
  vendor: string | null;
  disclosures: Array<{
    id: string;
    storagePath: string;
    mimeType: string;
    fileName: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignName, offerIds } = body;

    if (!campaignName || !offerIds || !Array.isArray(offerIds)) {
      return NextResponse.json(
        { error: "campaignName and offerIds are required" },
        { status: 400 }
      );
    }

    if (offerIds.length === 0) {
      return NextResponse.json(
        { error: "At least one offer ID is required" },
        { status: 400 }
      );
    }

    // Fetch offers with their disclosures
    const offersWithDisclosures = (await db.query.offers.findMany({
      where: inArray(offers.id, offerIds),
      with: {
        disclosures: true,
      },
    })) as OfferWithDisclosures[];

    // Separate offers with and without disclosures
    const offersIncluded: Array<{
      offerId: string;
      offerName: string;
      disclosureCount: number;
    }> = [];
    const offersWithoutDisclosures: Array<{
      offerId: string;
      offerName: string;
    }> = [];

    for (const offer of offersWithDisclosures) {
      if (offer.disclosures && offer.disclosures.length > 0) {
        offersIncluded.push({
          offerId: offer.id,
          offerName: offer.name,
          disclosureCount: offer.disclosures.length,
        });
      } else {
        offersWithoutDisclosures.push({
          offerId: offer.id,
          offerName: offer.name,
        });
      }
    }

    // If no offers have disclosures, return early with info
    if (offersIncluded.length === 0) {
      return NextResponse.json({
        content: null,
        offersIncluded: [],
        offersWithoutDisclosures,
        message: "No offers have disclosures attached",
      });
    }

    // Extract text from all disclosures
    const offerDisclosureInputs: OfferDisclosureInput[] = [];

    for (const offer of offersWithDisclosures) {
      if (!offer.disclosures || offer.disclosures.length === 0) continue;

      // Combine text from all disclosures for this offer
      const disclosureTexts: string[] = [];

      for (const disclosure of offer.disclosures) {
        try {
          const buffer = await downloadFileAsBuffer(disclosure.storagePath);
          const text = await extractTextFromFile(buffer, disclosure.mimeType);
          disclosureTexts.push(text);
        } catch (error) {
          console.error(
            `[Disclosure Preview] Failed to extract text from ${disclosure.fileName}:`,
            error
          );
          // Continue with other disclosures even if one fails
        }
      }

      if (disclosureTexts.length > 0) {
        offerDisclosureInputs.push({
          offerName: offer.name,
          offerType: offer.type,
          vendor: offer.vendor,
          disclosureText: disclosureTexts.join("\n\n---\n\n"),
        });
      }
    }

    // Generate combined disclosure using AI
    const content = await generateCampaignDisclosure(
      campaignName,
      offerDisclosureInputs
    );

    console.log(
      `[Disclosure Preview] Generated disclosure for "${campaignName}" with ${offersIncluded.length} offers`
    );

    return NextResponse.json({
      content,
      offersIncluded,
      offersWithoutDisclosures,
    });
  } catch (error) {
    console.error("[Disclosure Preview] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate disclosure preview" },
      { status: 500 }
    );
  }
}
