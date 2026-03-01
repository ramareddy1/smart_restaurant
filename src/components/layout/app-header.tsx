"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserCircle, ArrowRightLeft } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contexts/user-context";
import { logoutUser } from "@/hooks/use-auth";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/navigation";

export function AppHeader() {
  const { user } = useUser();
  const router = useRouter();

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1" />

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <UserCircle className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
                <span
                  className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[user.role]}`}
                >
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // Dispatch custom event that PinSwitchDialog listens for
                window.dispatchEvent(new CustomEvent("open-pin-switch"));
              }}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Switch User (PIN)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
