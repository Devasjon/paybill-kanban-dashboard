import type { BillCategory, DebtType } from "@/types";

const categoryKeyMap: Record<BillCategory, string> = {
  utilities: "categoryUtilities",
  housing: "categoryHousing",
  creditCard: "categoryCreditCard",
  subscription: "categorySubscription",
  insurance: "categoryInsurance",
  loan: "categoryLoan",
  other: "categoryOther",
};

const debtTypeKeyMap: Record<DebtType, string> = {
  creditCard: "debtTypeCreditCard",
  studyLoan: "debtTypeStudyLoan",
  personalLoan: "debtTypePersonalLoan",
  carLoan: "debtTypeCarLoan",
  housingLoan: "debtTypeHousingLoan",
  other: "debtTypeOther",
};

export function categoryLabelKey(c: BillCategory): string {
  return categoryKeyMap[c];
}

export function debtTypeLabelKey(t: DebtType): string {
  return debtTypeKeyMap[t];
}

// Used for the auto-generated minimum-payment bill (see App.tsx's
// syncDebtMinPaymentBill) — picks the closest existing Bill category since
// BillCategory doesn't distinguish between loan types the way DebtType does.
const debtTypeToBillCategoryMap: Record<DebtType, BillCategory> = {
  creditCard: "creditCard",
  studyLoan: "loan",
  personalLoan: "loan",
  carLoan: "loan",
  housingLoan: "loan",
  other: "other",
};

export function debtTypeToBillCategory(t: DebtType): BillCategory {
  return debtTypeToBillCategoryMap[t];
}

export const CATEGORY_ORDER: BillCategory[] = [
  "utilities",
  "housing",
  "creditCard",
  "subscription",
  "insurance",
  "loan",
  "other",
];

export const DEBT_TYPE_ORDER: DebtType[] = [
  "creditCard",
  "studyLoan",
  "personalLoan",
  "carLoan",
  "housingLoan",
  "other",
];
