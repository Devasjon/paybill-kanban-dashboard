import type { Bill, Debt } from "@/types";

function iso(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

export function sampleBills(): Bill[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Pinjaman Perumahan",
      amount: 1450,
      dueDate: iso(-1),
      category: "loan",
      recurring: true,
      paid: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Kad Kredit Maybank",
      amount: 780.5,
      dueDate: iso(-3),
      category: "creditCard",
      recurring: true,
      paid: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Bil Elektrik",
      amount: 168.2,
      dueDate: iso(2),
      category: "utilities",
      recurring: true,
      paid: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Internet Rumah",
      amount: 129,
      dueDate: iso(9),
      category: "utilities",
      recurring: true,
      paid: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Pinjaman Kereta",
      amount: 620,
      dueDate: iso(-4),
      category: "loan",
      recurring: true,
      paid: true,
    },
    {
      id: crypto.randomUUID(),
      name: "Netflix + Spotify",
      amount: 45,
      dueDate: iso(14),
      category: "subscription",
      recurring: true,
      paid: false,
    },
    {
      id: crypto.randomUUID(),
      name: "Insurans Kereta",
      amount: 89,
      dueDate: iso(20),
      category: "insurance",
      recurring: true,
      paid: false,
    },
  ];
}

export function sampleDebts(): Debt[] {
  return [
    {
      id: crypto.randomUUID(),
      name: "Kad Kredit Maybank",
      type: "creditCard",
      originalAmount: 8000,
      currentBalance: 4800,
      apr: 17.5,
      minPayment: 240,
    },
    {
      id: crypto.randomUUID(),
      name: "Pinjaman Pelajaran (PTPTN)",
      type: "studyLoan",
      originalAmount: 25000,
      currentBalance: 18500,
      apr: 1,
      minPayment: 150,
    },
    {
      id: crypto.randomUUID(),
      name: "Pinjaman Peribadi",
      type: "personalLoan",
      originalAmount: 12000,
      currentBalance: 9200,
      apr: 9.5,
      minPayment: 320,
    },
    {
      id: crypto.randomUUID(),
      name: "Pinjaman Kereta",
      type: "carLoan",
      originalAmount: 35000,
      currentBalance: 26000,
      apr: 3.2,
      minPayment: 610,
    },
  ];
}
