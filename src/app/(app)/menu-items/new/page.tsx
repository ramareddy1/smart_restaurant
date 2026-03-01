import { PageHeader } from "@/components/shared/page-header";
import { MenuItemForm } from "@/components/menu-items/menu-item-form";

export default function NewMenuItemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Menu Item"
        description="Create a new menu item"
      />
      <MenuItemForm />
    </div>
  );
}
