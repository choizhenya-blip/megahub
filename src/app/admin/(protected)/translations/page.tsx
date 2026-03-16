import TranslationsPanel from "./TranslationsPanel";
import { ru } from "@/i18n/messages/ru";
import { kz } from "@/i18n/messages/kz";
import { en } from "@/i18n/messages/en";

export const dynamic = "force-dynamic";
export const metadata = { title: "Переводы — Панель управления" };

// Flatten deeply nested object to dot-notation Record<string, string>
function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "string") {
      result[fullKey] = val;
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === "string") {
          result[`${fullKey}.${i}`] = item;
        } else if (typeof item === "object" && item !== null) {
          Object.assign(result, flatten(item as Record<string, unknown>, `${fullKey}.${i}`));
        }
      });
    } else if (typeof val === "object" && val !== null) {
      Object.assign(result, flatten(val as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

export default function AdminTranslationsPage() {
  const defaultMessages = {
    ru: flatten(ru as unknown as Record<string, unknown>),
    kz: flatten(kz as unknown as Record<string, unknown>),
    en: flatten(en as unknown as Record<string, unknown>),
  };

  return <TranslationsPanel defaultMessages={defaultMessages} />;
}
