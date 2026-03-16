import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2B / B2G — Личный кабинет оптовика",
  description: "Личный кабинет для оптовых покупателей. Формирование заявок на индивидуальные условия.",
};

export default function B2bLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {children}
    </div>
  );
}
