"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  ChefHat,
  UtensilsCrossed,
  ArrowLeftRight,
  Bell,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUnreadAlertCount } from "@/hooks/use-alerts";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Suppliers", href: "/suppliers", icon: Truck },
  { title: "Recipes", href: "/recipes", icon: ChefHat },
  { title: "Menu Items", href: "/menu-items", icon: BookOpen },
  { title: "Menus", href: "/menus", icon: UtensilsCrossed },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Alerts", href: "/alerts", icon: Bell },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { count: unreadAlerts } = useUnreadAlertCount();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          <span className="text-lg font-bold">RestaurantERP</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.href === "/alerts" && unreadAlerts > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 min-w-[20px] justify-center px-1.5 text-[10px]"
                          >
                            {unreadAlerts > 99 ? "99+" : unreadAlerts}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">Mini ERP v1.0</p>
      </SidebarFooter>
    </Sidebar>
  );
}
