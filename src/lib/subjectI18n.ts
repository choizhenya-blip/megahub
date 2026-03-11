/** Shared subject (предмет/категория) localisation — used by cart, catalog, home page. */

export const SUBJECT_I18N: Record<string, { ru: string; kz: string; en: string }> = {
  "Математика":  { ru: "Математика",  kz: "Математика",  en: "Mathematics" },
  "История":     { ru: "История",     kz: "Тарих",        en: "History" },
  "Химия":       { ru: "Химия",       kz: "Химия",        en: "Chemistry" },
  "Литература":  { ru: "Литература",  kz: "Әдебиет",      en: "Literature" },
  "Физика":      { ru: "Физика",      kz: "Физика",       en: "Physics" },
  "Биология":    { ru: "Биология",    kz: "Биология",     en: "Biology" },
  "География":   { ru: "География",   kz: "География",    en: "Geography" },
  "Информатика": { ru: "Информатика", kz: "Информатика",  en: "Computer Science" },
  "Алгебра":     { ru: "Алгебра",     kz: "Алгебра",      en: "Algebra" },
  "Геометрия":   { ru: "Геометрия",   kz: "Геометрия",    en: "Geometry" },
  "Казахский язык":  { ru: "Казахский язык",  kz: "Қазақ тілі",  en: "Kazakh Language" },
  "Русский язык":    { ru: "Русский язык",    kz: "Орыс тілі",   en: "Russian Language" },
  "Английский язык": { ru: "Английский язык", kz: "Ағылшын тілі", en: "English Language" },
};

/**
 * Build a `{ ru, kz, en }` subjects object from the Russian subject name
 * (the canonical form stored in Supabase / mock data).
 * Falls back to the raw string for unknown subjects.
 */
export function buildSubjects(subjectRu: string): { ru: string; kz: string; en: string } {
  const entry = SUBJECT_I18N[subjectRu];
  if (entry) return entry;
  // Unknown subject — pass through as-is in all locales
  return { ru: subjectRu, kz: subjectRu, en: subjectRu };
}

/** Resolve the display string for the current locale. */
export function getSubjectLocalized(
  subjects: { ru: string; kz: string; en: string },
  lang: string
): string {
  const l = lang.toLowerCase() as "ru" | "kz" | "en";
  return subjects[l] || subjects.ru;
}
