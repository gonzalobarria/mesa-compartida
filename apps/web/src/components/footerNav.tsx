"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Ticket } from "lucide-react"

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

export function FooterNav() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: "Search",
      href: `/`,
    },
    {
      icon: Ticket,
      label: "Vouchers",
      href: `/vouchers`,
    },
  ]

  const isActive = (href: string) => {
    // Remove locale from pathname for comparison
    const pathWithoutLocale = pathname.replace(`/`, "")
    if (href === `/`) {
      return pathWithoutLocale === "" || pathWithoutLocale === "/"
    }
    return pathWithoutLocale.startsWith(href.replace(`/`, ""))
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
