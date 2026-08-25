/**
 * Strings are whole sentences rather than templates with an {entity}
 * placeholder: Spanish and French inflect adjectives for the gender of the noun
 * ("Escuelas aprobadas" vs "Centros de salud aprobados"), so interpolating an
 * entity name into a translated sentence produces wrong grammar.
 */
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";

export const SUPPORTED_LANGUAGES = ["en", "es", "fr"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const LOCALE_TAG: Record<Language, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
};

export type EntityKey = "schools" | "healthCenters";

type Catalogue = Record<string, unknown>;

const CATALOGUES: Record<Language, Catalogue> = { en, es, fr };

export function isSupportedLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

function lookup(catalogue: Catalogue, dottedKey: string): string | undefined {
  let node: unknown = catalogue;
  for (const part of dottedKey.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Resolves a dotted key, falling back to English per key. */
export function t(language: Language, key: string): string {
  const translated = lookup(CATALOGUES[language], key);
  if (translated !== undefined) return translated;

  const english = lookup(CATALOGUES.en, key);
  if (english !== undefined) return english;

  console.warn(`[i18n] missing translation key: ${key}`);
  return key;
}

export function entityText(
  language: Language,
  entity: EntityKey,
  key: string,
): string {
  return t(language, `entity.${entity}.${key}`);
}
