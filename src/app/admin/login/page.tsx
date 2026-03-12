import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : undefined;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#001A33 0%,#002D55 60%,#001A33 100%)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full"
        style={{ maxWidth: 380 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#F97316" }}
          >
            <svg viewBox="0 0 20 20" fill="none" width={20} height={20}>
              <rect x="3" y="4" width="6" height="12" rx="1" fill="white" opacity="0.9" />
              <rect x="11" y="4" width="6" height="12" rx="1" fill="white" opacity="0.7" />
            </svg>
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ fontFamily: "system-ui,sans-serif", color: "#9CA3AF", lineHeight: 1 }}
            >
              MegaHub Education
            </p>
            <p
              className="text-base font-bold"
              style={{ fontFamily: "system-ui,sans-serif", color: "#111827" }}
            >
              Админ-панель
            </p>
          </div>
        </div>

        <LoginForm error={error} />
      </div>
    </div>
  );
}
