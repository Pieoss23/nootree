import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UsersRound,
  CreditCard,
  Settings,
  Apple,
  ChefHat,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Oggi", href: "/app", icon: LayoutDashboard },
  { label: "Pazienti", href: "/app/patients", icon: Users },
  { label: "Catalogo prodotti", href: "/app/products", icon: Apple },
  { label: "Ricette", href: "/app/recipes", icon: ChefHat },
  { label: "Team", href: "/app/team", icon: UsersRound },
  { label: "Abbonamento", href: "/app/billing", icon: CreditCard },
  { label: "Impostazioni", href: "/app/settings", icon: Settings },
];
