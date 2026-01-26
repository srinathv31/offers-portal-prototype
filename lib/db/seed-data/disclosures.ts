import { createClient } from "@supabase/supabase-js";
import { db } from "../index";
import * as schema from "../schema";

const BUCKET = "disclosures";

/**
 * Disclosure text content for 4 of the 8 seeded offers.
 * Each entry maps to an offer index in the seeded offers array.
 */
const disclosureFiles: {
  offerIndex: number;
  fileName: string;
  content: string;
}[] = [
  {
    offerIndex: 0, // Amazon 3× Points
    fileName: "amazon-3x-points-disclosure.txt",
    content: `OFFER DISCLOSURE: Amazon 3× Points Multiplier

Effective Date: January 1, 2025
Issuer: National Credit Card Services
Offer Reference: OFR-AMZ-3X-2025

1. EARNING RATE
Eligible cardholders earn 3× bonus points per dollar spent on qualifying purchases made through Amazon.com and Amazon-affiliated properties. The base earning rate of 1× point per dollar continues to apply; the bonus 2× points are incremental and credited separately.

2. QUALIFYING PURCHASES
Purchases must be made directly on amazon.com or through the Amazon mobile application. The following are considered qualifying transactions:
  (a) Purchases of physical goods shipped and sold by Amazon.com or Amazon Marketplace sellers
  (b) Digital content purchases including Kindle books, Amazon Music, and Prime Video rentals
  (c) Amazon Fresh and Whole Foods Market orders placed through the Amazon platform
  (d) Amazon Web Services charges billed to a personal account

The following are NOT qualifying purchases: Amazon gift card purchases, Amazon Pay transactions on third-party websites, subscription renewals for non-Amazon services, and purchases made through Amazon affiliate links on external websites.

3. MINIMUM PURCHASE REQUIREMENT
A minimum transaction amount of $25.00 is required for bonus point accrual. Transactions below this threshold earn only the standard base rate.

4. POINT EXPIRATION
Points earned under this offer expire 24 months from the date of accrual. Partial point balances are forfeited upon expiration. Cardholders will receive notification 60 days prior to any point expiration event.

5. OFFER PERIOD
This offer is valid for 90 days from the date of enrollment. The offer cannot be combined with other Amazon-specific bonus point promotions running concurrently.

6. PROGRESS TRACKING
Eligible spend toward the $1,000.00 target is tracked automatically. Progress updates are reflected in your account within 2-3 business days of a qualifying transaction posting.

7. GENERAL TERMS
This offer is non-transferable and applies only to the enrolled cardholder's primary account. The issuer reserves the right to modify or terminate this offer with 30 days' written notice. Any disputes arising from this offer shall be governed by the terms of your cardholder agreement.`,
  },
  {
    offerIndex: 1, // Target 5% Weekend
    fileName: "target-5pct-weekend-cashback-disclosure.txt",
    content: `OFFER DISCLOSURE: Target 5% Weekend Cashback

Effective Date: January 1, 2025
Issuer: National Credit Card Services
Offer Reference: OFR-TGT-5PCT-WKD-2025

1. CASHBACK RATE
Enrolled cardholders earn 5% cashback on qualifying purchases made at Target Corporation retail locations and target.com during designated weekend periods. Cashback is calculated on the net purchase amount after returns, refunds, and adjustments.

2. WEEKEND DEFINITION
For purposes of this offer, "weekend" is defined as transactions occurring between 12:00 AM local time on Saturday and 11:59 PM local time on Sunday. Transaction timing is determined by the merchant's point-of-sale timestamp, not the cardholder's local time zone.

3. QUALIFYING MERCHANTS
This offer applies to purchases made at:
  (a) Target retail stores within the United States
  (b) Target.com online purchases
  (c) Target mobile app purchases
  (d) Target-owned Shipt delivery orders

Purchases at CVS Pharmacy locations within Target stores qualify only if processed through the Target register system. Standalone CVS locations do not qualify.

4. MAXIMUM CASHBACK CAP
Total cashback earned under this offer is capped at $50.00 per enrollment period. Once the cap is reached, subsequent weekend purchases at Target earn the standard card rate. The cap resets only upon re-enrollment in a new offer period.

5. CASHBACK REDEMPTION
Earned cashback is credited as a statement credit within one billing cycle following the qualifying transaction. Minimum redemption threshold: $1.00. Cashback amounts below the threshold are carried forward.

6. EXCLUSIONS
The following transactions do not qualify for the enhanced cashback rate:
  - Target gift card purchases
  - Money order or prepaid card transactions
  - Returned merchandise (cashback will be reversed)
  - Target RedCard transactions (separate program applies)

7. OFFER DURATION
This offer is valid for 60 days from enrollment. The cumulative spending target for progress tracking is $500.00.

8. GENERAL TERMS
This offer may not be combined with other Target-specific cashback promotions. Cashback is forfeited if the account is closed or in default status at the time of scheduled credit. The issuer reserves the right to recoup cashback awarded on transactions subsequently reversed or disputed.`,
  },
  {
    offerIndex: 4, // Travel Miles Accelerator
    fileName: "travel-miles-accelerator-disclosure.txt",
    content: `OFFER DISCLOSURE: Travel Miles Accelerator

Effective Date: January 1, 2025
Issuer: National Credit Card Services
Offer Reference: OFR-TRV-5X-2025

1. EARNING RATE
Enrolled cardholders earn 5× miles per dollar spent on qualifying travel purchases. Miles earned under this promotion are in addition to the standard earning rate and are credited to the cardholder's rewards account upon transaction posting.

2. QUALIFYING TRAVEL CATEGORIES
The following merchant category codes (MCCs) qualify for the enhanced earning rate:
  (a) Airlines — Scheduled airlines, charter flights, and in-flight purchases (MCC 3000-3350, 4511)
  (b) Hotels and Lodging — Hotels, motels, resorts, and timeshare properties (MCC 3501-3838, 7011)
  (c) Car Rentals — Automobile rental agencies (MCC 3351-3500, 7512)
  (d) Cruise Lines — Passenger cruise companies (MCC 4411)
  (e) Travel Agencies — Online and brick-and-mortar travel booking services (MCC 4722)

3. AIRLINE AND HOTEL TRANSFER PARTNERS
Miles earned may be transferred to participating airline and hotel loyalty programs at the following ratios:
  - Airlines: 1:1 transfer ratio (Delta SkyMiles, United MileagePlus, American AAdvantage)
  - Hotels: 1:1.5 transfer ratio (Marriott Bonvoy, Hilton Honors, IHG One Rewards)
Transfer requests are processed within 3-5 business days.

4. BLACKOUT DATES AND RESTRICTIONS
Miles earned under this offer have no blackout dates when redeemed for statement credits toward travel purchases. However, when transferred to partner programs, partner-specific blackout dates and availability restrictions apply. The issuer has no control over partner program redemption policies.

5. MILES EXPIRATION
Miles earned under this offer expire 36 months from accrual. Account activity (any qualifying purchase) extends the expiration of all existing miles by 12 months.

6. PROGRESS TRACKING
The offer tracks progress toward a $2,000.00 qualifying travel spend target over a 120-day enrollment period. Progress is updated within 2 business days of transaction posting.

7. FRAUD PROTECTION
Travel purchases are covered by the card's standard fraud protection and zero-liability policy. Cardholders should notify the issuer of international travel plans to avoid transaction blocks.

8. GENERAL TERMS
This offer is non-transferable. Miles earned are not redeemable for cash except as statement credits at a rate of 1 mile = $0.01. The issuer may modify transfer partner availability with 60 days' notice. This offer cannot be combined with other travel category promotions.`,
  },
  {
    offerIndex: 5, // Dining Cashback
    fileName: "dining-cashback-disclosure.txt",
    content: `OFFER DISCLOSURE: Dining Cashback

Effective Date: January 1, 2025
Issuer: National Credit Card Services
Offer Reference: OFR-DIN-3PCT-2025

1. CASHBACK RATE
Enrolled cardholders earn 3% cashback on qualifying dining purchases. The cashback is calculated on the total transaction amount including tax and gratuity, provided the entire amount is processed as a single transaction.

2. QUALIFYING DINING MERCHANTS
The enhanced cashback rate applies to transactions at merchants classified under the following Merchant Category Codes (MCCs):
  (a) Restaurants and Eating Places (MCC 5812) — Full-service restaurants, casual dining, and fine dining establishments
  (b) Fast Food Restaurants (MCC 5814) — Quick-service restaurants, drive-through establishments, and counter-service locations
  (c) Drinking Places and Bars (MCC 5813) — Bars, taverns, lounges, and nightclubs serving food
  (d) Caterers (MCC 5811) — Catering services for events and private functions

3. QUALIFYING MERCHANT EXAMPLES
The following types of merchants typically qualify: sit-down restaurants, coffee shops (Starbucks, Dunkin', local cafes), fast food chains (McDonald's, Chipotle, Subway), food delivery platforms when the merchant of record is the restaurant, bakeries with dine-in service, and food trucks with card processing capabilities.

4. NON-QUALIFYING TRANSACTIONS
The following do NOT qualify for the enhanced dining rate:
  - Grocery store purchases, even from deli or prepared food counters
  - Convenience store food purchases
  - Food delivery service fees where the merchant of record is the delivery platform (e.g., DoorDash, Uber Eats) rather than the restaurant
  - Meal kit subscription services
  - Vending machine purchases
  - Airport lounge access fees

5. MAXIMUM CASHBACK
Cashback under this offer is capped at $75.00 per calendar quarter. Once the cap is reached, dining purchases earn the standard card rate until the next quarter begins.

6. CASHBACK CREDIT
Cashback is accumulated monthly and credited to the cardholder's statement as a statement credit in the billing cycle following the month of accrual. There is no minimum redemption threshold.

7. SPLIT TRANSACTIONS
When a dining bill is split across multiple cards, only the portion charged to the enrolled card earns the enhanced rate. Group payments made through a single card earn the full enhanced rate on the total amount.

8. GENERAL TERMS
This offer does not include progress tracking and has no spending target. Cashback is forfeited upon account closure or if the account enters default status. The issuer reserves the right to reclassify merchant categories, which may affect qualification. This offer cannot be combined with other dining-category promotions running concurrently.`,
  },
];

