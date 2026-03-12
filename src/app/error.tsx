"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { m } = useI18n();

  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-4 select-none">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        {m.errorPage.title}
      </h1>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        {m.errorPage.subtitle}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={reset}
          className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          {m.errorPage.retry}
        </button>
        <Link
          href="/"
          className="border border-gray-300 text-gray-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          {m.errorPage.cta}
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-gray-400 mt-6 font-mono">
          {error.digest}
        </p>
      )}
    </div>
  );
}
