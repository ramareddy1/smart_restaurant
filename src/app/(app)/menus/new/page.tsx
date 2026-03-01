import { MenuForm } from "@/components/menus/menu-form";
import { PageHeader } from "@/components/shared/page-header";

export default function NewMenuPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Create Menu" description="Build a new menu from your items" />
      <MenuForm />
    </div>
  );
}
