"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus, Pencil, Trash2, X, CheckCircle2, AlertCircle,
  Loader2, Eye, EyeOff, ShieldCheck, Shield, BookOpen, Users,
} from "lucide-react";

type Role = "super_admin" | "manager" | "editor" | "viewer";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Супер-Администратор",
  manager: "Менеджер",
  editor: "Редактор",
  viewer: "Просмотр",
};

const ROLE_COLORS: Record<Role, string> = {
  super_admin: "#7C3AED",
  manager: "#D97706",
  editor: "#2563EB",
  viewer: "#6B7280",
};

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  super_admin: <ShieldCheck size={13} />,
  manager: <Shield size={13} />,
  editor: <BookOpen size={13} />,
  viewer: <Users size={13} />,
};

/* ─── Add / Edit modal ───────────────────────────────────────── */
function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<Role>(user?.role ?? "manager");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = isEdit
      ? { id: user!.id, name, role, ...(password ? { password } : {}) }
      : { name, email, password, role };

    const res = await fetch("/api/admin/users", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Неизвестная ошибка");
    } else {
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    setter: (v: string) => void,
    opts?: { type?: string; required?: boolean; disabled?: boolean }
  ) => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
        {label}{opts?.required !== false ? <span style={{ color: "#EF4444" }}> *</span> : null}
      </label>
      <input
        id={id}
        type={opts?.type ?? "text"}
        value={value}
        onChange={(e) => setter(e.target.value)}
        required={opts?.required !== false}
        disabled={opts?.disabled}
        style={{
          width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 9,
          padding: "9px 12px", fontSize: 14, outline: "none",
          color: opts?.disabled ? "#9CA3AF" : "#111827",
          background: opts?.disabled ? "#F9FAFB" : "#fff",
          boxSizing: "border-box",
        }}
        onFocus={(e) => { if (!opts?.disabled) e.currentTarget.style.borderColor = "#F97316"; }}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
      />
    </div>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,26,51,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 999, backdropFilter: "blur(2px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 18, padding: "28px 28px 24px",
          width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "#FFF7ED",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <UserPlus size={18} color="#F97316" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#001A33" }}>
              {isEdit ? "Редактировать пользователя" : "Добавить пользователя"}
            </div>
          </div>
        </div>

        {success ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 0" }}>
            <CheckCircle2 size={44} color="#22C55E" />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#166534" }}>
              {isEdit ? "Изменения сохранены" : "Пользователь создан"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "#FEF2F2", border: "1.5px solid #FECACA",
                borderRadius: 9, padding: "10px 12px", fontSize: 13, color: "#991B1B",
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {field("name", "Имя", name, setName)}
            {field("email", "Email", email, setEmail, { type: "email", disabled: isEdit })}

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                Пароль{!isEdit && <span style={{ color: "#EF4444" }}> *</span>}
                {isEdit && <span style={{ color: "#9CA3AF", fontWeight: 400 }}> (оставьте пустым чтобы не менять)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEdit}
                  placeholder={isEdit ? "Новый пароль…" : "Мин. 8 символов"}
                  style={{
                    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 9,
                    padding: "9px 38px 9px 12px", fontSize: 14, outline: "none",
                    color: "#111827", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  tabIndex={-1}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                Роль <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                style={{
                  width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 9,
                  padding: "9px 12px", fontSize: 14, outline: "none",
                  color: "#111827", background: "#fff", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#F97316")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")}
              >
                {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, label]) => (
                  <option key={r} value={r}>{label}</option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                {role === "super_admin" && "Полный доступ ко всем функциям"}
                {role === "manager" && "Управление заказами и B2B-запросами"}
                {role === "editor" && "Редактирование каталога и переводов"}
                {role === "viewer" && "Только просмотр данных"}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", padding: "10px", borderRadius: 10, border: "none",
                background: saving ? "#94A3B8" : "#F97316",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background 0.15s", marginTop: 4,
              }}
            >
              {saving
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Сохранение…</>
                : isEdit ? "Сохранить изменения" : "Создать пользователя"
              }
            </button>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Main panel ─────────────────────────────────────────────── */
export default function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<AdminUser | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users ?? []);
    } else {
      setError("Ошибка загрузки пользователей");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActive(user: AdminUser) {
    setToggling(user.id);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
    });
    await fetchUsers();
    setToggling(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Удалить этого пользователя? Это действие нельзя отменить.")) return;
    setDeleting(id);
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    await fetchUsers();
    setDeleting(null);
  }

  return (
    <div style={{ padding: "28px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F0F9FF", border: "1px solid #BAE6FD", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} color="#0284C7" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#001A33", margin: 0, letterSpacing: "-0.01em" }}>Пользователи</h2>
          </div>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0, paddingLeft: 46 }}>
            Управление доступом к панели управления
          </p>
        </div>
        <button
          onClick={() => setModalUser("new")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#F97316", color: "#fff",
            border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(249,115,22,0.3)",
          }}
        >
          <UserPlus size={15} />
          Добавить пользователя
        </button>
      </div>

      {/* Roles legend */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24,
        padding: "12px 16px", background: "#F8FAFC",
        borderRadius: 12, border: "1px solid #E5E7EB",
      }}>
        {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([r, label]) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: ROLE_COLORS[r] + "18", color: ROLE_COLORS[r],
              padding: "3px 8px", borderRadius: 6, fontWeight: 600,
            }}>
              {ROLE_ICONS[r]} {label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 16,
        }}>
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F0F0F0", overflow: "hidden" }}>
          {/* Skeleton header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", background: "#F8FAFC", borderBottom: "1px solid #E5E7EB", padding: "0 8px" }}>
            {["Пользователь", "Роль", "Статус", "Создан", "Действия"].map((h) => (
              <div key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", alignItems: "center", borderBottom: i < 3 ? "1px solid #F3F4F6" : "none", padding: "0 8px" }}>
              <div style={{ padding: "16px" }}>
                <div style={{ height: 13, width: "60%", borderRadius: 5, background: "#F3F4F6", marginBottom: 6, animation: "shimmer 1.4s infinite" }} />
                <div style={{ height: 11, width: "40%", borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
              </div>
              <div style={{ padding: "16px" }}><div style={{ height: 22, width: 100, borderRadius: 6, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} /></div>
              <div style={{ padding: "16px" }}><div style={{ height: 22, width: 70, borderRadius: 6, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} /></div>
              <div style={{ padding: "16px" }}><div style={{ height: 12, width: 80, borderRadius: 5, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} /></div>
              <div style={{ padding: "16px", display: "flex", gap: 6 }}>
                <div style={{ height: 28, width: 80, borderRadius: 7, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
                <div style={{ height: 28, width: 70, borderRadius: 7, background: "#F3F4F6", animation: "shimmer 1.4s infinite" }} />
              </div>
            </div>
          ))}
          <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        </div>
      ) : users.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "56px 24px",
          background: "#fff", borderRadius: 14, border: "1.5px dashed #E5E7EB",
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #F0F9FF, #BAE6FD)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Users size={28} color="#0EA5E9" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Нет пользователей</p>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>
            Добавьте первого пользователя для совместной работы
          </p>
        </div>
      ) : (
        <div style={{
          background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                {["Пользователь", "Роль", "Статус", "Создан", "Действия"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  className="admin-user-row"
                  style={{
                    borderBottom: idx < users.length - 1 ? "1px solid #F3F4F6" : "none",
                    opacity: u.is_active ? 1 : 0.55,
                    transition: "background 0.12s",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "#6B7280" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: ROLE_COLORS[u.role] + "18",
                      color: ROLE_COLORS[u.role],
                      padding: "4px 10px", borderRadius: 6,
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {ROLE_ICONS[u.role]} {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={toggling === u.id}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 6, border: "none",
                        background: u.is_active ? "#DCFCE7" : "#F3F4F6",
                        color: u.is_active ? "#166534" : "#6B7280",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {toggling === u.id
                        ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                        : u.is_active ? "Активен" : "Отключён"
                      }
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#6B7280" }}>
                    {new Date(u.created_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setModalUser(u)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "6px 12px", borderRadius: 7,
                          border: "1px solid #E5E7EB", background: "#fff",
                          fontSize: 12, fontWeight: 600, color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={12} /> Изменить
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={deleting === u.id}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "6px 12px", borderRadius: 7,
                          border: "1px solid #FECACA", background: "#FEF2F2",
                          fontSize: 12, fontWeight: 600, color: "#DC2626",
                          cursor: deleting === u.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {deleting === u.id
                          ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          : <Trash2 size={12} />
                        }
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .admin-user-row:hover td { background: #FAFAFA !important; }
      `}</style>

      {modalUser !== null && (
        <UserModal
          user={modalUser === "new" ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}
