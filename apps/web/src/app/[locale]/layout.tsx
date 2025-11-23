import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { WalletProvider } from "@/components/wallet-provider";
import { FooterNav } from "@/components/footerNav";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <WalletProvider>
              <main className="flex-1 pb-20 md:pb-0">
                {children}
              </main>
              <FooterNav />
            </WalletProvider>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
