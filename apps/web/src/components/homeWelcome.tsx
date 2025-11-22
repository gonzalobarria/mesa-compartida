"use client";

import { Utensils, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useUserStore } from "@/stores/userStore";

interface HomeWelcomeProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function HomeWelcome({
  searchQuery = "",
  onSearchChange,
}: HomeWelcomeProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const setRole = useUserStore((state) => state.setRole);

  const handleLogoClick = () => {
    setRole("none");
    router.push(`/${locale}`);
  };

  return (
    <div className="w-full">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Utensils className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex flex-col gap-1 w-20">
                <h1 className="text-lg font-bold text-gray-900 leading-5">
                  Mesa Compartida
                </h1>
              </div>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={t("search.searchPlates")}
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
