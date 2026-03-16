export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Загрузка…</span>
      </div>
    </div>
  );
}
