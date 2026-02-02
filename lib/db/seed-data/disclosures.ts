import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { db } from "../index";
import * as schema from "../schema";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const BUCKET = "disclosures";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Clear all existing files from the disclosures bucket before seeding.
 * Recursively lists and deletes files in all folders.
 */
async function clearDisclosureStorage(supabase: SupabaseClient) {
  console.log("Clearing existing disclosure files from storage...");

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000 });

  if (listError) {
    console.log(`⚠ Could not list storage files: ${listError.message}`);
    return;
  }

  if (!files || files.length === 0) {
    console.log("  No existing files to clear");
    return;
  }

  // Recursively list and delete files in folders (offers/, documents/)
  const allPaths: string[] = [];

  for (const item of files) {
    if (item.id === null) {
      // It's a folder - list contents
      const { data: folderFiles } = await supabase.storage
        .from(BUCKET)
        .list(item.name, { limit: 1000 });

      if (folderFiles) {
        for (const file of folderFiles) {
          if (file.id === null) {
            // Nested folder (e.g., offers/{offerId}/)
            const { data: nestedFiles } = await supabase.storage
              .from(BUCKET)
              .list(`${item.name}/${file.name}`, { limit: 1000 });
            if (nestedFiles) {
              allPaths.push(
                ...nestedFiles.map((f) => `${item.name}/${file.name}/${f.name}`)
              );
            }
          } else {
            allPaths.push(`${item.name}/${file.name}`);
          }
        }
      }
    } else {
      allPaths.push(item.name);
    }
  }

  if (allPaths.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove(allPaths);

    if (deleteError) {
      console.log(`⚠ Failed to delete files: ${deleteError.message}`);
    } else {
      console.log(`  ✓ Cleared ${allPaths.length} files from storage`);
    }
  }
}

/**
 * Structured disclosure content for 4 of the 8 seeded offers.
 * Each entry maps to an offer index in the seeded offers array.
 */
interface DisclosureSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface DisclosureSpec {
  offerIndex: number;
  docxFileName: string;
  title: string;
  effectiveDate: string;
  offerReference: string;
  sections: DisclosureSection[];
}

