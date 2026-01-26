import { generateText } from "ai";
import { getAIModel, getProviderName } from "./config";

export interface OfferDisclosureInput {
  offerName: string;
  offerType: string;
  vendor: string | null;
  disclosureText: string;
}

function generateMockDisclosure(
  campaignName: string,
  offerDisclosures: OfferDisclosureInput[]
): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let content = `# Campaign Disclosure: ${campaignName}\n\n`;
  content += `**Effective Date:** ${today}\n\n`;
  content += `**Document Type:** Combined Campaign Disclosure\n\n`;
  content += `---\n\n`;
  content += `## General Terms\n\n`;
  content += `This document consolidates all individual offer disclosures associated with the **${campaignName}** campaign. `;
  content += `By participating in this campaign, cardholders agree to the terms outlined below for each applicable offer. `;
  content += `All offers are subject to eligibility requirements and may be modified or terminated at the issuer's discretion.\n\n`;
  content += `---\n\n`;

  for (let i = 0; i < offerDisclosures.length; i++) {
    const d = offerDisclosures[i];
    content += `## ${i + 1}. ${d.offerName}\n\n`;
    content += `**Offer Type:** ${d.offerType.replace(/_/g, " ")}`;
    if (d.vendor) {
      content += ` | **Vendor:** ${d.vendor}`;
    }
    content += `\n\n`;
    content += `${d.disclosureText}\n\n`;
    if (i < offerDisclosures.length - 1) {
      content += `---\n\n`;
    }
  }

  content += `\n---\n\n`;
  content += `## Important Notices\n\n`;
  content += `- All offers are subject to credit approval and account eligibility.\n`;
  content += `- Rewards earned under this campaign are subject to the terms of the applicable rewards program.\n`;
  content += `- The issuer reserves the right to modify, suspend, or cancel any offer at any time.\n`;
  content += `- For questions regarding these disclosures, contact customer service at 1-800-XXX-XXXX.\n`;

  return content;
}

export async function generateCampaignDisclosure(
  campaignName: string,
  offerDisclosures: OfferDisclosureInput[]
): Promise<string> {
  if (process.env.AI_MOCK === "true") {
    console.log("[AI Disclosure] Using MOCK mode");
    return generateMockDisclosure(campaignName, offerDisclosures);
  }

  const model = getAIModel();
  const providerName = getProviderName();

  console.log(`[AI Disclosure] Using provider: ${providerName}`);

  const offerSections = offerDisclosures
    .map(
      (d, i) =>
        `### Offer ${i + 1}: ${d.offerName}
Type: ${d.offerType}
Vendor: ${d.vendor || "N/A"}
Disclosure Text:
${d.disclosureText}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are a financial compliance specialist. Combine the following individual offer disclosure documents into a single, coherent campaign disclosure document for the "${campaignName}" campaign.

**Requirements:**
- Include a header with the campaign name and today's effective date
- Write a brief general terms section that applies to all offers
- Include each offer's disclosure as a numbered section
- Maintain all legal language from the original disclosures
- Add standard important notices at the end
- Output in Markdown format
- Be thorough but concise

**Individual Offer Disclosures:**

${offerSections}

Generate the combined campaign disclosure document in Markdown format.`;

  try {
    const result = await generateText({
      model,
      prompt,
      temperature: 0.3,
    });

    console.log(
      `[AI Disclosure] Successfully generated disclosure using ${providerName}`
    );
    return result.text;
  } catch (error) {
    console.error(
      `[AI Disclosure] Error generating disclosure with ${providerName}:`,
      error
    );
    throw new Error(`Failed to generate campaign disclosure: ${error}`);
  }
}
