"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Loader2 } from "lucide-react";
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
import { useUser } from "@/contexts/user-context";
import { getNavForRole, ROLE_LABELS, ROLE_COLORS } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { count: unreadAlerts } = useUnreadAlertCount();
  const { user, isLoading } = useUser();

  // Determine nav based on user role (fall back to full nav for Owner if no user yet)
  const navGroups = user ? getNavForRole(user.role) : getNavForRole("OWNER");

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          <span className="text-lg font-bold">RestaurantERP</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
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
                          {item.badge === "alerts" && unreadAlerts > 0 && (
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
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t px-6 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading...
          </div>
        ) : user ? (
          <div className="space-y-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[user.role]}`}
            >
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Mini ERP v1.0</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