const disclosureSpecs: DisclosureSpec[] = [
  {
    offerIndex: 0,
    docxFileName: "amazon-3x-points-disclosure.docx",
    title: "OFFER DISCLOSURE: Amazon 3\u00D7 Points Multiplier",
    effectiveDate: "January 1, 2025",
    offerReference: "OFR-AMZ-3X-2025",
    sections: [
      {
        heading: "1. Earning Rate",
        paragraphs: [
          "Eligible cardholders earn 3\u00D7 bonus points per dollar spent on qualifying purchases made through Amazon.com and Amazon-affiliated properties. The base earning rate of 1\u00D7 point per dollar continues to apply; the bonus 2\u00D7 points are incremental and credited separately.",
        ],
      },
      {
        heading: "2. Qualifying Purchases",
        paragraphs: [
          "Purchases must be made directly on amazon.com or through the Amazon mobile application. The following are considered qualifying transactions:",
        ],
        bullets: [
          "Purchases of physical goods shipped and sold by Amazon.com or Amazon Marketplace sellers",
          "Digital content purchases including Kindle books, Amazon Music, and Prime Video rentals",
          "Amazon Fresh and Whole Foods Market orders placed through the Amazon platform",
          "Amazon Web Services charges billed to a personal account",
        ],
      },
      {
        heading: "3. Minimum Purchase Requirement",
        paragraphs: [
          "A minimum transaction amount of $25.00 is required for bonus point accrual. Transactions below this threshold earn only the standard base rate.",
        ],
      },
      {
        heading: "4. Point Expiration",
        paragraphs: [
          "Points earned under this offer expire 24 months from the date of accrual. Partial point balances are forfeited upon expiration. Cardholders will receive notification 60 days prior to any point expiration event.",
        ],
      },
      {
        heading: "5. Offer Period",
        paragraphs: [
          "This offer is valid for 90 days from the date of enrollment. The offer cannot be combined with other Amazon-specific bonus point promotions running concurrently.",
        ],
      },
      {
        heading: "6. Progress Tracking",
        paragraphs: [
          "Eligible spend toward the $1,000.00 target is tracked automatically. Progress updates are reflected in your account within 2-3 business days of a qualifying transaction posting.",
        ],
      },
      {
        heading: "7. General Terms",
        paragraphs: [
          "This offer is non-transferable and applies only to the enrolled cardholder's primary account. The issuer reserves the right to modify or terminate this offer with 30 days' written notice. Any disputes arising from this offer shall be governed by the terms of your cardholder agreement.",
        ],
      },
    ],
  },
  {
    offerIndex: 1,
    docxFileName: "target-5pct-weekend-cashback-disclosure.docx",
    title: "OFFER DISCLOSURE: Target 5% Weekend Cashback",
    effectiveDate: "January 1, 2025",
    offerReference: "OFR-TGT-5PCT-WKD-2025",
    sections: [
      {
        heading: "1. Cashback Rate",
        paragraphs: [
          "Enrolled cardholders earn 5% cashback on qualifying purchases made at Target Corporation retail locations and target.com during designated weekend periods. Cashback is calculated on the net purchase amount after returns, refunds, and adjustments.",
        ],
      },
      {
        heading: "2. Weekend Definition",
        paragraphs: [
          'For purposes of this offer, "weekend" is defined as transactions occurring between 12:00 AM local time on Saturday and 11:59 PM local time on Sunday. Transaction timing is determined by the merchant\'s point-of-sale timestamp, not the cardholder\'s local time zone.',
        ],
      },
      {
        heading: "3. Qualifying Merchants",
        paragraphs: [
          "This offer applies to purchases made at:",
        ],
        bullets: [
          "Target retail stores within the United States",
          "Target.com online purchases",
          "Target mobile app purchases",
          "Target-owned Shipt delivery orders",
        ],
      },
      {
        heading: "4. Maximum Cashback Cap",
        paragraphs: [
          "Total cashback earned under this offer is capped at $50.00 per enrollment period. Once the cap is reached, subsequent weekend purchases at Target earn the standard card rate. The cap resets only upon re-enrollment in a new offer period.",
        ],
      },
      {
        heading: "5. Cashback Redemption",
        paragraphs: [
          "Earned cashback is credited as a statement credit within one billing cycle following the qualifying transaction. Minimum redemption threshold: $1.00. Cashback amounts below the threshold are carried forward.",
        ],
      },
      {
        heading: "6. Exclusions",
        paragraphs: [
          "The following transactions do not qualify for the enhanced cashback rate:",
        ],
        bullets: [
          "Target gift card purchases",
          "Money order or prepaid card transactions",
          "Returned merchandise (cashback will be reversed)",
          "Target RedCard transactions (separate program applies)",
        ],
      },
      {
        heading: "7. Offer Duration",
        paragraphs: [
          "This offer is valid for 60 days from enrollment. The cumulative spending target for progress tracking is $500.00.",
        ],
      },
      {
        heading: "8. General Terms",
        paragraphs: [
          "This offer may not be combined with other Target-specific cashback promotions. Cashback is forfeited if the account is closed or in default status at the time of scheduled credit. The issuer reserves the right to recoup cashback awarded on transactions subsequently reversed or disputed.",
        ],
      },
    ],
  },
  {
    offerIndex: 4,
    docxFileName: "travel-miles-accelerator-disclosure.docx",
    title: "OFFER DISCLOSURE: Travel Miles Accelerator",
    effectiveDate: "January 1, 2025",
    offerReference: "OFR-TRV-5X-2025",
    sections: [
      {
        heading: "1. Earning Rate",
        paragraphs: [
          "Enrolled cardholders earn 5\u00D7 miles per dollar spent on qualifying travel purchases. Miles earned under this promotion are in addition to the standard earning rate and are credited to the cardholder's rewards account upon transaction posting.",
        ],
      },
      {
        heading: "2. Qualifying Travel Categories",
        paragraphs: [
          "The following merchant category codes (MCCs) qualify for the enhanced earning rate:",
        ],
        bullets: [
          "Airlines \u2014 Scheduled airlines, charter flights, and in-flight purchases (MCC 3000-3350, 4511)",
          "Hotels and Lodging \u2014 Hotels, motels, resorts, and timeshare properties (MCC 3501-3838, 7011)",
          "Car Rentals \u2014 Automobile rental agencies (MCC 3351-3500, 7512)",
          "Cruise Lines \u2014 Passenger cruise companies (MCC 4411)",
          "Travel Agencies \u2014 Online and brick-and-mortar travel booking services (MCC 4722)",
        ],
      },
      {
        heading: "3. Airline and Hotel Transfer Partners",
        paragraphs: [
          "Miles earned may be transferred to participating airline and hotel loyalty programs at the following ratios:",
        ],
        bullets: [
          "Airlines: 1:1 transfer ratio (Delta SkyMiles, United MileagePlus, American AAdvantage)",
          "Hotels: 1:1.5 transfer ratio (Marriott Bonvoy, Hilton Honors, IHG One Rewards)",
        ],
      },
      {
        heading: "4. Blackout Dates and Restrictions",
        paragraphs: [
          "Miles earned under this offer have no blackout dates when redeemed for statement credits toward travel purchases. However, when transferred to partner programs, partner-specific blackout dates and availability restrictions apply. The issuer has no control over partner program redemption policies.",
        ],
      },
      {
        heading: "5. Miles Expiration",
        paragraphs: [
          "Miles earned under this offer expire 36 months from accrual. Account activity (any qualifying purchase) extends the expiration of all existing miles by 12 months.",
        ],
      },
      {
        heading: "6. Progress Tracking",
        paragraphs: [
          "The offer tracks progress toward a $2,000.00 qualifying travel spend target over a 120-day enrollment period. Progress is updated within 2 business days of transaction posting.",
        ],
      },
      {
        heading: "7. Fraud Protection",
        paragraphs: [
          "Travel purchases are covered by the card's standard fraud protection and zero-liability policy. Cardholders should notify the issuer of international travel plans to avoid transaction blocks.",
        ],
      },
      {
        heading: "8. General Terms",
        paragraphs: [
          "This offer is non-transferable. Miles earned are not redeemable for cash except as statement credits at a rate of 1 mile = $0.01. The issuer may modify transfer partner availability with 60 days' notice. This offer cannot be combined with other travel category promotions.",
        ],
      },
    ],
  },
  {
    offerIndex: 5,
    docxFileName: "dining-cashback-disclosure.docx",
    title: "OFFER DISCLOSURE: Dining Cashback",
    effectiveDate: "January 1, 2025",
    offerReference: "OFR-DIN-3PCT-2025",
    sections: [
      {
        heading: "1. Cashback Rate",
        paragraphs: [
          "Enrolled cardholders earn 3% cashback on qualifying dining purchases. The cashback is calculated on the total transaction amount including tax and gratuity, provided the entire amount is processed as a single transaction.",
        ],
      },
      {
        heading: "2. Qualifying Dining Merchants",
        paragraphs: [
          "The enhanced cashback rate applies to transactions at merchants classified under the following Merchant Category Codes (MCCs):",
        ],
        bullets: [
          "Restaurants and Eating Places (MCC 5812) \u2014 Full-service restaurants, casual dining, and fine dining establishments",
          "Fast Food Restaurants (MCC 5814) \u2014 Quick-service restaurants, drive-through establishments, and counter-service locations",
          "Drinking Places and Bars (MCC 5813) \u2014 Bars, taverns, lounges, and nightclubs serving food",
          "Caterers (MCC 5811) \u2014 Catering services for events and private functions",
        ],
      },
      {
        heading: "3. Qualifying Merchant Examples",
        paragraphs: [
          "The following types of merchants typically qualify: sit-down restaurants, coffee shops (Starbucks, Dunkin', local cafes), fast food chains (McDonald's, Chipotle, Subway), food delivery platforms when the merchant of record is the restaurant, bakeries with dine-in service, and food trucks with card processing capabilities.",
        ],
      },
      {
        heading: "4. Non-Qualifying Transactions",
        paragraphs: [
          "The following do NOT qualify for the enhanced dining rate:",
        ],
        bullets: [
          "Grocery store purchases, even from deli or prepared food counters",
          "Convenience store food purchases",
          "Food delivery service fees where the merchant of record is the delivery platform (e.g., DoorDash, Uber Eats) rather than the restaurant",
          "Meal kit subscription services",
          "Vending machine purchases",
          "Airport lounge access fees",
        ],
      },
      {
        heading: "5. Maximum Cashback",
        paragraphs: [
          "Cashback under this offer is capped at $75.00 per calendar quarter. Once the cap is reached, dining purchases earn the standard card rate until the next quarter begins.",
        ],
      },
      {
        heading: "6. Cashback Credit",
        paragraphs: [
          "Cashback is accumulated monthly and credited to the cardholder's statement as a statement credit in the billing cycle following the month of accrual. There is no minimum redemption threshold.",
        ],
      },
      {
        heading: "7. Split Transactions",
        paragraphs: [
          "When a dining bill is split across multiple cards, only the portion charged to the enrolled card earns the enhanced rate. Group payments made through a single card earn the full enhanced rate on the total amount.",
        ],
      },
      {
        heading: "8. General Terms",
        paragraphs: [
          "This offer does not include progress tracking and has no spending target. Cashback is forfeited upon account closure or if the account enters default status. The issuer reserves the right to reclassify merchant categories, which may affect qualification. This offer cannot be combined with other dining-category promotions running concurrently.",
        ],
      },
    ],
  },
];

