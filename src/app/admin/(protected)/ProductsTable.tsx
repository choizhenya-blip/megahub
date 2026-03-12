"use client";

import { useState, useRef } from "react";
import { ChevronDown, ChevronRight, RefreshCw, Upload } from "lucide-react";

interface Book {
  id: string;
  sku: string;
  title_ru: string;
  subject: string;
  class_level: number;
  price_b2c: number;
  stock_count: number;
  is_active: boolean;
  cover_image_url: string | null;
  description: string | null;
}

async function patchBook(id: string, fields: Partial<Book>) {
  const res = await fetch("/api/admin/products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...fields }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function AdminProductsTable({
  initialBooks,
  syncEnabled: initialSyncEnabled,
}: {
  initialBooks: Book[];
  syncEnabled: boolean;
}) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncEnabled, setSyncEnabled] = useState(initialSyncEnabled);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function updateLocal(id: string, fields: Partial<Book>) {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...fields } : b))
    );
  }

  async function handleToggleActive(book: Book) {
    const next = !book.is_active;
    updateLocal(book.id, { is_active: next });
    try {
      await patchBook(book.id, { is_active: next });
    } catch {
      updateLocal(book.id, { is_active: book.is_active });
      alert("Ошибка сохранения");
    }
  }

  async function handleStockBlur(book: Book, val: string) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n === book.stock_count) return;
    updateLocal(book.id, { stock_count: n });
    try {
      await patchBook(book.id, { stock_count: n });
    } catch {
      alert("Ошибка сохранения");
    }
  }

  async function handleDescriptionBlur(book: Book, val: string) {
    if (val === (book.description ?? "")) return;
    updateLocal(book.id, { description: val });
    try {
      await patchBook(book.id, { description: val });
    } catch {
      alert("Ошибка сохранения");
    }
  }

  async function handlePhotoUpload(book: Book, file: File) {
    const fd = new FormData();
    fd.append("bookId", book.id);
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      updateLocal(book.id, { cover_image_url: url });
    } catch (e: any) {
      alert("Ошибка загрузки фото: " + e.message);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync-sheets", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✅ Обновлено: ${data.updated} товаров`);
        // Refresh books list
        const booksRes = await fetch("/api/admin/products");
        if (booksRes.ok) setBooks(await booksRes.json());
      } else {
        setSyncResult(`❌ Ошибка: ${data.error}`);
      }
    } catch (e: any) {
      setSyncResult(`❌ ${e.message}`);
    }
    setSyncing(false);
  }

  async function handleToggleAutoSync(next: boolean) {
    setSyncEnabled(next);
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setting: "sync_enabled", value: String(next) }),
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mr-auto">Товары</h1>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <span>Авто-синхронизация</span>
          <button
            onClick={() => handleToggleAutoSync(!syncEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              syncEnabled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                syncEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          Синхронизировать из Google Sheets
        </button>
      </div>

      {syncResult && (
        <div className="mb-4 text-sm text-gray-700 bg-gray-100 rounded-lg px-4 py-2">
          {syncResult}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-8" />
              <th className="text-left px-4 py-3 font-medium text-gray-600">Товар</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Остаток</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Активен</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map((book) => {
              const isOpen = expanded === book.id;
              return (
                <>
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    {/* Expand toggle */}
                    <td className="pl-3">
                      <button
                        onClick={() => setExpanded(isOpen ? null : book.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-xs">
                        {book.title_ru}
                      </div>
                      <div className="text-xs text-gray-400">
                        {book.subject} · {book.class_level} кл.
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {book.sku}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        defaultValue={book.stock_count}
                        key={book.stock_count}
                        onBlur={(e) => handleStockBlur(book, e.target.value)}
                        className="w-20 text-center border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    {/* Active toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(book)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          book.is_active ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            book.is_active ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row — description + photo */}
                  {isOpen && (
                    <tr key={`${book.id}-exp`} className="bg-blue-50">
                      <td />
                      <td colSpan={4} className="px-4 py-4">
                        <div className="flex gap-6 flex-wrap">
                          {/* Description */}
                          <div className="flex-1 min-w-64">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Описание
                            </label>
                            <textarea
                              defaultValue={book.description ?? ""}
                              rows={4}
                              onBlur={(e) =>
                                handleDescriptionBlur(book, e.target.value)
                              }
                              placeholder="Описание товара..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Photo */}
                          <div className="w-48">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Обложка
                            </label>
                            {book.cover_image_url ? (
                              <img
                                src={book.cover_image_url}
                                alt={book.title_ru}
                                className="w-32 h-40 object-cover rounded-lg border border-gray-200 mb-2"
                              />
                            ) : (
                              <div className="w-32 h-40 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs mb-2">
                                Нет фото
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => {
                                fileInputRefs.current[book.id] = el;
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(book, file);
                              }}
                            />
                            <button
                              onClick={() =>
                                fileInputRefs.current[book.id]?.click()
                              }
                              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md px-3 py-1.5 transition-colors"
                            >
                              <Upload size={12} />
                              Загрузить фото
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {books.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Товары не найдены
          </div>
        )}
      </div>
    </div>
  );
}