/**
 * Seed disclosure documents for 4 of the 8 offers.
 * Uploads .txt files to Supabase Storage and inserts offerDisclosures rows.
 */
export async function seedDisclosures(
  offers: { id: string; name: string }[]
) {
  console.log("Creating disclosure documents...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(
      "⚠ Skipping disclosures — NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY not set"
    );
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const created: (typeof schema.offerDisclosures.$inferInsert)[] = [];

  for (const disc of disclosureFiles) {
    const offer = offers[disc.offerIndex];
    if (!offer) {
      console.log(`⚠ Offer at index ${disc.offerIndex} not found, skipping`);
      continue;
    }

    const blob = new Blob([disc.content], { type: "text/plain" });
    const folder = `offers/${offer.id}`;
    const storagePath = `${folder}/${crypto.randomUUID()}-${disc.fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, { contentType: "text/plain" });

    if (uploadError) {
      console.log(
        `⚠ Failed to upload disclosure for "${offer.name}": ${uploadError.message}`
      );
      continue;
    }

    const [row] = await db
      .insert(schema.offerDisclosures)
      .values({
        offerId: offer.id,
        fileName: disc.fileName,
        storagePath,
        mimeType: "text/plain",
        fileSize: blob.size,
      })
      .returning();

    created.push(row);
    console.log(`  ✓ ${offer.name} → ${disc.fileName}`);
  }

  console.log(`✓ Created ${created.length} disclosure documents`);
  return created;
}