/**
 * Generate a branded .docx buffer for a disclosure spec.
 * Includes header with logo, footer with confidentiality notice, and structured body.
 */
async function generateDisclosureDocx(
  spec: DisclosureSpec
): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public", "branding", "logo.png");
  const logoBuffer = fs.readFileSync(logoPath);

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  };

  // Header with logo and company name
  const headerTable = new Table({
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 120, height: 36 },
                    type: "png",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 7000, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: "National Credit Card Services",
                    bold: true,
                    size: 22,
                    color: "1E3A5F",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const header = new Header({
    children: [headerTable],
  });

  // Footer with confidentiality notice
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `CONFIDENTIAL \u2014 ${spec.offerReference}`,
            size: 16,
            color: "888888",
            italics: true,
          }),
        ],
      }),
    ],
  });

  // Build body paragraphs
  const bodyChildren: Paragraph[] = [];

  // Title
  bodyChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: spec.title, bold: true }),
      ],
    })
  );

  // Meta info table
  bodyChildren.push(
    new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({ text: "Effective Date: ", bold: true }),
        new TextRun({ text: spec.effectiveDate }),
      ],
    })
  );
  bodyChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Issuer: ", bold: true }),
        new TextRun({ text: "National Credit Card Services" }),
      ],
    })
  );
  bodyChildren.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Offer Reference: ", bold: true }),
        new TextRun({ text: spec.offerReference }),
      ],
    })
  );

  // Horizontal rule (thin border paragraph)
  bodyChildren.push(
    new Paragraph({
      spacing: { before: 100, after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
      },
      children: [],
    })
  );

  // Sections
  for (const section of spec.sections) {
    bodyChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240 },
        children: [
          new TextRun({ text: section.heading, bold: true }),
        ],
      })
    );

    for (const para of section.paragraphs) {
      bodyChildren.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: para })],
        })
      );
    }

    if (section.bullets) {
      for (const bullet of section.bullets) {
        bodyChildren.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: bullet })],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        headers: { default: header },
        footers: { default: footer },
        children: bodyChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/**
 * Standalone library documents not linked to any specific offer.
 * These remain as markdown files.
 */
