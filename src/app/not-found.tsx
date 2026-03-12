"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function NotFound() {
  const { m } = useI18n();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-extrabold text-blue-600 mb-4 select-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {m.notFound.title}
      </h1>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        {m.notFound.subtitle}
      </p>
      <Link
        href="/"
        className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
      >
        {m.notFound.cta}
      </Link>
    </div>
  );
}
