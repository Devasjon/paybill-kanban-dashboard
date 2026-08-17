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