const standaloneDocuments: {
  fileName: string;
  content: string;
  description: string;
}[] = [
  {
    fileName: "general-terms-and-conditions.md",
    description: "General cardholder terms and conditions",
    content: `# General Terms & Conditions

**Issuer:** National Credit Card Services
**Last Updated:** January 2025
**Document Version:** 4.2

---

## 1. Account Agreement

By activating or using your credit card, you agree to be bound by these Terms & Conditions, the Cardholder Agreement, and any amendments thereto. This document governs all credit card offers, promotions, and reward programs administered by National Credit Card Services.

## 2. Offer Eligibility

- All offers are subject to **account good standing** requirements
- Cardholders must have an active, non-delinquent account to participate
- Offers are non-transferable unless explicitly stated otherwise
- The issuer reserves the right to limit offer participation based on account history and risk assessment

## 3. Reward Accrual

- Points, miles, and cashback are collectively referred to as **"Rewards"**
- Rewards are earned on net purchases only (after returns, adjustments, and credits)
- Rewards do not accrue on cash advances, balance transfers, fees, or interest charges
- The issuer may delay reward posting pending transaction settlement

## 4. Reward Redemption

- Minimum redemption thresholds apply as specified in individual offer terms
- Rewards have **no cash value** except when redeemed as statement credits
- Statement credits are applied to the current billing cycle balance
- Unredeemed rewards are forfeited upon account closure

## 5. Offer Modifications

The issuer reserves the right to:

- Modify reward rates with **30 days' prior notice**
- Discontinue offers at the end of the current enrollment period
- Adjust merchant category classifications used for reward qualification
- Impose or modify spending caps on individual offers

## 6. Dispute Resolution

All disputes arising from offer participation shall be resolved through binding arbitration in accordance with the Cardholder Agreement. Class action waivers apply as specified in Section 14 of the Cardholder Agreement.

## 7. Privacy and Data Use

Offer participation data, including transaction history and reward accrual, is subject to our Privacy Policy. Data may be used to personalize future offer recommendations and improve service quality.

---

**Contact:** For questions regarding these terms, call 1-800-555-CARD or visit our secure messaging portal at account.nationalccs.com/support.`,
  },
  {
    fileName: "compliance-guidelines-2025.md",
    description: "Annual compliance and regulatory guidelines",
    content: `# Compliance Guidelines 2025

**Department:** Regulatory Compliance
**Effective:** January 1, 2025
**Review Cycle:** Annual

---

## 1. Regulatory Framework

All credit card offers and promotions must comply with the following regulatory requirements:

- **Truth in Lending Act (TILA)** \u2014 Regulation Z disclosure requirements
- **Electronic Fund Transfer Act (EFTA)** \u2014 Regulation E for electronic transactions
- **Fair Credit Reporting Act (FCRA)** \u2014 Credit reporting and data accuracy
- **CAN-SPAM Act** \u2014 Marketing communications and opt-out requirements
- **Gramm-Leach-Bliley Act (GLBA)** \u2014 Financial privacy protections

## 2. Disclosure Requirements

### 2.1 Pre-Enrollment Disclosures

Before enrollment, cardholders must receive:

- Clear statement of **reward rates** and earning mechanics
- All **exclusions and limitations** including spending caps
- **Expiration terms** for earned rewards
- Link to full terms and conditions

### 2.2 Post-Enrollment Confirmations

After enrollment, cardholders must receive:

- Confirmation of enrollment with offer summary
- Start and end dates of the offer period
- Instructions for tracking progress (if applicable)
- Contact information for questions or opt-out

## 3. Marketing Standards

- All marketing materials must include the **APR disclosure** footer
- Promotional rates must be presented with equal prominence to standard rates
- Reward examples must use **representative scenarios**, not best-case outcomes
- Pre-approved offer language must comply with FCRA safe harbor provisions

## 4. Data Handling

- Transaction data used for offer qualification must be encrypted in transit and at rest
- Reward accrual calculations must be auditable with a complete transaction trail
- Cardholder opt-out preferences must be honored within **10 business days**
- Data retention for offer-related records: **7 years** from offer expiration

## 5. Internal Controls

- All new offers require **Compliance review** before deployment
- Offer terms must be reviewed by Legal within **5 business days** of submission
- Quarterly audits of active offers for regulatory compliance
- Annual training for all staff involved in offer creation and management

---

**Compliance Contact:** compliance@nationalccs.com | Internal Ext: 4500`,
  },
  {
    fileName: "reward-program-overview.md",
    description: "Overview of reward program tiers and structure",
    content: `# Reward Program Overview

**Program:** National Rewards+
**Version:** 2025.1

---

## 1. Program Tiers

### Standard Tier
- Base earning rate: **1\u00D7 point per dollar**
- No annual fee
- Points expire after **12 months** of account inactivity

### Gold Tier
- Base earning rate: **1.5\u00D7 points per dollar**
- Annual fee: **$95**
- Points expire after **24 months** of account inactivity
- Access to **quarterly bonus categories** (rotating)

### Platinum Tier
- Base earning rate: **2\u00D7 points per dollar**
- Annual fee: **$195**
- Points **never expire** while account is active
- Priority access to **limited-time offers**
- Complimentary airport lounge access (2 visits/year)

### Diamond Tier
- Base earning rate: **3\u00D7 points per dollar**
- Annual fee: **$495**
- Points **never expire** while account is active
- First access to all new offers and promotions
- Dedicated concierge service
- Complimentary airport lounge access (unlimited)

## 2. Point Valuation

- **Statement credits:** 1 point = $0.01
- **Travel redemption:** 1 point = $0.015
- **Partner transfers:** Varies by partner (1:1 to 1:2 ratio)
- **Merchandise:** 1 point = $0.008

## 3. Bonus Offer Stacking

- Cardholders may participate in **up to 5 active offers** simultaneously
- Category-specific offers stack with the base earning rate
- Promotional bonus points are earned **in addition to** base points
- Spending caps apply independently per offer

---

**Enrollment:** Visit rewards.nationalccs.com or call 1-800-555-RWRD`,
  },
];

