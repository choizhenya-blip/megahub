import { cookies } from "next/headers";
import { AdminHeader } from "./AdminHeader";

export const metadata = { title: "Панель управления" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const isSuperAdmin = cookieStore.get("admin_super")?.value === "1";

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <AdminHeader isSuperAdmin={isSuperAdmin} />
      <main style={{ flex: 1, maxWidth: 1240, width: "100%", margin: "0 auto", padding: "0 28px 64px" }}>
        {children}
      </main>
    </div>
  );
}
