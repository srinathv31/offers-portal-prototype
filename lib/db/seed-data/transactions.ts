import { db } from "../index";
import * as schema from "../schema";
import { buildAccountToCardsMap, selectCardForTransaction } from "./utils";

type Account = { id: string };
type Enrollment = { id: string };

interface AccountCreditCardLink {
  accountId: string;
  creditCardId: string;
  isPrimary: boolean;
  preferredForCategory: string | null;
}

interface SeedTransactionsDeps {
  accounts: Account[];
  enrollments: Enrollment[];
  accountCreditCardsData: AccountCreditCardLink[];
}

/**
 * Seed account transactions with offer qualification metadata
 */
export async function seedTransactions(deps: SeedTransactionsDeps) {
  const { accounts, enrollments, accountCreditCardsData } = deps;

  console.log("Creating account transactions...");

  // Build account to cards mapping for smart card selection
  const accountToCards = buildAccountToCardsMap(accountCreditCardsData);

  const transactionsData = [
    // Victoria's Amazon transactions (enrollment 0 - completed)
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[0].id,
      transactionDate: new Date("2025-11-05"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 15000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[0].id,
      transactionDate: new Date("2025-11-10"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 28500,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[0].id,
      transactionDate: new Date("2025-11-15"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 22000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[0].id,
      transactionDate: new Date("2025-11-20"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 19500,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[0].id,
      transactionDate: new Date("2025-11-28"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 15000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },

    // Alexander's Amazon transactions (enrollment 1 - in progress)
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[1].id,
      transactionDate: new Date("2025-11-08"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 32000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[1].id,
      transactionDate: new Date("2025-11-18"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 25500,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[1].id,
      transactionDate: new Date("2025-11-25"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 21000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },

    // William's Amazon transactions (enrollment 2)
    {
      accountId: accounts[3].id,
      enrollmentId: enrollments[2].id,
      transactionDate: new Date("2025-11-12"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 18200,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },
    {
      accountId: accounts[3].id,
      enrollmentId: enrollments[2].id,
      transactionDate: new Date("2025-11-22"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 27000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Amazon 3× Points",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction meets all offer criteria for 3× points reward",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            minPurchaseMet: true,
            minPurchaseRequired: 2500,
          },
        },
      },
    },

    // Isabella's Target transactions (enrollment 5)
    {
      accountId: accounts[2].id,
      enrollmentId: enrollments[5].id,
      transactionDate: new Date("2025-11-04"),
      merchant: "Target",
      category: "Retail",
      amount: 8500,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Target 5% Weekend",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction at Target qualifies for 5% weekend cashback",
          details: {
            merchantMatch: true,
            weekendPurchase: false,
            cashbackPercent: 5,
            maxCashback: 5000,
          },
        },
      },
    },
    {
      accountId: accounts[2].id,
      enrollmentId: enrollments[5].id,
      transactionDate: new Date("2025-11-11"),
      merchant: "Target",
      category: "Retail",
      amount: 12000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Target 5% Weekend",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction at Target qualifies for 5% weekend cashback",
          details: {
            merchantMatch: true,
            weekendPurchase: false,
            cashbackPercent: 5,
            maxCashback: 5000,
          },
        },
      },
    },
    {
      accountId: accounts[2].id,
      enrollmentId: enrollments[5].id,
      transactionDate: new Date("2025-11-18"),
      merchant: "Target",
      category: "Retail",
      amount: 12000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Target 5% Weekend",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction at Target qualifies for 5% weekend cashback",
          details: {
            merchantMatch: true,
            weekendPurchase: false,
            cashbackPercent: 5,
            maxCashback: 5000,
          },
        },
      },
    },

    // Sophia's Target transactions (enrollment 6 - completed)
    {
      accountId: accounts[4].id,
      enrollmentId: enrollments[6].id,
      transactionDate: new Date("2025-11-09"),
      merchant: "Target",
      category: "Retail",
      amount: 18000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Target 5% Weekend",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Weekend purchase at Target qualifies for 5% cashback bonus",
          details: {
            merchantMatch: true,
            weekendPurchase: true,
            cashbackPercent: 5,
            maxCashback: 5000,
          },
        },
      },
    },
    {
      accountId: accounts[4].id,
      enrollmentId: enrollments[6].id,
      transactionDate: new Date("2025-11-16"),
      merchant: "Target",
      category: "Retail",
      amount: 15500,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Target 5% Weekend",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Weekend purchase at Target qualifies for 5% cashback bonus",
          details: {
            merchantMatch: true,
            weekendPurchase: true,
            cashbackPercent: 5,
            maxCashback: 5000,
          },
        },
      },
    },
    {
      accountId: accounts[4].id,
      enrollmentId: enrollments[6].id,
      transactionDate: new Date("2025-11-25"),
      merchant: "Target",
      category: "Retail",
      amount: 16500,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Target 5% Weekend",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Transaction at Target qualifies for 5% weekend cashback",
          details: {
            merchantMatch: true,
            weekendPurchase: false,
            cashbackPercent: 5,
            maxCashback: 5000,
          },
        },
      },
    },

    // James's Starbucks transactions (enrollment 8 - completed)
    {
      accountId: accounts[5].id,
      enrollmentId: enrollments[8].id,
      transactionDate: new Date("2025-11-03"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 850,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },
    {
      accountId: accounts[5].id,
      enrollmentId: enrollments[8].id,
      transactionDate: new Date("2025-11-05"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 720,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },
    {
      accountId: accounts[5].id,
      enrollmentId: enrollments[8].id,
      transactionDate: new Date("2025-11-08"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 980,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },
    {
      accountId: accounts[5].id,
      enrollmentId: enrollments[8].id,
      transactionDate: new Date("2025-11-10"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1250,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },
    {
      accountId: accounts[5].id,
      enrollmentId: enrollments[8].id,
      transactionDate: new Date("2025-11-12"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1200,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },

    // Emma's Starbucks transactions (enrollment 9)
    {
      accountId: accounts[6].id,
      enrollmentId: enrollments[9].id,
      transactionDate: new Date("2025-11-07"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 650,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },
    {
      accountId: accounts[6].id,
      enrollmentId: enrollments[9].id,
      transactionDate: new Date("2025-11-14"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1100,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },
    {
      accountId: accounts[6].id,
      enrollmentId: enrollments[9].id,
      transactionDate: new Date("2025-11-21"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1450,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Starbucks Bonus",
          campaignName: "Holiday Shopping Bonanza",
          reason: "Starbucks purchase counts toward 500 bonus points goal",
          details: {
            merchantMatch: true,
            categoryMatch: true,
            bonusPoints: 500,
            progressTowardGoal: true,
          },
        },
      },
    },

    // Victoria's Travel transactions (enrollment 14)
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[14].id,
      transactionDate: new Date("2025-09-15"),
      merchant: "Delta Airlines",
      category: "Travel",
      amount: 45000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Airline purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: true,
            isHotel: false,
            pointsMultiplier: 5,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[14].id,
      transactionDate: new Date("2025-10-05"),
      merchant: "Marriott Hotels",
      category: "Travel",
      amount: 38000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Hotel purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: false,
            isHotel: true,
            pointsMultiplier: 5,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[14].id,
      transactionDate: new Date("2025-10-20"),
      merchant: "United Airlines",
      category: "Travel",
      amount: 52000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Airline purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: true,
            isHotel: false,
            pointsMultiplier: 5,
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: enrollments[14].id,
      transactionDate: new Date("2025-11-10"),
      merchant: "Hilton",
      category: "Travel",
      amount: 21000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Hotel purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: false,
            isHotel: true,
            pointsMultiplier: 5,
          },
        },
      },
    },

    // Alexander's Travel transactions (enrollment 15 - completed)
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[15].id,
      transactionDate: new Date("2025-08-20"),
      merchant: "American Airlines",
      category: "Travel",
      amount: 65000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Airline purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: true,
            isHotel: false,
            pointsMultiplier: 5,
          },
        },
      },
    },
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[15].id,
      transactionDate: new Date("2025-09-10"),
      merchant: "Hyatt Hotels",
      category: "Travel",
      amount: 42000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Hotel purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: false,
            isHotel: true,
            pointsMultiplier: 5,
          },
        },
      },
    },
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[15].id,
      transactionDate: new Date("2025-10-15"),
      merchant: "Southwest Airlines",
      category: "Travel",
      amount: 35000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Airline purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: true,
            isHotel: false,
            pointsMultiplier: 5,
          },
        },
      },
    },
    {
      accountId: accounts[1].id,
      enrollmentId: enrollments[15].id,
      transactionDate: new Date("2025-11-05"),
      merchant: "Four Seasons",
      category: "Travel",
      amount: 58000,
      qualifiesForOffer: true,
      metadata: {
        qualification: {
          qualified: true,
          offerName: "Travel Miles Accelerator",
          campaignName: "Summer Travel Campaign",
          reason: "Hotel purchase earns 5× points on travel category",
          details: {
            categoryMatch: true,
            isAirline: false,
            isHotel: true,
            pointsMultiplier: 5,
          },
        },
      },
    },

    // Non-qualifying transactions (general spending)
    {
      accountId: accounts[0].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-02"),
      merchant: "Whole Foods",
      category: "Groceries",
      amount: 15600,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for Groceries category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            suggestion: "Enroll in Recurring Groceries Booster for 2× points",
          },
        },
      },
    },
    {
      accountId: accounts[0].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-08"),
      merchant: "Shell Gas",
      category: "Gas Stations",
      amount: 6500,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for Gas Stations category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            suggestion: "Enroll in Gas Station Rewards for 3× points",
          },
        },
      },
    },
    {
      accountId: accounts[1].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-12"),
      merchant: "Trader Joe's",
      category: "Groceries",
      amount: 9800,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for Groceries category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            suggestion: "Enroll in Recurring Groceries Booster for 2× points",
          },
        },
      },
    },
    {
      accountId: accounts[2].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-06"),
      merchant: "Costco",
      category: "Groceries",
      amount: 28500,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for Groceries category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            suggestion: "Enroll in Recurring Groceries Booster for 2× points",
          },
        },
      },
    },
    {
      accountId: accounts[3].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-15"),
      merchant: "Best Buy",
      category: "Electronics",
      amount: 125000,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offers available for Electronics category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            availableOffers: "None currently available",
          },
        },
      },
    },
    {
      accountId: accounts[4].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-20"),
      merchant: "Nordstrom",
      category: "Retail",
      amount: 34500,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "Merchant does not match enrolled Target 5% Weekend offer",
          details: {
            categoryMatch: true,
            merchantMatch: false,
            enrolledOffer: "Target 5% Weekend",
            requiredMerchant: "Target",
          },
        },
      },
    },
    {
      accountId: accounts[5].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-18"),
      merchant: "Apple Store",
      category: "Electronics",
      amount: 129900,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offers available for Electronics category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            availableOffers: "None currently available",
          },
        },
      },
    },
    {
      accountId: accounts[6].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-22"),
      merchant: "Cheesecake Factory",
      category: "Dining",
      amount: 8500,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "Merchant does not match enrolled Starbucks Bonus offer",
          details: {
            categoryMatch: true,
            merchantMatch: false,
            enrolledOffer: "Starbucks Bonus",
            requiredMerchant: "Starbucks",
          },
        },
      },
    },
    {
      accountId: accounts[9].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-10"),
      merchant: "Safeway",
      category: "Groceries",
      amount: 12300,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for this account",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            suggestion: "Enroll in Recurring Groceries Booster for 2× points",
          },
        },
      },
    },
    {
      accountId: accounts[10].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-14"),
      merchant: "CVS",
      category: "Pharmacy",
      amount: 4500,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offers available for Pharmacy category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
            availableOffers: "None currently available",
          },
        },
      },
    },
  ];

  // Add credit card IDs to transactions using intelligent card selection
  const transactionsWithCards = transactionsData.map((tx) => ({
    ...tx,
    creditCardId: selectCardForTransaction(
      tx.accountId,
      tx.category,
      accountToCards
    ),
  }));

  await db.insert(schema.accountTransactions).values(transactionsWithCards);
  console.log(`✓ Created ${transactionsWithCards.length} transactions`);

  return transactionsWithCards;
}

