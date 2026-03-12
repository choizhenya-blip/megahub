import { AdminHeader } from "./AdminHeader";

export const metadata = { title: "Панель управления — MegaHub" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <AdminHeader />
      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "0 24px 48px" }}>
        {children}
      </main>
    </div>
  );
}
