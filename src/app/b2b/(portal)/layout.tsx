import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyB2bSessionToken } from "@/lib/b2bAuth";
import { B2bPortalHeader } from "./B2bPortalHeader";

export default async function B2bPortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("b2b_session")?.value;
  const userId = cookieStore.get("b2b_user_id")?.value;

  if (!token || !userId || !verifyB2bSessionToken(token, userId)) {
    redirect("/b2b/login");
  }

  const db = createSupabaseServiceClient();
  const { data: user } = await db
    .from("b2b_users")
    .select("id, email, contact_name, company_name")
    .eq("id", userId)
    .maybeSingle();

  if (!user) redirect("/b2b/login");

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      <B2bPortalHeader user={user} />
      <main style={{ flex: 1, maxWidth: 1240, width: "100%", margin: "0 auto", padding: "0 28px 64px" }}>
        {children}
      </main>
    </div>
  );
}
