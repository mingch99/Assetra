import { en, type MessageKey } from "./en";
import { zh } from "./zh";
import type { Locale } from "../types";

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en,
  zh,
};

export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const template = messages[locale][key] ?? messages.en[key] ?? String(key);
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template
  );
}
