import { ru } from "./messages/ru";
import { kz } from "./messages/kz";
import { en } from "./messages/en";

export type Language = "RU" | "KZ" | "EN";

export const MESSAGES = {
  RU: ru,
  KZ: kz,
  EN: en,
} as const;

export type Messages = (typeof MESSAGES)[Language];

export function getMessages(lang: Language): Messages {
  return MESSAGES[lang] ?? MESSAGES.RU;
}