/**
 * Seed disclosure documents for 4 of the 8 offers.
 * Uploads branded .docx files to Supabase Storage and inserts offerDisclosures + documents rows.
 * Standalone library documents remain as .md.
 */
export async function seedDisclosures(
  offers: { id: string; name: string }[]
) {
  console.log("Creating disclosure documents...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(
      "\u26A0 Skipping disclosures \u2014 NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY not set"
    );
    return { disclosures: [], documents: [] };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Clear existing files before uploading new ones
  await clearDisclosureStorage(supabase);

  const createdDisclosures: (typeof schema.offerDisclosures.$inferInsert)[] = [];
  const createdDocuments: (typeof schema.documents.$inferInsert)[] = [];

  // Seed offer-linked disclosures as .docx
  for (const spec of disclosureSpecs) {
    const offer = offers[spec.offerIndex];
    if (!offer) {
      console.log(`\u26A0 Offer at index ${spec.offerIndex} not found, skipping`);
      continue;
    }

    const docxBuffer = await generateDisclosureDocx(spec);
    const docxUint8 = new Uint8Array(docxBuffer);
    const docxBlob = new Blob([docxUint8], { type: DOCX_MIME });

    // Upload to offers/{offerId}/ folder
    const offerFolder = `offers/${offer.id}`;
    const offerStoragePath = `${offerFolder}/${crypto.randomUUID()}-${spec.docxFileName}`;

    const { error: offerUploadError } = await supabase.storage
      .from(BUCKET)
      .upload(offerStoragePath, docxBlob, { contentType: DOCX_MIME });

    if (offerUploadError) {
      console.log(
        `\u26A0 Failed to upload disclosure for "${offer.name}": ${offerUploadError.message}`
      );
      continue;
    }

    // Upload to documents/ folder
    const docStoragePath = `documents/${crypto.randomUUID()}-${spec.docxFileName}`;
    const docBlob = new Blob([docxUint8], { type: DOCX_MIME });

    const { error: docUploadError } = await supabase.storage
      .from(BUCKET)
      .upload(docStoragePath, docBlob, { contentType: DOCX_MIME });

    let documentId: string | null = null;
    if (!docUploadError) {
      const [docRow] = await db
        .insert(schema.documents)
        .values({
          fileName: spec.docxFileName,
          storagePath: docStoragePath,
          mimeType: DOCX_MIME,
          fileSize: docxBuffer.length,
        })
        .returning();
      documentId = docRow.id;
      createdDocuments.push(docRow);
    }

    const [row] = await db
      .insert(schema.offerDisclosures)
      .values({
        offerId: offer.id,
        fileName: spec.docxFileName,
        storagePath: offerStoragePath,
        mimeType: DOCX_MIME,
        fileSize: docxBuffer.length,
        documentId,
      })
      .returning();

    createdDisclosures.push(row);
    console.log(`  \u2713 ${offer.name} \u2192 ${spec.docxFileName}`);
  }

  // Seed standalone library documents (remain as .md)
  for (const doc of standaloneDocuments) {
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const storagePath = `documents/${crypto.randomUUID()}-${doc.fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: "text/markdown" });

    if (uploadError) {
      console.log(
        `\u26A0 Failed to upload standalone doc "${doc.fileName}": ${uploadError.message}`
      );
      continue;
    }

    const [docRow] = await db
      .insert(schema.documents)
      .values({
        fileName: doc.fileName,
        storagePath,
        mimeType: "text/markdown",
        fileSize: blob.size,
        description: doc.description,
      })
      .returning();

    createdDocuments.push(docRow);
    console.log(`  \u2713 Library: ${doc.fileName}`);
  }

  console.log(
    `\u2713 Created ${createdDisclosures.length} offer disclosures and ${createdDocuments.length} library documents`
  );
  return { disclosures: createdDisclosures, documents: createdDocuments };
}
