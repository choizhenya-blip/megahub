import { createSupabaseServiceClient } from "@/lib/supabase/server";
import AdminProductsTable from "./ProductsTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createSupabaseServiceClient();
  const { data: books, error } = await supabase
    .from("books")
    .select("id, sku, title_ru, subject, class_level, price_b2c, stock_count, is_active, cover_image_url, description")
    .order("created_at", { ascending: false });

  const { data: settingsRows } = await supabase
    .from("admin_settings")
    .select("key, value");

  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) settings[row.key] = row.value;

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Ошибка загрузки товаров: {error.message}
      </div>
    );
  }

  return (
    <AdminProductsTable
      initialBooks={books ?? []}
      syncEnabled={settings.sync_enabled === "true"}
    />
  );
}
