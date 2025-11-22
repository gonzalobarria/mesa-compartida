"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { Home, Ticket } from "lucide-react"

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

export function FooterNav() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("nav")

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: t("search"),
      href: `/${locale}`,
    },
    {
      icon: Ticket,
      label: t("vouchers"),
      href: `/${locale}/vouchers`,
    },
  ]

  const isActive = (href: string) => {
    // Remove locale from pathname for comparison
    const pathWithoutLocale = pathname.replace(`/${locale}`, "")
    if (href === `/${locale}`) {
      return pathWithoutLocale === "" || pathWithoutLocale === "/"
    }
    return pathWithoutLocale.startsWith(href.replace(`/${locale}`, ""))
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:hidden">
      <div className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors ${
                active
                  ? "text-primary"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
