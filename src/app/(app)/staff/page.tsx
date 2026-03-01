"use client";

import { useState, useDeferredValue } from "react";
import { toast } from "sonner";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Pencil,
  UserX,
  UserCheck,
  Loader2,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaff, type StaffMember } from "@/hooks/use-staff";
import { useUser } from "@/contexts/user-context";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/navigation";
import type { UserRole } from "@generated/prisma";

const ROLES: UserRole[] = [
  "OWNER",
  "KITCHEN_MANAGER",
  "HEAD_CHEF",
  "SERVER",
  "HOST",
];

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  const { staff, isLoading, mutate } = useStaff({
    search: deferredSearch || undefined,
    showInactive,
  });

  const { user: currentUser } = useUser();

  const handleDeactivate = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deactivate");
      }
      toast.success(`"${name}" has been deactivated`);
      mutate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to deactivate staff member"
      );
    }
  };

  const handleReactivate = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error("Failed to reactivate");
      toast.success(`"${name}" has been reactivated`);
      mutate();
    } catch {
      toast.error("Failed to reactivate staff member");
    }
  };

  const columns: ColumnDef<StaffMember>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue("name")}</span>
          {!row.original.isActive && (
            <Badge variant="secondary" className="text-[10px]">
              Inactive
            </Badge>
          )}
          {row.original.id === currentUser?.id && (
            <Badge variant="outline" className="text-[10px]">
              You
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as UserRole;
        return (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role]}`}
          >
            {ROLE_LABELS[role]}
          </span>
        );
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ row }) => {
        const date = row.getValue("lastLoginAt") as string | null;
        return date
          ? formatDistanceToNow(new Date(date), { addSuffix: true })
          : "Never";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        const isSelf = member.id === currentUser?.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingMember(member);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {!isSelf &&
                (member.isActive ? (
                  <ConfirmDialog
                    title={`Deactivate "${member.name}"?`}
                    description="This user will be logged out and can no longer access the system."
                    onConfirm={() => handleDeactivate(member.id, member.name)}
                  >
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <UserX className="mr-2 h-4 w-4" /> Deactivate
                    </DropdownMenuItem>
                  </ConfirmDialog>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleReactivate(member.id, member.name)}
                  >
                    <UserCheck className="mr-2 h-4 w-4" /> Reactivate
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: staff,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Staff Management"
          description="Manage your restaurant team"
        />
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingMember(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <StaffFormDialog
            member={editingMember}
            onSuccess={() => {
              setDialogOpen(false);
              setEditingMember(null);
              mutate();
            }}
          />
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border"
          />
          Show inactive
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          title="No staff members found"
          description="Add your first team member to get started"
        >
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.original.isActive ? "" : "opacity-50"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Staff Add/Edit Form Dialog ─────────────────────────────────

function StaffFormDialog({
  member,
  onSuccess,
}: {
  member: StaffMember | null;
  onSuccess: () => void;
}) {
  const isEditing = !!member;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<UserRole>(member?.role ?? "SERVER");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  // Reset form when member changes
  useState(() => {
    setName(member?.name ?? "");
    setEmail(member?.email ?? "");
    setRole(member?.role ?? "SERVER");
    setPin("");
    setError("");
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditing) {
        const body: Record<string, unknown> = { name, email, role };
        if (pin) body.pin = pin;

        const res = await fetch(`/api/staff/${member.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update");
        }
        toast.success(`"${name}" updated`);
      } else {
        const body: Record<string, unknown> = { name, email, role };
        if (pin) body.pin = pin;

        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create");
        }
        toast.success(`"${name}" added to the team`);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {isEditing ? "Edit Staff Member" : "Add Staff Member"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update this team member's information."
            : "Add a new team member to your restaurant."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="staff-name">Name</Label>
          <Input
            id="staff-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-email">Email</Label>
          <Input
            id="staff-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@restaurant.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-role">Role</Label>
          <Select
            value={role}
            onValueChange={(val) => setRole(val as UserRole)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="staff-pin">
            PIN (4 digits){" "}
            <span className="text-muted-foreground font-normal">
              — {isEditing ? "leave empty to keep current" : "optional"}
            </span>
          </Label>
          <Input
            id="staff-pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="font-mono tracking-wider"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="submit" disabled={loading || !name || !email}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Add Member"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
