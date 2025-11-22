import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const locales = ["en", "es"];

export function isValidLocale(locale: any): locale is (typeof locales)[number] {
  return locales.includes(locale);
}

export default getRequestConfig(async ({ locale }) => {
  if (!isValidLocale(locale)) {
    notFound();
  }

  return {
    messages: (
      await import(`../messages/${locale}.json`)
    ).default,
  };
});
