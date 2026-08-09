import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, UsersRound, CreditCard, Settings } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Oggi", href: "/app", icon: LayoutDashboard },
  { label: "Pazienti", href: "/app/patients", icon: Users },
  { label: "Team", href: "/app/team", icon: UsersRound },
  { label: "Abbonamento", href: "/app/billing", icon: CreditCard },
  { label: "Impostazioni", href: "/app/settings", icon: Settings },
];
