import UsersPanel from "./UsersPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Пользователи — Панель управления" };

export default function AdminUsersPage() {
  return <UsersPanel />;
}
