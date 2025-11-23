"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";

interface HomeWelcomeProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function HomeWelcome({
  searchQuery = "",
  onSearchChange,
}: HomeWelcomeProps) {
  const router = useRouter();
  const setRole = useUserStore((state) => state.setRole);

  const handleLogoClick = () => {
    setRole("none");
    router.push(`/`);
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
              <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                <Image src="/mesa-mini.png" alt="Mesa Compartida" width={72} height={72} />
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
              placeholder="Search plates..."
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
