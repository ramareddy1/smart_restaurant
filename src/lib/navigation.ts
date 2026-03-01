import {
  LayoutDashboard,
  Package,
  Truck,
  ChefHat,
  UtensilsCrossed,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Users,
  ClipboardList,
  ShoppingCart,
  Trash2,
  BarChart3,
  Egg,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@generated/prisma";

// ─── Types ──────────────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: "alerts"; // special badge key (e.g. unread alert count)
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─── Shared nav items (reusable building blocks) ────────────────

const dashboard: NavItem = {
  title: "Dashboard",
  href: "/",
  icon: LayoutDashboard,
};

const inventory: NavItem = {
  title: "Inventory",
  href: "/inventory",
  icon: Package,
};

const suppliers: NavItem = {
  title: "Suppliers",
  href: "/suppliers",
  icon: Truck,
};

const recipes: NavItem = {
  title: "Recipes",
  href: "/recipes",
  icon: ChefHat,
};

const menuItems: NavItem = {
  title: "Menu Items",
  href: "/menu-items",
  icon: BookOpen,
};

const menus: NavItem = {
  title: "Menus",
  href: "/menus",
  icon: UtensilsCrossed,
};

const transactions: NavItem = {
  title: "Transactions",
  href: "/transactions",
  icon: ArrowLeftRight,
};

const alerts: NavItem = {
  title: "Alerts",
  href: "/alerts",
  icon: Bell,
  badge: "alerts",
};

const staff: NavItem = {
  title: "Staff",
  href: "/staff",
  icon: Users,
};

// ─── Per-role navigation configs ────────────────────────────────

// Owner sees everything — they're the "single pane of glass" persona
const ownerNav: NavGroup[] = [
  {
    label: "Overview",
    items: [dashboard],
  },
  {
    label: "Operations",
    items: [inventory, suppliers, recipes, menuItems, menus, transactions],
  },
  {
    label: "System",
    items: [alerts, staff],
  },
];

// Kitchen Manager: inventory-focused with purchasing & waste
const kitchenManagerNav: NavGroup[] = [
  {
    label: "Overview",
    items: [dashboard],
  },
  {
    label: "Kitchen Operations",
    items: [inventory, suppliers, transactions],
  },
  {
    label: "System",
    items: [alerts],
  },
];

// Head Chef: recipe & menu-focused
const headChefNav: NavGroup[] = [
  {
    label: "Overview",
    items: [dashboard],
  },
  {
    label: "Kitchen",
    items: [recipes, menuItems, menus, inventory],
  },
  {
    label: "System",
    items: [alerts],
  },
];

// Server / FOH: menu & order-focused (orders come in Phase 3)
const serverNav: NavGroup[] = [
  {
    label: "Overview",
    items: [dashboard],
  },
  {
    label: "Front of House",
    items: [menus, menuItems],
  },
  {
    label: "System",
    items: [alerts],
  },
];

// Host: reservation-focused (reservations come in Phase 4)
const hostNav: NavGroup[] = [
  {
    label: "Overview",
    items: [dashboard],
  },
  {
    label: "Front of House",
    items: [menus],
  },
  {
    label: "System",
    items: [alerts],
  },
];

// ─── Role → Navigation Mapping ─────────────────────────────────

const ROLE_NAV: Record<UserRole, NavGroup[]> = {
  OWNER: ownerNav,
  KITCHEN_MANAGER: kitchenManagerNav,
  HEAD_CHEF: headChefNav,
  SERVER: serverNav,
  HOST: hostNav,
};

export function getNavForRole(role: UserRole): NavGroup[] {
  return ROLE_NAV[role] ?? ownerNav;
}

// ─── Role display labels ────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  KITCHEN_MANAGER: "Kitchen Manager",
  HEAD_CHEF: "Head Chef",
  SERVER: "Server",
  HOST: "Host",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  KITCHEN_MANAGER: "bg-orange-100 text-orange-700",
  HEAD_CHEF: "bg-red-100 text-red-700",
  SERVER: "bg-blue-100 text-blue-700",
  HOST: "bg-green-100 text-green-700",
};
