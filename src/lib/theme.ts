import {
  Zap,
  Home,
  CreditCard,
  Tv,
  ShieldCheck,
  Landmark,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { BillCategory, BillStatus } from "@/types";

export const categoryTheme: Record<BillCategory, { icon: LucideIcon; bg: string; fg: string }> = {
  utilities: { icon: Zap, bg: "#FEF3C7", fg: "#92600B" },
  housing: { icon: Home, bg: "#EDE9FE", fg: "#5B3DA6" },
  creditCard: { icon: CreditCard, bg: "#DBEAFE", fg: "#1D4ED8" },
  subscription: { icon: Tv, bg: "#FCE7F3", fg: "#9D174D" },
  insurance: { icon: ShieldCheck, bg: "#D1FAE5", fg: "#065F46" },
  loan: { icon: Landmark, bg: "#E0E7FF", fg: "#3730A3" },
  other: { icon: MoreHorizontal, bg: "#F3F4F6", fg: "#374151" },
};

export const statusTheme: Record<BillStatus, { icon: LucideIcon; bg: string; fg: string; dot: string }> = {
  paid: { icon: CheckCircle2, bg: "#DCFCE7", fg: "#15803D", dot: "#22C55E" },
  overdue: { icon: AlertCircle, bg: "#FEE2E2", fg: "#DC2626", dot: "#EF4444" },
  dueSoon: { icon: Clock, bg: "#FFEDD5", fg: "#C2410C", dot: "#F97316" },
  upcoming: { icon: Clock, bg: "#F1F0FE", fg: "#5B3DA6", dot: "#8B7FF0" },
};

// The four pastel stat-card backgrounds from the sample, in fixed order.
export const statCardPalette = [
  { bg: "#ECE9FB", fg: "#4B3A9E", chip: "rgba(255,255,255,0.6)" }, // lavender
  { bg: "#FDE6D8", fg: "#B0511C", chip: "rgba(255,255,255,0.6)" }, // peach
  { bg: "#E8F5CE", fg: "#4C7A17", chip: "rgba(255,255,255,0.6)" }, // lime
  { bg: "#DDEEFB", fg: "#1D5F94", chip: "rgba(255,255,255,0.6)" }, // sky blue
];

export const sidebarBg = "#17171d";
export const sidebarActiveBg = "#25252e";
export const sidebarBorder = "#26262f";
export const brandPurple = "#6d5bd0";
export const brandPurpleDark = "#5847b8";
